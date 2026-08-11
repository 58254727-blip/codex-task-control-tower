# Codex Task Control Tower Design

## Purpose

Codex Task Control Tower is a public, installable Codex plugin for read-only,
evidence-backed coordination of multiple Codex tasks. It helps users distinguish
real progress from status metadata, identify stalled work, and create concise
handoffs without changing child tasks.

The project is extracted from a general workflow pattern only. It contains no
private conversations, company data, production endpoints, local machine paths,
task identifiers, credentials, cookies, tokens, or cryptographic material.

## Product Shape

Version 0.1 is a skills-first plugin with a local release-safety validator.
It does not include an MCP server, hosted service, account connection, telemetry,
or custom UI. This follows the smallest plugin shape that can provide the intended
workflow using tools already available in Codex.

The repository will contain:

- A task-control-tower skill for on-demand task inspection and status reporting.
- A task-handoff skill for compact, sanitized continuation notes.
- Reusable Markdown templates for status boards and handoff receipts.
- A local validator that checks plugin structure and scans tracked files for
  likely secrets or private-environment residue before release.
- Synthetic examples and automated tests for the validator and report rules.

## Core Workflows

### Evidence-backed status board

The user supplies task identifiers or selects visible tasks. The skill reads only
the latest available task evidence and assigns one of four states:

- `completed`: explicit completion receipt plus verification evidence.
- `in_progress`: recent file, command, test, commit, runtime, or agent evidence.
- `blocked`: an unresolved failure, permission request, or required user decision.
- `unverified`: status metadata exists but no concrete progress evidence is found.

`active`, `idle`, and similar runtime labels are metadata, not proof of progress.
Each row must include one evidence item, one next step, and a timestamp or an
explicit statement that the time is unavailable.

### Stall detection

The default advisory thresholds are 20 minutes without concrete evidence for a
warning and 30 minutes for a safe-pause recommendation. The plugin does not stop,
message, reprioritize, or modify another task. It reports the condition and leaves
intervention to the user.

Repeated failure handling is deterministic: after two materially equivalent
failures, recommend stopping that path and rechecking the full entry, state, data,
backend, and runtime chain. Do not recommend a third blind retry.

### Compact handoff

The handoff skill records only what another task needs to resume:

- Objective and current scope.
- Verified completed work.
- Latest concrete evidence.
- Current blocker or required user action.
- Frozen boundaries and prohibited actions.
- Next safe step.

Raw conversation history is excluded by default. Runtime identifiers are shown
only when the user explicitly asks for them and are never included in repository
examples.

## Privacy And Security

- No external network calls, telemetry, analytics, or hosted storage.
- No API key or third-party account is required.
- No automatic persistence of inspected task content.
- Examples use synthetic names, identifiers, paths, logs, and timestamps.
- The release validator fails closed on likely secrets, private keys, cookies,
  authorization headers, access tokens, personal email addresses, public IP
  addresses, machine-specific absolute paths, and configured private markers.
- A documented allowlist is permitted only for clearly synthetic fixtures.
- `.gitignore`, `SECURITY.md`, and a public-release checklist are required before
  the first release.

The validator reduces accidental disclosure risk but does not claim to replace a
human review or a dedicated secret-scanning service.

## Repository Layout

```text
codex-task-control-tower/
  .codex-plugin/plugin.json
  skills/task-control-tower/SKILL.md
  skills/task-handoff/SKILL.md
  templates/status-board.md
  templates/task-handoff.md
  scripts/validate-public-release.mjs
  test/validate-public-release.test.mjs
  test/fixtures/
  docs/public-release-checklist.md
  README.md
  README.zh-CN.md
  SECURITY.md
  CONTRIBUTING.md
  LICENSE
  package.json
```

## Error Handling

- If task tools are unavailable, explain that the plugin cannot inspect live tasks
  and provide the manual evidence template instead.
- If a task read fails, retry once with the minimum supported input. Do not loop.
- If evidence conflicts, mark the task `unverified` and show the conflict.
- If the validator finds a risky match, exit nonzero and print only the file,
  line number, and rule name. Do not echo a full suspected secret.
- If a file cannot be decoded as UTF-8, fail validation and require review.

## Verification

Automated verification will cover:

- Plugin manifest and required-file presence.
- Skill front matter and required workflow sections.
- Status classification examples for all four states.
- Twenty- and thirty-minute threshold behavior.
- Two-failure stop rule.
- Secret scanner detection and synthetic-fixture allowlisting.
- Scanner output redaction so suspected secret values are not printed.
- A full clean-repository validation pass.

Manual verification will cover:

- Installation into a clean Codex profile.
- A synthetic three-task status-board run.
- A handoff generated without raw conversation content.
- A repository-wide review before any GitHub publication.

## Non-goals For Version 0.1

- Background monitoring or scheduled automation.
- Sending messages to, stopping, or editing other tasks.
- Reading private files or exporting conversation archives.
- Company-specific workflows, ERP integrations, or business data.
- MCP servers, dashboards, cloud sync, user accounts, or billing.
- Automatic GitHub publication or automatic application submission.

## Release Criteria

Version 0.1 is ready only when all automated tests pass, the public-release
validator reports no findings, the installed plugin completes the synthetic
manual workflow, and a human confirms that the Git diff contains only public,
generic material.
