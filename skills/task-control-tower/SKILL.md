---
name: task-control-tower
description: Use when coordinating or checking multiple Codex tasks and the user needs concise, evidence-backed status, stall detection, or a safe next-action board without changing those tasks.
---

# Task Control Tower

Inspect first. This skill is read-only unless the user separately authorizes intervention.

## Evidence Standard

Treat only concrete artifacts as progress:

- file change with a relevant diff or timestamp
- command with meaningful output
- test result tied to the requested behavior
- commit or pull request containing the work
- runtime log or process evidence
- agent or subagent result with an inspectable artifact
- receipt from an external operation

`active` is not proof of progress. `idle` is not proof of failure. Never infer completion from a spinner, elapsed time, or status metadata alone.

## Classify Each Task

Use exactly one state:

- `completed`: the requested outcome has verification evidence.
- `in_progress`: recent evidence shows the task is advancing.
- `blocked`: a specific dependency or authorization prevents the next safe action.
- `unverified`: available evidence is too weak or cannot be retrieved.

For every task report: **Status**, **Evidence**, **Evidence time**, and **Next step**.

## Procedure

1. Read the latest compact task snapshot.
2. Extract the newest concrete evidence and its time.
3. If reading fails, retry once with minimum input. Do not repeat broad reads.
4. If task tools are unavailable, use the manual status template below.
5. At 20 minutes without new evidence, label a stall warning and name the last evidence.
6. At 30 minutes without new evidence, recommend a safe pause that preserves current work.
7. After two equivalent failures, stop that path. Do not make a third blind attempt.

Manual status template:

```text
Task: <generic name>
Status: unverified
Evidence: unavailable
Evidence time: unknown
Next step: provide the latest command, test, diff, or log
```

## Boundaries

Unless explicitly authorized, do not message another task, do not stop a process, do not modify files, and do not reprioritize work. Never expose credentials, private data, raw conversation history, or sensitive identifiers in the board.

Keep the result compact. Report only a completion, a real blocker, a stall threshold, or a required user action.
