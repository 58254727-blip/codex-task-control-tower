# Public Release Checklist

Complete every item before publishing.

## Scope

- [ ] Only generic development orchestration, control-tower, handoff, templates, tests, and documentation are included.
- [ ] No company source code, production data, private conversations, or user-specific configuration is present.
- [ ] No network service, telemetry, hook, or external credential is required.

## Verification

```bash
npm test
npm run demo
npm run validate:public
npm run verify:consumer
npm pack --dry-run
```

- [ ] All contract, engine, scanner, and real CLI process tests pass.
- [ ] The executable synthetic demo reaches a passing gate and sanitized handoff.
- [ ] The public-release validator reports zero findings outside its exact synthetic fixture allowlist.
- [ ] The package dry run contains only intended public files.
- [ ] A clean temporary consumer can install the packed artifact and invoke its CLI.
- [ ] All skill folders pass the Codex skill validator.
- [ ] The plugin root passes the Codex plugin validator.
- [ ] `docs/compatibility.md` records the current platform, plugin, and six-Skill results, with warnings separated from failures.

## Repository

- [ ] Working tree is clean.
- [ ] Commit history contains only public-safe artifacts.
- [ ] The default branch contains the tested release.
- [ ] Repository visibility is public only after every check above passes.
