---
name: execution-controller
description: Use when a bounded software objective should advance end to end through planning, Skill selection, implementation, evidence tracking, and final verification.
---

# Execution Controller

This is the plugin's end-to-end entry point. It advances one approved objective
through the existing Codex session; it is not a background service and does not
continue after the runtime stops.

## Control Loop

1. Read the objective, repository state, existing evidence, frozen behavior, and
   system and user boundaries.
2. Use `development-planner`, or apply its task contract as a conservative
   fallback, to create or validate the smallest sufficient graph.
3. Use `skill-router`, or its route contract, for each dependency-ready task.
4. Execute only dependency-ready work. Keep the critical path in the current
   task unless another execution mechanism is both available and appropriate.
5. Parallelize only when the runtime permits it and write scopes do not overlap.
6. After each meaningful action, update the evidence ledger.
7. Run `verification-gate` before reporting completion.

## Evidence Ledger

For each task record its state, latest evidence, evidence time, write scope,
attempt count, blocker, and next safe action. Evidence means an inspectable
diff, command result, test, runtime log, commit, or external receipt.

### Optional Local Evidence Ledger

When durable machine-readable state is useful, use `codex-control-tower` as an
optional local evidence ledger. It can initialize a bounded task graph, record
evidence and equivalent-failure keys, show dependency-ready work, enforce the
two-failure stop, evaluate the verification gate, and create a sanitized
handoff. The CLI does not replace judgment, execute project commands by itself,
or grant authority for an operation. The active Codex session remains
responsible for choosing and performing approved work.

## Failure Control

- Classify failures by root cause, not wording alone.
- After two equivalent failures, stop that path. Make no third blind attempt.
- Preserve files, diffs, logs, and the last known state at a safe checkpoint.
- Do not restart the whole objective to hide a local failure.
- Continue unrelated dependency-ready work only when its scope remains safe.

## Completion And Pause

Do not mark a task complete from activity metadata or intention. If verification
is unavailable, report `unverified`. If execution pauses, use `task-handoff` for
a sanitized continuation record. Use `task-control-tower` only when multiple
tasks need an evidence-backed board.

Planning and Skill routing never override system and user boundaries, install
missing capabilities, or authorize credentials, production data, publishing,
deployment, or destructive operations.
