# Changelog

All notable public changes are documented here.

## 0.3.2 - 2026-08-11

- Add direct npm and `npx` onboarding to both public README files.
- Add a tokenless GitHub Actions trusted-publishing workflow with an exact
  release-tag/package-version gate.
- Add contract tests that require OIDC permissions and reject long-lived npm
  tokens in the publishing workflow.
- Document a real repository-maintenance case study linked to the public issue
  and pull request that delivered the release path.

## 0.3.1 - 2026-08-11

- Add deterministic 20-minute warning and 30-minute stalled assessments without
  changing persisted task states.
- Add stable alert de-duplication keys and explicit recovery behavior when new
  evidence arrives.
- Add five machine-readable synthetic timelines covering normal progress,
  one-time warning, repeated stall, hard-boundary pause, recovery, and safe
  handoff.
- Install the packed package in a clean temporary consumer and invoke its CLI
  on every supported CI platform.
- Add a release compatibility matrix for Node.js, operating systems, plugin
  manifests, and all six bundled Skills.

## 0.3.0 - 2026-08-11

- Add a zero-dependency local CLI and state engine for dependency readiness,
  evidence recording, repeated-failure stops, verification gates, and sanitized
  handoffs.
- Require explicit remediation evidence before a blocked or unverified task can
  resume, while retaining its failure history.
- Add real child-process end-to-end tests and a runnable synthetic demo.
- Fix public IPv4 detection and add provider-token coverage without echoing
  matched values.
- Validate Node.js on Linux, Windows, and macOS in CI and inspect release package
  contents before publishing.
- Document the boundary between model-guided Skills and deterministic local
  state enforcement.

## 0.2.1 - 2026-08-11

- Add GitHub Actions validation for contract tests and public-release scanning.
- Add a reproducible synthetic end-to-end demo.
- Add a bounded public roadmap and contributor issue/PR templates.
- Add release, CI, and license metadata to both README files.

## 0.2.0 - 2026-08-11

- Add bounded development planning, Skill routing, execution control, and
  verification gates.
- Retain evidence-backed task status and privacy-safe handoffs.
