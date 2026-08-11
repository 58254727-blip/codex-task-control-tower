# Codex Development Orchestration v0.2 Design

## Goal

Extend the local-first plugin from passive task coordination into an on-demand
software-development orchestration workflow. A user should be able to give
Codex one development objective and receive a bounded task graph, an explicit
Skill route, evidence-backed execution control, and a final verification gate.

## Product Boundary

Version 0.2 remains a skills-only Codex plugin. It adds no server, MCP service,
account connection, telemetry, credential store, or unattended deployment.
"Automatic" means the orchestration Skill advances the approved workflow and
selects available Skills without making the user manually repeat each stage. It
does not bypass Codex policy, install missing Skills, or authorize external side
effects.

## Components

### development-planner

Converts one concrete objective into the smallest sufficient dependency graph.
Every task records its outcome, dependencies, write scope, success criteria,
verification method, and stop condition. It keeps the critical path local and
does not split straightforward work merely to create more tasks.

### skill-router

Matches each ready task to one primary available Skill or to a documented
no-Skill fallback. It uses task fit, not Skill popularity, and refuses to claim
that an unavailable Skill was invoked. Additional Skills are allowed only when
they cover a distinct stage or risk.

### execution-controller

Acts as the end-to-end entry point. It obtains or creates the plan, applies the
Skill route, advances only dependency-ready tasks, and records concrete evidence
after each meaningful action. Independent work may run in parallel only when
the runtime permits it and write scopes do not overlap. Equivalent failures stop
after two attempts, and stalled work is preserved rather than restarted.

### verification-gate

Decides whether the requested outcome is complete. It requires proof for the
original behavior, focused tests, relevant regression checks, and privacy or
release checks when public output is involved. A failed or unavailable check
produces a precise unverified result instead of a completion claim.

### Existing supporting Skills

`task-control-tower` remains the evidence board for multiple tasks.
`task-handoff` remains the privacy-safe continuation path when execution moves
to another task or must pause.

## Workflow

1. Read the objective, repository state, constraints, and existing evidence.
2. Produce or validate the smallest sufficient task graph.
3. Route each ready task to an available primary Skill.
4. Execute the critical path and safely parallelize only disjoint work.
5. Update evidence and unblock newly ready tasks.
6. Stop repeated failure or unauthorized work at a safe checkpoint.
7. Run the verification gate.
8. Return a compact result or a sanitized handoff.

## Safety Rules

- User and system boundaries always override the workflow.
- Planning and routing do not grant permission for deployment, publishing,
  credentials, production data, or destructive operations.
- Raw private conversations, credentials, internal addresses, and private
  identifiers are never copied into plans, reports, examples, or public files.
- The controller never reports `completed` without inspectable verification.
- Missing tools or Skills are reported honestly and use a conservative fallback.

## Verification

Contract tests will verify the required fields and stop conditions for all four
new Skills. A synthetic scenario will exercise planning, routing, execution,
failure handling, verification, and handoff without using real repositories or
identifiers. The existing public-release validator must continue to pass.

