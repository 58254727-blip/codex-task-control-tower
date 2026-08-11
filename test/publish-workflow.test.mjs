import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);

async function read(relativePath) {
  return readFile(new URL(relativePath, root), "utf8");
}

test("npm publishing uses a bounded tokenless OIDC workflow", async () => {
  const workflow = await read(".github/workflows/publish.yml");

  assert.match(workflow, /release:\s*\r?\n\s+types: \[published\]/);
  assert.match(workflow, /id-token: write/);
  assert.match(workflow, /actions\/checkout@v6/);
  assert.match(workflow, /actions\/setup-node@v6/);
  assert.match(workflow, /node-version: ["']?24["']?/);
  assert.match(workflow, /package-manager-cache: false/);
  assert.match(workflow, /GITHUB_REF_NAME/);
  assert.match(workflow, /npm run release:check/);
  assert.match(workflow, /run: npm publish/);

  assert.doesNotMatch(workflow, /NODE_AUTH_TOKEN/);
  assert.doesNotMatch(workflow, /NPM_TOKEN/);
  assert.doesNotMatch(workflow, /secrets\./);
});

test("public documentation exposes the published npm entry point", async () => {
  const readme = await read("README.md");
  const readmeZh = await read("README.zh-CN.md");

  for (const source of [readme, readmeZh]) {
    assert.match(source, /npmjs\.com\/package\/codex-task-control-tower/);
    assert.match(source, /npx --yes codex-task-control-tower@latest --help/);
    assert.match(source, /npm install --global codex-task-control-tower/);
  }
});
