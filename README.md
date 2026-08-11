# Codex Task Control Tower

[简体中文](README.zh-CN.md)

A small, local-only Codex plugin for evidence-backed task status and privacy-safe handoffs.

It was extracted as a generic open-source tool. The repository contains no production credentials, private task history, company data, or user-specific configuration.

## Features

- **Task control tower**: classifies tasks as `completed`, `in_progress`, `blocked`, or `unverified` using concrete evidence.
- **Stall detection**: distinguishes UI metadata from real progress and applies clear 20-minute and 30-minute thresholds.
- **Sanitized handoff**: preserves the objective, verified work, boundaries, blocker, and next safe step without copying raw conversations.
- **Public-release validator**: scans text files for likely secrets, private identifiers, personal contact data, absolute paths, and invalid UTF-8.

The plugin is read-only by default. It does not message, stop, modify, or reprioritize other tasks unless a user separately authorizes that action.

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
Use task-control-tower to summarize these tasks from concrete evidence only.
```

```text
Use task-handoff to create a compact sanitized continuation record.
```

Templates are available in `templates/`.

## Privacy

- No network service, MCP server, hook, telemetry, or API key is included.
- The validator never prints matched secret content; it reports only file, line, and rule.
- The only credential-like fixture is deliberately synthetic and explicitly allowlisted for scanner tests.
- Real credentials, private data, raw conversations, internal addresses, and unnecessary identifiers must never be committed.

## Development

```bash
npm test
npm run validate:public
```

See [CONTRIBUTING.md](CONTRIBUTING.md), [SECURITY.md](SECURITY.md), and the [public release checklist](docs/public-release-checklist.md).

## License

MIT
