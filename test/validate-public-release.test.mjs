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
    const queryKeys = [
      ["api", "key"].join("_"),
      ["access", "token"].join("-"),
      ["refresh", "token"].join("_"),
      ["secret", "key"].join("-"),
      ["CLIENT", "SECRET"].join("_"),
      ["auth", "token"].join("_"),
      ["session", "token"].join("-"),
      "token",
      "password",
      "signature",
      ["x", "amz", "signature"].join("-"),
      ["x", "goog", "credential"].join("-"),
    ];
    const secretValues = queryKeys.map((_, index) => `q${index}x`);
    const urls = queryKeys.map((queryKey, index) => {
      const separator = index === 9 ? "&" : "?";
      const prefix = separator === "&" ? "?page=1" : "";
      return `https://example.test/callback${prefix}${separator}${queryKey}=${secretValues[index]}`;
    });
    const encodedKey = ["access", "%5F", "token"].join("");
    urls.push(
      `https://example.test/callback?page=1&amp;${queryKeys[1]}=q12x`,
      `https://example.test/callback%3F${encodedKey}%3Dq13x`,
    );
    await writeFile(
      path.join(root, "url.txt"),
      urls.join("\n"),
      "utf8",
    );

    const result = await validateRepository(root);

    assert.deepEqual(result.findings, urls.map((_, index) => ({
      file: "url.txt",
      line: index + 1,
      rule: "credential-url-query",
    })));
    for (const value of [...secretValues, "q12x", "q13x"]) {
      assert.equal(JSON.stringify(result).includes(value), false);
    }
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("ordinary and empty URL query parameters remain allowed", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "control-tower-url-clean-"));
  try {
    const urls = [
      "https://example.test/items?page=2&sort=updated",
      "https://example.test/items?not_token=value&client_id=synthetic",
      "https://example.test/items?tokenize=true&password_policy=strict",
      "https://example.test/items?signature_algorithm=sha256",
      "https://example.test/items?token=&client_secret=",
    ];
    await writeFile(path.join(root, "urls.txt"), urls.join("\n"), "utf8");

    const result = await validateRepository(root);

    assert.deepEqual(result.findings, []);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
