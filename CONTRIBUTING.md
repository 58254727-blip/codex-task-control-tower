# Contributing

Thank you for improving Codex Task Control Tower.

## Ground Rules

- Keep the plugin local-only. Keep `task-control-tower` read-only by default,
  and keep orchestration inside the user's explicit working scope.
- Use synthetic examples. Never submit real credentials, cookies, private data, raw task history, internal addresses, or personal contact details.
- Keep status claims tied to concrete evidence.
- Preserve the planner task contract, router availability rules, failure stop
  rule, verification results, four task states, and required handoff fields
  unless a compatible migration is documented.
- Do not add network services, telemetry, hooks, or external dependencies without prior discussion.

## Validation

Run both checks before opening a pull request:

```bash
npm test
npm run validate:public
```

The first command verifies the skill contracts and synthetic scenarios. The second scans the complete repository for material that should not be published.

If a scanner fixture intentionally resembles sensitive material, add only that exact synthetic file to `.public-release-allowlist.json` and explain why.

## Pull Requests

Describe the behavior changed, the verification evidence, and any remaining risk. Keep unrelated formatting or refactoring out of the change.

## Issues

Use the repository issue templates for reproducible bugs and bounded feature
requests. Public reports must use synthetic or already-public material. If a
report needs credentials, private task history, internal paths, personal data,
or non-public logs, do not post it in a public issue.

Good first contributions include documentation clarity, additional synthetic
scenarios, cross-platform validation, and compatibility checks that preserve
the local-only and evidence-backed contracts.
