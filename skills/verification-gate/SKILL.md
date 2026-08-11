---
name: verification-gate
description: Use when software work is about to be reported complete and the requested behavior, regressions, or release safety require evidence-based acceptance.
---

# Verification Gate

Decide whether the requested outcome is proven. The gate checks behavior, not
effort, elapsed time, or a successful-looking interface.

## Required Checks

1. **Original behavior**: reproduce the original failure, or establish the
   accepted baseline when the work is a feature.
2. **Requested outcome**: inspect the real changed behavior or artifact.
3. **Focused tests**: run the narrow checks tied to the change.
4. **Relevant regression**: verify nearby behavior that shares the changed path.
5. **Privacy**: scan outputs that may contain private or sensitive material.
6. **Release**: when publishing, validate the exact package or commit that will
   be released.

Mark an unavailable check as `unverified` and state the evidence needed to
resolve it. A check is not optional merely because it cannot run locally.

## Result

Use one gate result:

- `passed`: every applicable check has inspectable evidence.
- `failed`: a check proves the outcome or regression requirement is not met.
- `unverified`: required evidence is missing, inaccessible, or stale.

Do not claim `completed` without inspectable evidence for the original behavior
and requested outcome. Report the result, evidence, skipped or unavailable
checks, remaining risk, and next safe action.

The gate does not authorize production access, deployment, publishing, or any
other operation outside the user's existing approval.
