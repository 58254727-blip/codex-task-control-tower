---
name: development-planner
description: Use when a software objective needs a bounded dependency plan before implementation, especially when scope, verification, or safe parallelism is unclear.
---

# Development Planner

Turn one concrete software objective into the smallest sufficient dependency
graph. A plan exists to make execution safer and faster, not to manufacture
extra tasks.

## Input Gate

Read the objective, repository state, existing evidence, constraints, and frozen
behavior. Record every unknown as `unverified`; do not silently guess it.

## Task Contract

Every task has exactly these fields:

- **Outcome**: observable result, not an activity.
- **Dependencies**: task identifiers or `none`.
- **Write scope**: files or modules the task may change.
- **Success criteria**: behavior that must be true.
- **Verification**: command, test, inspection, or receipt that proves success.
- **Stop condition**: failure, boundary, or missing input that pauses the task.

## Split Rules

1. Keep a straightforward change as one task. Do not split reading, one coherent
   edit, and its focused verification into ceremonial subtasks.
2. Split only for a real dependency, a distinct write scope, an independent
   deliverable, or a separate risk boundary.
3. Mark a task `dependency-ready` only when every dependency has inspectable
   completion evidence.
4. Parallel candidates must have no dependency relationship and disjoint write
   scopes. Planning does not itself authorize parallel execution.
5. Keep deployment, publishing, production data, credentials, and destructive
   operations behind their existing approval boundaries.

## Output

Return the objective and a compact task table using the task contract. Name the
critical path, parallel candidates, frozen boundaries, and the first
dependency-ready task. If one task is sufficient, say so explicitly.

Reject plans that duplicate work, reopen verified behavior without cause, or
replace a missing fact with an assumption.
