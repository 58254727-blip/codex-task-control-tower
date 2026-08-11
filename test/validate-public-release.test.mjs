import assert from "node:assert/strict";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import { validateRepository } from "../scripts/validate-public-release.mjs";

const cleanFixture = new URL("./fixtures/clean/", import.meta.url);
const riskyFixture = new URL("./fixtures/risky/", import.meta.url);
const syntheticPrivateKey = [
  "-----BEGIN ",
  "PRIVATE KEY-----\n",
  "SYNTHETIC_SECRET_BODY\n",
  "-----END ",
  "PRIVATE KEY-----\n",
].join("");

test("clean synthetic fixture passes", async () => {
  const result = await validateRepository(cleanFixture);

  assert.deepEqual(result.findings, []);
  assert.equal(result.filesChecked, 1);
});

test("risky fixture reports a private key without echoing its content", async () => {
  const result = await validateRepository(riskyFixture);

  assert.equal(result.findings.some((finding) => finding.rule === "private-key"), true);
  assert.equal(JSON.stringify(result).includes("SYNTHETIC_SECRET_BODY"), false);
});

test("an explicit synthetic allowlist suppresses only the named file", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "control-tower-allowlist-"));
  try {
    await writeFile(
      path.join(root, "synthetic-secret.txt"),
      syntheticPrivateKey,
      "utf8",
    );

    const result = await validateRepository(root, {
      allowlist: ["synthetic-secret.txt"],
    });

    assert.deepEqual(result.findings, []);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("invalid UTF-8 fails closed", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "control-tower-utf8-"));
  try {
    await writeFile(path.join(root, "invalid.txt"), Buffer.from([0xc3, 0x28]));

    const result = await validateRepository(root);

    assert.equal(result.findings[0].rule, "invalid-utf8");
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
