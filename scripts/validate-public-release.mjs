import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const IGNORED_DIRECTORIES = new Set([".git", "node_modules"]);
const UTF8_DECODER = new TextDecoder("utf-8", { fatal: true });

const privateKeyPattern = new RegExp(
  ["-----BEGIN ", "(?:RSA |EC |OPENSSH )?PRIVATE KEY-----"].join(""),
  "i",
);

const LINE_RULES = [
  {
    rule: "private-key",
    pattern: privateKeyPattern,
  },
  {
    rule: "authorization-header",
    pattern: /\bauthorization\s*:\s*(?:bearer|basic)\s+\S+/i,
  },
  {
    rule: "token-assignment",
    pattern:
      /\b(?:api[_-]?key|access[_-]?token|refresh[_-]?token|secret[_-]?key)\b\s*[:=]\s*["']?[A-Za-z0-9_./+=-]{12,}/i,
  },
  {
    rule: "credential-url-query",
    pattern:
      /[?&](?:api[_-]?key|access[_-]?token|refresh[_-]?token|secret[_-]?key|token|password|signature)=[^&#\s]+/i,
  },
  {
    rule: "openai-token",
    pattern: /\bsk-(?:proj-|svcacct-)?[A-Za-z0-9_-]{16,}\b/,
  },
  {
    rule: "github-token",
    pattern: /\bgh[pousr]_[A-Za-z0-9]{20,}\b/,
  },
  {
    rule: "aws-access-key",
    pattern: /\b(?:AKIA|ASIA)[A-Z0-9]{16}\b/,
  },
  {
    rule: "slack-token",
    pattern: /\bxox[baprs](?:-[A-Za-z0-9]+){2,}\b/,
  },
  {
    rule: "cookie-header",
    pattern: /\bcookie\s*:\s*[A-Za-z0-9_.-]+=/i,
  },
  {
    rule: "personal-email",
    pattern: /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i,
  },
  {
    rule: "windows-absolute-path",
    pattern: /(?:\b[A-Z]:\\|\\\\[^\\\s]+\\[^\\\s]+\\)/i,
  },
  {
    rule: "posix-home-path",
    pattern: /\/(?:Users|home)\/[^/\s]+\//,
  },
  {
    rule: "uuid-like-id",
    pattern: /\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/i,
  },
];

function asPath(value) {
  return value instanceof URL ? fileURLToPath(value) : path.resolve(String(value));
}

function normalizeRelative(value) {
  return value.split(path.sep).join("/");
}

async function loadConfiguredAllowlist(root) {
  const configPath = path.join(root, ".public-release-allowlist.json");
  try {
    const config = JSON.parse(await readFile(configPath, "utf8"));
    if (!Array.isArray(config.files)) return [];
    return config.files
      .map((entry) => (typeof entry === "string" ? entry : entry?.path))
      .filter((entry) => typeof entry === "string")
      .map((entry) => normalizeRelative(entry));
  } catch (error) {
    if (error?.code === "ENOENT") return [];
    return [];
  }
}

async function collectFiles(root) {
  const files = [];

  async function visit(directory) {
    const entries = await readdir(directory, { withFileTypes: true });
    entries.sort((left, right) => left.name.localeCompare(right.name));

    for (const entry of entries) {
      if (entry.isDirectory() && IGNORED_DIRECTORIES.has(entry.name)) continue;

      const absolute = path.join(directory, entry.name);
      if (entry.isDirectory()) {
        await visit(absolute);
      } else if (entry.isFile()) {
        files.push(absolute);
      }
    }
  }

  await visit(root);
  return files;
}

function isPublicIpv4(candidate) {
  const octets = candidate.split(".").map(Number);
  if (octets.length !== 4 || octets.some((value) => value < 0 || value > 255)) {
    return false;
  }

  const [a, b] = octets;
  if (a === 0 || a === 10 || a === 127 || a >= 224) return false;
  if (a === 100 && b >= 64 && b <= 127) return false;
  if (a === 169 && b === 254) return false;
  if (a === 172 && b >= 16 && b <= 31) return false;
  if (a === 192 && b === 168) return false;
  if (a === 192 && b === 0 && (octets[2] === 0 || octets[2] === 2)) return false;
  if (a === 198 && (b === 18 || b === 19)) return false;
  if (a === 198 && b === 51 && octets[2] === 100) return false;
  if (a === 203 && b === 0 && octets[2] === 113) return false;
  return true;
}

function scanText(text, relativeFile, privateMarkers) {
  const findings = [];
  const lines = text.split(/\r?\n/);

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    for (const { rule, pattern } of LINE_RULES) {
      if (pattern.test(line)) {
        findings.push({ file: relativeFile, line: index + 1, rule });
      }
    }

    const ipv4Candidates = line.match(/\b(?:\d{1,3}\.){3}\d{1,3}\b/g) ?? [];
    if (ipv4Candidates.some(isPublicIpv4)) {
      findings.push({ file: relativeFile, line: index + 1, rule: "public-ipv4" });
    }

    if (privateMarkers.some((marker) => marker && line.includes(marker))) {
      findings.push({ file: relativeFile, line: index + 1, rule: "private-marker" });
    }
  }

  return findings;
}

export async function validateRepository(rootValue, options = {}) {
  const root = asPath(rootValue);
  const configuredAllowlist = options.loadConfiguredAllowlist === false
    ? []
    : await loadConfiguredAllowlist(root);
  const allowlist = new Set([
    ...configuredAllowlist,
    ...(options.allowlist ?? []).map(normalizeRelative),
  ]);
  const privateMarkers = options.privateMarkers ?? [];
  const findings = [];
  let filesChecked = 0;

  for (const absoluteFile of await collectFiles(root)) {
    const relativeFile = normalizeRelative(path.relative(root, absoluteFile));
    if (allowlist.has(relativeFile)) continue;

    let text;
    try {
      text = UTF8_DECODER.decode(await readFile(absoluteFile));
    } catch {
      findings.push({ file: relativeFile, line: 1, rule: "invalid-utf8" });
      continue;
    }

    filesChecked += 1;
    findings.push(...scanText(text, relativeFile, privateMarkers));
  }

  return { findings, filesChecked };
}

function formatFinding({ file, line, rule }) {
  return `${file}:${line} [${rule}]`;
}

async function runCli() {
  const root = process.argv[2] ?? ".";
  const result = await validateRepository(root);

  if (result.findings.length > 0) {
    for (const finding of result.findings) {
      console.error(formatFinding(finding));
    }
    process.exitCode = 1;
    return;
  }

  console.log(`Public release validation passed (${result.filesChecked} files checked).`);
}

if (import.meta.url === pathToFileURL(path.resolve(process.argv[1] ?? "")).href) {
  await runCli();
}
