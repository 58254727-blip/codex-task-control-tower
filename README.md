# Codex Task Control Tower

[![CI](https://github.com/58254727-blip/codex-task-control-tower/actions/workflows/ci.yml/badge.svg)](https://github.com/58254727-blip/codex-task-control-tower/actions/workflows/ci.yml)
[![Release](https://img.shields.io/github/v/release/58254727-blip/codex-task-control-tower)](https://github.com/58254727-blip/codex-task-control-tower/releases)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

[简体中文](README.zh-CN.md)

A local-first Codex plugin that turns one bounded software objective into a
small dependency graph, routes ready work to available Skills, controls
evidence-backed execution, verifies the outcome, and preserves privacy-safe
status and handoffs.

It was extracted as a generic open-source tool. The repository contains no production credentials, private task history, company data, or user-specific configuration.

## 60-second Demo

```bash
git clone https://github.com/58254727-blip/codex-task-control-tower.git
cd codex-task-control-tower
npm ci
npm test
npm run validate:public
```

Then install the repository root through the Codex plugin interface and ask:

```text
Use execution-controller to complete this bounded software objective end to end.
```

See the [synthetic end-to-end demo](docs/demo.md) for the expected planning,
routing, execution, verification, status, and handoff artifacts. The example is
deliberately synthetic and does not contain private task history.

## Features

- **Development planner**: creates the smallest sufficient task graph with explicit dependencies, write scopes, success criteria, verification, and stop conditions.
- **Skill router**: selects one available primary Skill per task or records an honest no-Skill fallback.
- **Execution controller**: provides one end-to-end entry point that advances dependency-ready work, records evidence, and stops repeated failures safely.
- **Verification gate**: requires proof of the requested behavior, focused tests, relevant regressions, and applicable privacy or release checks.
- **Task control tower**: classifies tasks as `completed`, `in_progress`, `blocked`, or `unverified` using concrete evidence.
- **Stall detection**: distinguishes UI metadata from real progress and applies clear 20-minute and 30-minute thresholds.
- **Sanitized handoff**: preserves the objective, verified work, boundaries, blocker, and next safe step without copying raw conversations.
- **Public-release validator**: scans text files for likely secrets, private identifiers, personal contact data, absolute paths, and invalid UTF-8.

This is not a background daemon. Its orchestration runs only inside the active
Codex task and under the current runtime's tools, Skills, permissions, and user
instructions. It does not install missing Skills or grant permission for
deployment, publishing, credentials, production data, or destructive actions.
`task-control-tower` remains read-only unless the user separately authorizes
intervention.

## Install

Clone or download this repository, then install the repository root through the Codex plugin interface. The plugin manifest is `.codex-plugin/plugin.json`.

For local validation:

```bash
git clone https://github.com/58254727-blip/codex-task-control-tower.git
cd codex-task-control-tower
npm test
npm run validate:public
```

Node.js 18 or newer is required only for the validation scripts and tests. The skills themselves have no runtime dependency.

## Usage

Ask Codex to use the relevant skill:

```text
Use execution-controller to complete this bounded software objective end to end.
```

That entry point applies the planning, Skill routing, execution, and
verification contracts without requiring a separate prompt for every stage.

```text
Use task-control-tower to summarize these tasks from concrete evidence only.
```

```text
Use task-handoff to create a compact sanitized continuation record.
```

Templates are available in `templates/`.

The six bundled Skills are:

- `execution-controller`
- `development-planner`
- `skill-router`
- `verification-gate`
- `task-control-tower`
- `task-handoff`

## Privacy

- No network service, MCP server, hook, telemetry, or API key is included.
- Planning and routing never create authority for external side effects.
- The validator never prints matched secret content; it reports only file, line, and rule.
- The only credential-like fixture is deliberately synthetic and explicitly allowlisted for scanner tests.
- Real credentials, private data, raw conversations, internal addresses, and unnecessary identifiers must never be committed.

## Development

```bash
npm test
npm run validate:public
```

See [CONTRIBUTING.md](CONTRIBUTING.md), [ROADMAP.md](ROADMAP.md),
[SECURITY.md](SECURITY.md), the [changelog](CHANGELOG.md), and the
[public release checklist](docs/public-release-checklist.md).

## License

MIT
