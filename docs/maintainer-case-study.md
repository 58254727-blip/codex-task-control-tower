# Maintainer case study: npm onboarding and trusted publishing

This document records a real maintenance change in this public repository. It
does not contain private task history, credentials, production data, or
synthetic adoption claims.

## Maintenance objective

After the first public npm release, make the package easier to try and remove
long-lived npm credentials from future release automation.

The work is tracked in
[issue #9](https://github.com/58254727-blip/codex-task-control-tower/issues/9).

## Boundaries

- Keep the CLI zero-dependency and compatible with Node.js 18 or newer.
- Never add an npm access token, account identifier, or recovery material.
- Require the GitHub release tag to match the package version.
- Run the same tests, executable demo, public-release scan, clean consumer
  install, and package inspection used for a local release.
- Publish only from a public GitHub-hosted runner bound to the exact npm trusted
  publisher configuration.

## Implementation

1. Add copy-paste `npx` and global-install paths to both public README files.
2. Add `.github/workflows/publish.yml` with `id-token: write` and no
   `NODE_AUTH_TOKEN` or repository secret.
3. Fail before publishing when the release tag and `package.json` version do
   not match.
4. Add a contract test that keeps those supply-chain constraints inspectable.
5. Run `npm run release:check` before the publish step.
6. Check the public registry before publishing and skip an already-published
   version after the release gate succeeds. This keeps a retried GitHub release
   deterministic without masking test or tag failures.

## Evidence

- The repository test suite exercises the deterministic CLI, verification
  gate, repeated-failure stop, handoff redaction, privacy scan, and workflow
  contract.
- `npm run validate:public` scans the package for likely credentials, private
  paths, identifiers, invalid UTF-8, and other unsafe public content.
- `npm run verify:consumer` installs the packed artifact into a clean temporary
  consumer and invokes the published binary.
- The public pull request linked from issue #9 preserves review, CI, and merge
  history for the maintenance change.

## Maintainer outcome

Future releases can obtain a short-lived, workflow-specific OIDC credential
from npm instead of storing a reusable publish token. npm automatically adds
provenance when the package is published by the configured trusted GitHub
workflow.
