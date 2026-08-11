import { mkdtemp, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const cli = path.join(root, "bin", "control-tower.mjs");
const plan = path.join(root, "examples", "synthetic-plan.json");
const workspace = await mkdtemp(path.join(os.tmpdir(), "codex-control-tower-demo-"));
const state = path.join(workspace, "state.json");
const handoff = path.join(workspace, "handoff.md");

function run(...args) {
  const result = spawnSync(process.execPath, [cli, ...args], {
    cwd: root,
    encoding: "utf8",
  });

  if (result.stdout.trim()) console.log(result.stdout.trim());
  if (result.status !== 0) {
    if (result.stderr.trim()) console.error(result.stderr.trim());
    throw new Error(`demo command failed with exit code ${result.status}`);
  }
}

try {
  console.log("\n1. Initialize the synthetic task graph");
  run("init", plan, "--state", state);

  console.log("\n2. Record inspectable synthetic evidence");
  run(
    "record",
    "--state", state,
    "--task", "contract",
    "--type", "complete",
    "--evidence", "Synthetic contract test captured the requested JSON shape",
  );
  run(
    "record",
    "--state", state,
    "--task", "implementation",
    "--type", "complete",
    "--evidence", "Synthetic focused and text-output regression checks passed",
  );

  console.log("\n3. Evaluate the verification gate");
  run("verify", "--state", state);

  console.log("\n4. Generate a sanitized continuation record");
  run("handoff", "--state", state, "--output", handoff);
  const contents = await readFile(handoff, "utf8");
  console.log(contents.trim());
  console.log("\nDemo completed with synthetic data only.");
} finally {
  await rm(workspace, { recursive: true, force: true });
}
