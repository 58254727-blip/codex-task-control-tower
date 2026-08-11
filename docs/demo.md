# Synthetic End-to-End Demo

This demo shows how the six bundled Skills fit together. It is deliberately
synthetic: it does not claim a live project run and contains no private task
history, credentials, internal paths, or production data.

## 1. Validate the repository

```bash
npm ci
npm test
npm run validate:public
```

The contract tests verify planning, routing, execution, verification, task
status, handoff, manifest, and documentation behavior. The release validator
then scans the complete working tree for likely secrets and private material.

## 2. Give Codex one bounded objective

```text
Use execution-controller to add a synthetic JSON export to the sample report.
Keep the existing text output unchanged. Do not add dependencies or network
access. Verify both formats and stop after two equivalent failures.
```

## 3. Expected orchestration artifacts

The controller should produce the smallest sufficient task graph instead of a
layered process for every stage:

| Task | Dependency | Write scope | Success evidence |
| --- | --- | --- | --- |
| Define export contract | None | Synthetic fixture and focused test | Failing focused test captures the requested JSON shape |
| Implement export | Contract | Report formatter only | Focused test passes; text output remains unchanged |
| Verify outcome | Implementation | None | Focused and relevant regression tests pass |

The Skill router selects one available primary Skill for each ready task. An
unavailable Skill is recorded honestly and is not reported as invoked.

## 4. Expected evidence board

The board uses proof rather than UI activity labels:

| Status | Evidence | Evidence time | Next step |
| --- | --- | --- | --- |
| completed | Focused export test passes | Current run | Run relevant regression |
| in_progress | Regression command is running | Current run | Record exit result |
| unverified | No install test exists for this operating system | Current run | Keep claim explicitly unverified |

If two equivalent attempts fail, the controller stops that path at a safe
checkpoint. It does not make a third blind attempt.

## 5. Verification and handoff

The verification gate permits completion only when the requested behavior,
focused tests, relevant regression, and applicable privacy checks have
inspectable evidence. If work must continue elsewhere, `task-handoff` records
only the objective, scope, verified work, latest evidence, blocker, frozen
boundaries, and next safe step.

Reusable templates are available in `templates/`, and the tested synthetic
scenarios are in `test/scenarios/`.
