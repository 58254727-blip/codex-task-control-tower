# Contributing

Thank you for improving Codex Task Control Tower.

## Ground Rules

- Keep the plugin local-only and read-only by default.
- Use synthetic examples. Never submit real credentials, cookies, private data, raw task history, internal addresses, or personal contact details.
- Keep status claims tied to concrete evidence.
- Preserve the four task states and the required handoff fields unless a compatible migration is documented.
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
