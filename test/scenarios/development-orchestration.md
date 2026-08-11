# Synthetic Development-Orchestration Scenario

This scenario is entirely synthetic. It uses no real repository, account,
task identifier, private path, credential, company data, or conversation.

## Objective

Add an optional `--format compact` mode to a fictional local report command
while preserving its existing default output.

## Planning

Create the smallest sufficient graph:

1. Confirm the current output and the narrow parsing boundary.
2. Add the compact formatter and focused tests in the same write scope.
3. Verify default output, compact output, and relevant regression behavior.

Do not create separate tasks for reading one file, editing one file, and running
one command when those actions form a single coherent implementation step.

## Routing

- Route diagnosis to one available debugging or repository-inspection Skill.
- Route implementation to one available primary implementation Skill.
- Route final checks to `verification-gate`.
- If a named Skill is unavailable, record a no-Skill fallback and do not claim
  that the Skill was invoked.

## Execution

Advance only dependency-ready work. Keep the implementation on the critical
path. Parallel work is allowed only if the runtime supports it and write scopes
are disjoint. Record a diff, command result, or test result in the evidence
ledger after each meaningful action.

## Failure Handling

If the same focused test fails twice for the same reason, stop that path before
a third blind attempt. Preserve the current diff and record the exact blocker.

## Verification

The gate passes only when default behavior remains unchanged, compact output is
verified, focused tests pass, relevant regressions pass, and any public output
passes privacy checks. Missing evidence produces `unverified`.

## Handoff

If execution must pause, create a sanitized handoff containing the objective,
verified work, latest evidence, blocker, frozen boundaries, and next safe step.
