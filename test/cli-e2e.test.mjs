import assert from "node:assert/strict";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = new URL("../", import.meta.url);
const cli = fileURLToPath(new URL("../bin/control-tower.mjs", import.meta.url));
const fixture = new URL("../examples/synthetic-plan.json", import.meta.url);

function runCli(args, cwd) {
  return spawnSync(process.execPath, [cli, ...args], {
    cwd,
    encoding: "utf8",
    env: { ...process.env, NO_COLOR: "1" },
  });
}

test("CLI runs a complete local evidence workflow end to end", async () => {
  const directory = await mkdtemp(path.join(os.tmpdir(), "control-tower-e2e-"));
  const state = path.join(directory, "state.json");
  const handoff = path.join(directory, "handoff.md");

  try {
    const planPath = path.join(directory, "plan.json");
    await writeFile(planPath, await readFile(fixture), "utf8");

    let result = runCli(["init", planPath, "--state", state], directory);
    assert.equal(result.status, 0, result.stderr);
    assert.match(result.stdout, /contract/);

    result = runCli([
      "record", "--state", state, "--task", "contract", "--type", "complete",
      "--evidence", "Focused contract test passed",
    ], directory);
    assert.equal(result.status, 0, result.stderr);

    result = runCli([
      "record", "--state", state, "--task", "implementation", "--type", "complete",
      "--evidence", "Focused and regression tests passed",
    ], directory);
    assert.equal(result.status, 0, result.stderr);

    result = runCli(["verify", "--state", state, "--json"], directory);
    assert.equal(result.status, 0, result.stderr);
    assert.equal(JSON.parse(result.stdout).result, "passed");

    result = runCli(["handoff", "--state", state, "--output", handoff], directory);
    assert.equal(result.status, 0, result.stderr);
    assert.match(await readFile(handoff, "utf8"), /Gate result: `passed`/);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test("CLI returns a non-zero verification result for unfinished work", async () => {
  const directory = await mkdtemp(path.join(os.tmpdir(), "control-tower-open-"));
  const state = path.join(directory, "state.json");

  try {
    const result = runCli(["init", fileURLToPath(fixture), "--state", state], directory);
    assert.equal(result.status, 0, result.stderr);

    const verification = runCli(["verify", "--state", state, "--json"], directory);
    assert.equal(verification.status, 1);
    assert.equal(JSON.parse(verification.stdout).result, "unverified");
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test("CLI refuses to overwrite an existing state unless force is explicit", async () => {
  const directory = await mkdtemp(path.join(os.tmpdir(), "control-tower-init-"));
  const state = path.join(directory, "state.json");

  try {
    let result = runCli(["init", fileURLToPath(fixture), "--state", state], directory);
    assert.equal(result.status, 0, result.stderr);

    result = runCli(["init", fileURLToPath(fixture), "--state", state], directory);
    assert.equal(result.status, 2);
    assert.match(result.stderr, /already exists/);

    result = runCli(["init", fileURLToPath(fixture), "--state", state, "--force"], directory);
    assert.equal(result.status, 0, result.stderr);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
