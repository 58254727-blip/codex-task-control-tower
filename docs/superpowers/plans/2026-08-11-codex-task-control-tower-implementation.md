# Codex Task Control Tower Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build and publish a privacy-safe, installable Codex plugin for evidence-backed task status boards and compact handoffs.

**Architecture:** The repository is a skills-only Codex plugin with no server, MCP connection, account, or telemetry. A dependency-free Node.js validator checks structure, UTF-8 decoding, tracked-file privacy residue, and required behavioral contracts before release.

**Tech Stack:** Codex plugin manifest, Agent Skills Markdown, Node.js 18+ built-ins, `node:test`, Git, GitHub CLI.

## Global Constraints

- Never include real conversations, company data, credentials, cookies, tokens, keys, task IDs, personal email addresses, public IPs, or machine-specific absolute paths.
- Use only synthetic examples and fixtures.
- Do not add MCP, a hosted service, telemetry, account connections, or an API key requirement.
- The plugin remains read-only and never stops, messages, reprioritizes, or modifies inspected tasks.
- The release validator reports file, line, and rule only; it never echoes a suspected secret.
- Stop a failed task-read shape after one minimum-input retry and stop a materially equivalent failure path after two attempts.

---

### Task 1: Validator contract and plugin scaffold

**Files:** `package.json`, `.gitignore`, `.codex-plugin/plugin.json`, `test/validate-public-release.test.mjs`, and synthetic fixtures.

**Interface:** Tests import `validateRepository(root, options)` and expect `{ findings, filesChecked }`.

- [ ] Write failing tests for a clean fixture, risky fixture, output redaction, UTF-8 rejection, and allowlisting.
- [ ] Run `npm test` and confirm failure because the validator does not exist.
- [ ] Add the minimum valid plugin manifest and package scripts.
- [ ] Commit with `test: define public release validator contract`.

### Task 2: Dependency-free public-release validator

**Files:** `scripts/validate-public-release.mjs` and validator tests.

**Interface:** `validateRepository(root, options) -> Promise<{ findings: Finding[], filesChecked: number }>`; CLI exits `0` when clean and `1` on findings or invalid UTF-8.

- [ ] Implement recursive scanning while ignoring `.git` and `node_modules`.
- [ ] Detect private-key blocks, authorization headers, token assignments, cookies, personal email addresses, public IPv4 addresses, absolute local paths, and configured private markers.
- [ ] Print only file, line, and rule, never matched content.
- [ ] Run `npm test` and commit with `feat: add privacy-safe release validator`.

### Task 3: Task control tower skill

**Files:** `test/scenarios/task-control-tower.md`, `skills/task-control-tower/SKILL.md`, `templates/status-board.md`, and contract tests.

**Interface:** Consume named tasks and latest evidence; produce `completed`, `in_progress`, `blocked`, or `unverified` rows.

- [ ] Record baseline scenarios for misleading `active` metadata, 22/35 minute evidence gaps, conflicting evidence, and two repeated failures.
- [ ] Add failing tests for all states, thresholds, retry/stop rules, read-only behavior, evidence, and next-step fields.
- [ ] Write the concise skill and template.
- [ ] Run application scenarios and `npm test`, then commit with `feat: add evidence-backed task control tower`.

### Task 4: Sanitized task handoff skill

**Files:** `test/scenarios/task-handoff.md`, `skills/task-handoff/SKILL.md`, `templates/task-handoff.md`, and contract tests.

**Interface:** Consume verified scope/evidence/boundaries; produce a compact continuation receipt without raw conversation history.

- [ ] Record baseline scenarios that tempt raw-chat copying, local paths, identifiers, or missing frozen boundaries.
- [ ] Add failing tests for objective, scope, completed work, evidence, blocker, frozen boundaries, and next safe step.
- [ ] Write the skill and template, run scenarios and tests, then commit with `feat: add sanitized task handoffs`.

### Task 5: Public documentation and release verification

**Files:** `README.md`, `README.zh-CN.md`, `SECURITY.md`, `CONTRIBUTING.md`, `LICENSE`, and `docs/public-release-checklist.md`.

- [ ] Document GitHub installation, synthetic examples, privacy boundaries, and validation commands in English and Chinese.
- [ ] Run the official plugin validator, both skill validators, `npm test`, and `npm run validate:public`.
- [ ] Inspect Git history, diff, and sensitive-marker scan; require a clean worktree.
- [ ] Commit with `docs: prepare public release`.

### Task 6: Publish to GitHub

**Files:** No source changes expected.

- [ ] Run `gh auth status`.
- [ ] Create `codex-task-control-tower` as a public repository and push `main`.
- [ ] Verify URL, `PUBLIC` visibility, default branch, remote files, and clean local status.
