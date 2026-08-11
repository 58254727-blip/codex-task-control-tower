---
name: skill-router
description: Use when planned software tasks need to be matched to installed Skills or an explicit conservative fallback without overstating available capabilities.
---

# Skill Router

Choose the narrowest available capability that fits each ready task. Routing is
a selection record, not proof that work ran.

## Route Contract

For every task record:

- **Primary Skill**: one primary Skill, or `none`.
- **Availability**: `available`, `unavailable`, or `unverified`.
- **Reason**: the task symptom or risk that matches the Skill trigger.
- **Fallback**: a bounded no-Skill fallback when the primary is unavailable.
- **Extra stage**: optional Skill for a distinct stage or risk only.

## Procedure

1. Inspect the current runtime's available Skills before choosing.
2. Compare each Skill's trigger description with the task, not with popularity
   or model capability claims.
3. Select one primary Skill for the task. Additional Skills are allowed only for
   a distinct stage or risk, such as final verification or public privacy review.
4. Read the selected Skill before applying its workflow.
5. If the desired Skill is unavailable, it is not invoked. Record a no-Skill
   fallback or pause when no safe fallback exists.

## Boundaries

The router does not install Skills, fabricate tool access, grant permissions, or
authorize deployment and external side effects. A route says what should guide
the next action; the execution evidence says what actually happened.
