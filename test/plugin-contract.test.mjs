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

test("task-control-tower exposes a narrow read-only evidence contract", async () => {
  const source = await read("skills/task-control-tower/SKILL.md");
  const frontmatter = readFrontmatter(source);

  assert.equal(frontmatter.get("name"), "task-control-tower");
  assert.match(frontmatter.get("description") ?? "", /^Use when /);

  for (const status of ["completed", "in_progress", "blocked", "unverified"]) {
    assert.match(source, new RegExp(`\\b${status}\\b`));
  }

  for (const evidence of [
    "file change",
    "command",
    "test",
    "commit",
    "runtime",
    "agent",
    "receipt",
  ]) {
    assert.match(source.toLowerCase(), new RegExp(evidence));
  }

  assert.match(source, /active.*not proof/i);
  assert.match(source, /idle.*not proof/i);
  assert.match(source, /20 minutes/i);
  assert.match(source, /30 minutes/i);
  assert.match(source, /retry once/i);
  assert.match(source, /two equivalent failures/i);
  assert.match(source, /manual status template/i);
  assert.match(source, /do not message/i);
  assert.match(source, /do not stop/i);
  assert.match(source, /do not modify/i);
  assert.match(source, /evidence time/i);
});

test("task-control-tower ships a fully synthetic scenario", async () => {
  const scenario = await read("test/scenarios/task-control-tower.md");

  for (const taskName of ["Task Alpha", "Task Beta", "Task Gamma"]) {
    assert.match(scenario, new RegExp(taskName));
  }
  assert.match(scenario, /synthetic/i);
});

test("status board template contains the evidence-backed columns", async () => {
  const template = await read("templates/status-board.md");

  for (const heading of ["Status", "Evidence", "Evidence time", "Next step"]) {
    assert.match(template, new RegExp(heading, "i"));
  }
});

test("task-handoff exposes a compact sanitized continuation contract", async () => {
  const source = await read("skills/task-handoff/SKILL.md");
  const frontmatter = readFrontmatter(source);

  assert.equal(frontmatter.get("name"), "task-handoff");
  assert.match(frontmatter.get("description") ?? "", /^Use when /);

  for (const field of [
    "Objective",
    "Current scope",
    "Verified completed",
    "Latest evidence",
    "Blocker or user action",
    "Frozen boundaries",
    "Next safe step",
  ]) {
    assert.match(source, new RegExp(field, "i"));
  }

  assert.match(source, /do not include raw conversation/i);
  assert.match(source, /credentials/i);
  assert.match(source, /private data/i);
  assert.match(source, /identifiers only when explicitly requested/i);
  assert.match(source, /never invent/i);
});

test("task handoff template and scenario stay generic", async () => {
  const template = await read("templates/task-handoff.md");
  const scenario = await read("test/scenarios/task-handoff.md");

  for (const heading of [
    "Objective",
    "Current scope",
    "Verified completed",
    "Latest evidence",
    "Blocker or user action",
    "Frozen boundaries",
    "Next safe step",
  ]) {
    assert.match(template, new RegExp(heading, "i"));
  }

  assert.match(scenario, /Source Task/i);
  assert.match(scenario, /Destination Task/i);
  assert.match(scenario, /synthetic/i);
});

test("public documentation covers installation, privacy, and verification", async () => {
  const readme = await read("README.md");
  const readmeZh = await read("README.zh-CN.md");
  const contributing = await read("CONTRIBUTING.md");
  const security = await read("SECURITY.md");
  const license = await read("LICENSE");
  const checklist = await read("docs/public-release-checklist.md");

  for (const heading of ["Features", "Install", "Usage", "Privacy"]) {
    assert.match(readme, new RegExp(heading, "i"));
  }
  assert.match(readmeZh, /任务控制塔/);
  assert.match(readmeZh, /脱敏交接/);
  assert.match(contributing, /npm test/i);
  assert.match(contributing, /validate:public/i);
  assert.match(security, /private vulnerability reporting/i);
  assert.match(license, /MIT License/);
  assert.match(checklist, /npm test/i);
  assert.match(checklist, /validate:public/i);
});

test("plugin manifest stays local-only and secret-free by design", async () => {
  const manifest = JSON.parse(await read(".codex-plugin/plugin.json"));

  assert.equal(manifest.skills, "./skills/");
  assert.equal("mcpServers" in manifest, false);
  assert.equal("apps" in manifest, false);
  assert.equal("hooks" in manifest, false);
  assert.equal(JSON.stringify(manifest).toLowerCase().includes("api_key"), false);
});
