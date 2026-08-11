import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { access, mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
function run(command, args, cwd, options = {}) {
  const result = spawnSync(command, args, {
    cwd,
    encoding: "utf8",
    env: { ...process.env, NO_COLOR: "1", ...options.env },
    shell: options.shell ?? false,
  });
  if (result.status !== 0) {
    throw new Error([
      `${command} ${args.join(" ")} failed with code ${result.status}`,
      result.stdout,
      result.stderr,
    ].filter(Boolean).join("\n"));
  }
  return result.stdout.trim();
}

function runNpm(args, cwd) {
  const adjacentNpm = path.join(
    path.dirname(process.execPath),
    "node_modules",
    "npm",
    "bin",
    "npm-cli.js",
  );
  const npmCli = process.env.npm_execpath
    ?? (existsSync(adjacentNpm) ? adjacentNpm : null);
  const options = { env: { npm_config_cache: path.join(workspace, "npm-cache") } };
  if (npmCli) {
    return run(process.execPath, [npmCli, ...args], cwd, options);
  }
  return run("npm", args, cwd, {
    ...options,
    shell: process.platform === "win32",
  });
}

const workspace = await mkdtemp(path.join(os.tmpdir(), "control-tower-consumer-"));
const packageDirectory = path.join(workspace, "package");
const consumerDirectory = path.join(workspace, "consumer");

try {
  await mkdir(packageDirectory);
  await mkdir(consumerDirectory);

  const packed = JSON.parse(runNpm(
    ["pack", root, "--json", "--pack-destination", packageDirectory],
    root,
  ));
  const tarball = path.join(packageDirectory, packed[0].filename);
  await access(tarball);

  runNpm(["init", "--yes"], consumerDirectory);
  runNpm([
    "install", tarball, "--ignore-scripts", "--no-audit", "--no-fund", "--offline",
  ], consumerDirectory);

  const installedManifest = JSON.parse(await readFile(
    path.join(consumerDirectory, "node_modules", "codex-task-control-tower", "package.json"),
    "utf8",
  ));
  if (installedManifest.name !== "codex-task-control-tower") {
    throw new Error("installed package manifest has the wrong name");
  }

  const planPath = path.join(consumerDirectory, "plan.json");
  const statePath = path.join(consumerDirectory, "state.json");
  await writeFile(planPath, `${JSON.stringify({
    objective: "Run a packaged synthetic smoke test",
    boundaries: ["Use synthetic data only"],
    tasks: [{
      id: "smoke",
      outcome: "Initialize an installed-package ledger",
      dependencies: [],
      writeScope: ["state.json"],
      successCriteria: ["The installed CLI creates state"],
      verification: ["codex-control-tower status --json"],
      stopCondition: "The installed CLI is unavailable",
    }],
  }, null, 2)}\n`, "utf8");

  const execPrefix = ["exec", "--offline", "--", "codex-control-tower"];
  runNpm([...execPrefix, "--help"], consumerDirectory);
  runNpm([...execPrefix, "init", planPath, "--state", statePath], consumerDirectory);
  const snapshot = JSON.parse(runNpm(
    [...execPrefix, "status", "--state", statePath, "--json"],
    consumerDirectory,
  ));
  if (snapshot.tasks[0]?.status !== "ready") {
    throw new Error("installed CLI did not expose the synthetic task as ready");
  }

  console.log(`Consumer install smoke passed on ${process.platform} with Node ${process.version}.`);
} finally {
  await rm(workspace, { recursive: true, force: true });
}
