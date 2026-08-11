import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);

async function read(relativePath) {
  return readFile(new URL(relativePath, root), "utf8");
}

function readFrontmatter(source) {
  const match = source.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  assert.ok(match, "skill must start with YAML frontmatter");

  const values = new Map();
  for (const line of match[1].split(/\r?\n/)) {
    const separator = line.indexOf(":");
    if (separator === -1) continue;
    values.set(line.slice(0, separator).trim(), line.slice(separator + 1).trim());
  }
  return values;
}

async function readSkill(name) {
  const source = await read(`skills/${name}/SKILL.md`);
  const frontmatter = readFrontmatter(source);
  assert.equal(frontmatter.get("name"), name);
  assert.match(frontmatter.get("description") ?? "", /^Use when /);
  return source;
}

test("development-planner defines the smallest sufficient dependency graph", async () => {
  const source = await readSkill("development-planner");

  for (const field of [
    "Outcome",
    "Dependencies",
    "Write scope",
    "Success criteria",
    "Verification",
    "Stop condition",
  ]) {
    assert.match(source, new RegExp(field, "i"));
  }

  assert.match(source, /smallest sufficient/i);
  assert.match(source, /do not split/i);
  assert.match(source, /dependency-ready/i);
  assert.match(source, /unknown.*unverified/i);
});

test("skill-router selects one available primary skill without false invocation claims", async () => {
  const source = await readSkill("skill-router");

  assert.match(source, /available skills/i);
  assert.match(source, /one primary skill/i);
  assert.match(source, /no-skill fallback/i);
  assert.match(source, /unavailable.*not invoked/i);
  assert.match(source, /distinct stage or risk/i);
  assert.match(source, /does not install/i);
});

test("execution-controller is the bounded end-to-end orchestration entry point", async () => {
  const source = await readSkill("execution-controller");

  assert.match(source, /end-to-end entry point/i);
  assert.match(source, /dependency-ready/i);
  assert.match(source, /critical path/i);
  assert.match(source, /write scopes do not overlap/i);
  assert.match(source, /runtime permits/i);
  assert.match(source, /evidence ledger/i);
  assert.match(source, /two equivalent failures/i);
  assert.match(source, /third blind attempt/i);
  assert.match(source, /safe checkpoint/i);
  assert.match(source, /system and user boundaries/i);
  assert.match(source, /codex-control-tower/i);
  assert.match(source, /optional local evidence ledger/i);
  assert.match(source, /does not replace judgment/i);
});

test("verification-gate refuses completion without outcome evidence", async () => {
  const source = await readSkill("verification-gate");

  for (const check of [
    "original behavior",
    "focused tests",
    "regression",
    "privacy",
    "release",
  ]) {
    assert.match(source, new RegExp(check, "i"));
  }

  assert.match(source, /unavailable.*unverified/i);
  assert.match(source, /do not claim.*completed/i);
  assert.match(source, /inspectable evidence/i);
});

test("orchestration templates expose stable planning and verification fields", async () => {
  const plan = await read("templates/development-plan.md");
  const route = await read("templates/skill-route.md");
  const board = await read("templates/execution-board.md");
  const report = await read("templates/verification-report.md");

  for (const heading of [
    "Outcome",
    "Dependencies",
    "Write scope",
    "Success criteria",
    "Verification",
    "Stop condition",
  ]) {
    assert.match(plan, new RegExp(heading, "i"));
  }

  assert.match(route, /Primary Skill/i);
  assert.match(route, /Availability/i);
  assert.match(route, /Fallback/i);
  assert.match(board, /Latest evidence/i);
  assert.match(board, /Attempt count/i);
  assert.match(report, /Gate result/i);
  assert.match(report, /Remaining risk/i);
});

test("synthetic orchestration scenario covers the complete bounded workflow", async () => {
  const scenario = await read("test/scenarios/development-orchestration.md");

  for (const stage of [
    "planning",
    "routing",
    "execution",
    "failure handling",
    "verification",
    "handoff",
  ]) {
    assert.match(scenario, new RegExp(stage, "i"));
  }

  assert.match(scenario, /synthetic/i);
  assert.match(scenario, /no real repository/i);
});

test("v0.3.1 manifest and documentation expose runnable orchestration without a daemon", async () => {
  const manifest = JSON.parse(await read(".codex-plugin/plugin.json"));
  const packageJson = JSON.parse(await read("package.json"));
  const readme = await read("README.md");
  const readmeZh = await read("README.zh-CN.md");

  assert.equal(manifest.version, "0.3.1");
  assert.equal(packageJson.version, "0.3.1");
  assert.equal(manifest.interface.capabilities.length, 8);
  assert.match(manifest.interface.longDescription, /plan/i);
  assert.match(manifest.interface.longDescription, /Skill/i);
  assert.match(manifest.interface.longDescription, /verify/i);
  assert.match(readme, /execution-controller/i);
  assert.match(readme, /not a background daemon/i);
  assert.match(readme, /runnable local CLI/i);
  assert.match(readmeZh, /模型指导下拆解/);
  assert.match(readmeZh, /不是后台守护进程/);
  assert.match(readmeZh, /可运行的本地 CLI/);
});

test("npm package exposes the zero-dependency control tower CLI", async () => {
  const packageJson = JSON.parse(await read("package.json"));

  assert.equal(packageJson.bin["codex-control-tower"], "bin/control-tower.mjs");
  assert.equal(packageJson.scripts.demo, "node scripts/run-runtime-demo.mjs");
  assert.deepEqual(packageJson.files, [
    ".codex-plugin/",
    "bin/",
    "docs/",
    "examples/",
    "scripts/",
    "skills/",
    "src/",
    "templates/",
    "README.md",
    "README.zh-CN.md",
    "LICENSE",
  ]);
});
