# Roadmap

This roadmap is intentionally bounded. Priorities are driven by reproducible
maintainer needs and public issue evidence, not by adding process for its own
sake.

## Current

- Keep contract tests and public-release privacy scanning green in CI.
- Maintain bilingual installation, usage, and privacy documentation.
- Publish small, inspectable releases with verification evidence.

## Next

- Add a cross-platform installation and validation matrix for Windows, macOS,
  and Linux.
- Expand synthetic end-to-end fixtures for dependency routing, repeated-failure
  stops, verification failures, and sanitized handoffs.
- Document compatibility against current Codex plugin and Skill validators.
- Collect structured maintainer feedback through public issues without adding
  telemetry.

## Later

- Add machine-readable synthetic scenario fixtures while preserving the human
  readable templates.
- Evaluate additional local-only reporting formats when a real maintainer use
  case and verification path exist.

## Non-goals

- Background daemons, hidden monitoring, or automatic intervention.
- Telemetry, hosted services, credential storage, or private-data ingestion.
- Automatic deployment, publishing, destructive actions, or permission grants.
- Replacing a project's own tests, review policy, or human approval gates.
