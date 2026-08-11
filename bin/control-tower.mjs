#!/usr/bin/env node

import { access, mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";

import {
  ControlTowerError,
  createHandoff,
  createRun,
  createStatusSnapshot,
  getGateResult,
  recordEvent,
} from "../src/control-tower.mjs";

const HELP = `Codex Task Control Tower

Usage:
  codex-control-tower init <plan.json> [--state <state.json>] [--force]
  codex-control-tower status [--state <state.json>] [--json]
  codex-control-tower record --task <id> --type <type> [options]
  codex-control-tower verify [--state <state.json>] [--json]
  codex-control-tower handoff [--state <state.json>] --output <handoff.md>

Record options:
  --state <state.json>       State file (default: .control-tower/state.json)
  --evidence <summary>       Inspectable evidence or blocker details
  --failure-key <key>        Stable root-cause key for failure events
  --at <ISO timestamp>       Optional explicit evidence time

Event types: start, evidence, complete, failure, block, unverified, resume
`;

function parseArguments(values) {
  const positionals = [];
  const options = new Map();

  for (let index = 0; index < values.length; index += 1) {
    const value = values[index];
    if (!value.startsWith("--")) {
      positionals.push(value);
      continue;
    }

    const name = value.slice(2);
    if (name === "json" || name === "help" || name === "force") {
      options.set(name, true);
      continue;
    }

    const next = values[index + 1];
    if (!next || next.startsWith("--")) {
      throw new ControlTowerError(`missing value for --${name}`);
    }
    options.set(name, next);
    index += 1;
  }

  return { positionals, options };
}

function requiredOption(options, name) {
  const value = options.get(name);
  if (!value) throw new ControlTowerError(`--${name} is required`);
  return value;
}

function statePath(options) {
  return path.resolve(options.get("state") ?? path.join(".control-tower", "state.json"));
}

async function readJson(file) {
  try {
    return JSON.parse(await readFile(file, "utf8"));
  } catch (error) {
    if (error instanceof SyntaxError) throw new ControlTowerError(`invalid JSON: ${file}`);
    if (error?.code === "ENOENT") throw new ControlTowerError(`file not found: ${file}`);
    throw error;
  }
}

async function fileExists(file) {
  try {
    await access(file);
    return true;
  } catch (error) {
    if (error?.code === "ENOENT") return false;
    throw error;
  }
}

async function writeTextAtomic(file, contents) {
  await mkdir(path.dirname(file), { recursive: true });
  const temporary = `${file}.${process.pid}.${Date.now()}.tmp`;
  await writeFile(temporary, contents, "utf8");
  await rename(temporary, file);
}

async function writeJsonAtomic(file, value) {
  await writeTextAtomic(file, `${JSON.stringify(value, null, 2)}\n`);
}

function printSnapshot(run) {
  const snapshot = createStatusSnapshot(run);
  console.log(`Objective: ${snapshot.objective}`);
  console.log(`Gate: ${snapshot.gate.result} (${snapshot.gate.completed}/${snapshot.gate.total})`);
  for (const task of snapshot.tasks) {
    const evidence = task.latestEvidence ? ` | ${task.latestEvidence}` : "";
    console.log(`${task.id}: ${task.status}${evidence}`);
  }
}

async function main() {
  const command = process.argv[2];
  const { positionals, options } = parseArguments(process.argv.slice(3));

  if (!command || command === "help" || command === "--help" || options.has("help")) {
    console.log(HELP);
    return;
  }

  if (command === "init") {
    if (positionals.length !== 1) throw new ControlTowerError("init requires one plan.json path");
    const output = statePath(options);
    if (!options.has("force") && await fileExists(output)) {
      throw new ControlTowerError(`state already exists: ${output}; use --force to replace it`);
    }
    const run = createRun(await readJson(path.resolve(positionals[0])));
    await writeJsonAtomic(output, run);
    printSnapshot(run);
    console.log(`State: ${output}`);
    return;
  }

  const file = statePath(options);
  const run = await readJson(file);

  if (command === "status") {
    const snapshot = createStatusSnapshot(run);
    if (options.has("json")) console.log(JSON.stringify(snapshot, null, 2));
    else printSnapshot(run);
    return;
  }

  if (command === "record") {
    const next = recordEvent(run, {
      taskId: requiredOption(options, "task"),
      type: requiredOption(options, "type"),
      evidence: options.get("evidence"),
      failureKey: options.get("failure-key"),
      at: options.get("at"),
    });
    await writeJsonAtomic(file, next);
    printSnapshot(next);
    return;
  }

  if (command === "verify") {
    const gate = getGateResult(run);
    if (options.has("json")) console.log(JSON.stringify(gate, null, 2));
    else console.log(`Gate: ${gate.result} (${gate.completed}/${gate.total} completed)`);
    if (gate.result !== "passed") process.exitCode = 1;
    return;
  }

  if (command === "handoff") {
    const output = path.resolve(requiredOption(options, "output"));
    await writeTextAtomic(output, createHandoff(run));
    console.log(`Sanitized handoff: ${output}`);
    return;
  }

  throw new ControlTowerError(`unknown command: ${command}`);
}

try {
  await main();
} catch (error) {
  if (error instanceof ControlTowerError) {
    console.error(`Error: ${error.message}`);
  } else {
    console.error(error?.stack ?? String(error));
  }
  process.exitCode = 2;
}
