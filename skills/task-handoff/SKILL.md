---
name: task-handoff
description: Use when a Codex task must continue in another task or session with verified context, explicit boundaries, and a compact privacy-safe handoff.
---

# Task Handoff

Create a continuation record from verified work, not a transcript dump.

## Required Fields

Include these sections in this order:

1. **Objective**: the concrete outcome still being pursued.
2. **Current scope**: files, modules, or behavior currently in bounds.
3. **Verified completed**: only outcomes supported by tests, diffs, commits, logs, or receipts.
4. **Latest evidence**: the newest inspectable evidence and when it was produced.
5. **Blocker or user action**: the exact dependency, approval, or missing input.
6. **Frozen boundaries**: behavior, data, files, or environments that must not change.
7. **Next safe step**: one action the destination task can perform immediately.

## Sanitization

Do not include raw conversation by default. Remove credentials, authentication material, private data, internal addresses, personal contact details, and unrelated history. Include identifiers only when explicitly requested and necessary for continuation. Prefer generic labels in examples.

Never invent a completed item, command result, path, commit, timestamp, or blocker. Mark unknown facts as `unverified` and state what evidence would resolve them.

## Procedure

1. Read the latest verified artifact, status, and boundary notes.
2. Separate facts from assumptions.
3. Remove everything not needed for the destination task's next safe action.
4. Populate the required fields using short bullets.
5. Run a final privacy check before sharing or saving the handoff.

Do not silently broaden scope, authorize external actions, or transfer secrets. A handoff communicates state; it does not grant permission.
