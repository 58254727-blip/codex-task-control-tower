# Synthetic End-to-End Demo

This demo shows how the six bundled Skills fit together and runs the optional
local evidence ledger end to end. It is deliberately synthetic: it does not
claim a live project run and contains no private task history, credentials,
internal paths, or production data.

## 1. Validate the repository

```bash
npm ci
npm test
npm run demo
npm run validate:public
```

The demo creates a temporary state file, records evidence for both synthetic
tasks, evaluates a passing gate, writes a sanitized handoff, prints it, and
removes the temporary directory. The tests include real child-process calls to
the CLI. The release validator scans the working tree for likely secrets and
private material.

## 2. Give Codex one bounded objective

```text
Use execution-controller to add a synthetic JSON export to the sample report.
Keep the existing text output unchanged. Do not add dependencies or network
access. Verify both formats and stop after two equivalent failures.
```

## 3. Run the ledger manually

```bash
node bin/control-tower.mjs init examples/synthetic-plan.json
node bin/control-tower.mjs status
node bin/control-tower.mjs record --task contract --type complete --evidence "Focused synthetic contract test passed"
node bin/control-tower.mjs record --task implementation --type complete --evidence "Synthetic focused and regression checks passed"
node bin/control-tower.mjs verify
node bin/control-tower.mjs handoff --output handoff.md
```

These commands record evidence supplied by the active task; the CLI does not
execute the verification commands declared in the plan. Use the active Codex
session or the project's normal tooling to produce real evidence first.

## 4. Orchestration artifacts

The controller should produce the smallest sufficient task graph instead of a
layered process for every stage:

| Task | Dependency | Write scope | Success evidence |
| --- | --- | --- | --- |
| Define export contract | None | Synthetic fixture and focused test | Failing focused test captures the requested JSON shape |
| Implement export | Contract | Report formatter only | Focused test passes; text output remains unchanged |
| Verify outcome | Implementation | None | Focused and relevant regression tests pass |

The Skill router selects one available primary Skill for each ready task. An
unavailable Skill is recorded honestly and is not reported as invoked.

## 5. Evidence board

The board uses proof rather than UI activity labels:

| Status | Evidence | Evidence time | Next step |
| --- | --- | --- | --- |
| completed | Focused export test passes | Current run | Run relevant regression |
| in_progress | Regression command is running | Current run | Record exit result |
| unverified | No install test exists for this operating system | Current run | Keep claim explicitly unverified |

If two equivalent attempts fail, the controller stops that path at a safe
checkpoint. It does not make a third blind attempt.

## 6. Verification and handoff

The verification gate permits completion only when the requested behavior,
focused tests, relevant regression, and applicable privacy checks have
inspectable evidence. If work must continue elsewhere, `task-handoff` records
only the objective, scope, verified work, latest evidence, blocker, frozen
boundaries, and next safe step.

Reusable templates are available in `templates/`, and the tested synthetic
scenarios are in `test/scenarios/`. See [the CLI reference](runtime-cli.md) for
the plan schema, exit codes, repeated-failure handling, and privacy boundary.
