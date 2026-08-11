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
