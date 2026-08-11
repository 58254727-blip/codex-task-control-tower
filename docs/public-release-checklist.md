# Public Release Checklist

Complete every item before publishing.

## Scope

- [ ] Only generic control-tower, handoff, templates, tests, and documentation are included.
- [ ] No company source code, production data, private conversations, or user-specific configuration is present.
- [ ] No network service, telemetry, hook, or external credential is required.

## Verification

```bash
npm test
npm run validate:public
```

- [ ] All contract and scenario tests pass.
- [ ] The public-release validator reports zero findings outside its exact synthetic fixture allowlist.
- [ ] Both skill folders pass the Codex skill validator.
- [ ] The plugin root passes the Codex plugin validator.

## Repository

- [ ] Working tree is clean.
- [ ] Commit history contains only public-safe artifacts.
- [ ] The default branch contains the tested release.
- [ ] Repository visibility is public only after every check above passes.
