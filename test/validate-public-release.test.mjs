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

test("documentation ranges are allowed but nearby public IPv4 addresses fail", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "control-tower-ipv4-"));
  try {
    const documentationAddresses = [
      [192, 0, 2, 10],
      [198, 51, 100, 10],
      [203, 0, 113, 10],
      [198, 18, 0, 10],
    ].map((parts) => parts.join("."));
    const publicAddresses = [
      [192, 0, 5, 10],
      [198, 51, 1, 10],
    ].map((parts) => parts.join("."));

    await writeFile(path.join(root, "documentation.txt"), documentationAddresses.join("\n"));
    await writeFile(path.join(root, "public.txt"), publicAddresses.join("\n"));

    const result = await validateRepository(root);
    const publicFindings = result.findings.filter((finding) => finding.rule === "public-ipv4");
    assert.deepEqual(
      publicFindings.map((finding) => [finding.file, finding.line]),
      [["public.txt", 1], ["public.txt", 2]],
    );
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("standalone provider tokens are detected without echoing their values", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "control-tower-tokens-"));
  try {
    const values = [
      ["sk", "proj", "syntheticvalue1234567890"].join("-"),
      ["ghp", "SyntheticValue12345678901234567890"].join("_"),
      ["AKIA", "SYNTHETICVALUE12"].join(""),
      ["xoxb", "123456789012", "synthetic-token-value"].join("-"),
    ];
    await writeFile(path.join(root, "tokens.txt"), values.join("\n"));

    const result = await validateRepository(root);
    assert.deepEqual(
      result.findings.map((finding) => finding.rule),
      ["openai-token", "github-token", "aws-access-key", "slack-token"],
    );
    for (const value of values) assert.equal(JSON.stringify(result).includes(value), false);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("credential-like URL query parameters are detected without echoing their values", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "control-tower-url-secret-"));
  try {
    const secretValue = "short";
    const queryKey = ["access", "token"].join("_");
    await writeFile(
      path.join(root, "url.txt"),
      `https://example.test/callback?${queryKey}=${secretValue}`,
      "utf8",
    );

    const result = await validateRepository(root);

    assert.deepEqual(
      result.findings.map((finding) => finding.rule),
      ["credential-url-query"],
    );
    assert.equal(JSON.stringify(result).includes(secretValue), false);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
