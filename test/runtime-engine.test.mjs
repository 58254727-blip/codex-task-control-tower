import assert from "node:assert/strict";
import test from "node:test";

import {
  ControlTowerError,
  createHandoff,
  createRun,
  createStatusSnapshot,
  getGateResult,
  getReadyTaskIds,
  recordEvent,
} from "../src/control-tower.mjs";

const plan = {
  objective: "Add a bounded synthetic export",
  boundaries: ["No network access", "Do not change existing text output"],
  tasks: [
    {
      id: "contract",
      outcome: "Capture the export contract",
      dependencies: [],
      writeScope: ["test/export.test.mjs"],
      successCriteria: ["The requested JSON shape is explicit"],
      verification: ["node --test test/export.test.mjs"],
      stopCondition: "The requested shape is ambiguous",
    },
    {
      id: "implementation",
      outcome: "Implement the export",
      dependencies: ["contract"],
      writeScope: ["src/export.mjs"],
      successCriteria: ["JSON output passes the contract"],
      verification: ["node --test test/export.test.mjs"],
      stopCondition: "Two equivalent failures occur",
    },
  ],
};

test("creates a run and exposes only dependency-ready tasks", () => {
  const run = createRun(plan, "2026-08-11T00:00:00.000Z");

  assert.deepEqual(getReadyTaskIds(run), ["contract"]);
  assert.equal(run.tasks[0].status, "pending");
  assert.equal(run.tasks[1].status, "pending");
});

test("classifies inactivity without changing the persisted task status", () => {
  let run = createRun(plan, "2026-08-11T00:00:00.000Z");
  run = recordEvent(run, {
    taskId: "contract",
    type: "start",
    evidence: "Synthetic work started",
    at: "2026-08-11T00:01:00.000Z",
  });

  const warning = createStatusSnapshot(run, "2026-08-11T00:21:00.000Z");
  assert.equal(warning.tasks[0].status, "in_progress");
  assert.equal(warning.tasks[0].progressState, "warning");
  assert.equal(warning.tasks[0].inactivityMinutes, 20);
  assert.equal(warning.alerts[0].action, "report_last_evidence_and_blocker");

  const stalled = createStatusSnapshot(run, "2026-08-11T00:31:00.000Z");
  assert.equal(stalled.tasks[0].progressState, "stalled");
  assert.equal(stalled.alerts[0].action, "pause_at_safe_point");
  assert.equal(run.tasks[0].status, "in_progress");
});

test("new evidence resets the inactivity assessment and warning key", () => {
  let run = createRun(plan, "2026-08-11T00:00:00.000Z");
  run = recordEvent(run, {
    taskId: "contract",
    type: "start",
    at: "2026-08-11T00:01:00.000Z",
  });
  const first = createStatusSnapshot(run, "2026-08-11T00:21:00.000Z");

  run = recordEvent(run, {
    taskId: "contract",
    type: "evidence",
    evidence: "Synthetic focused test produced a new result",
    at: "2026-08-11T00:22:00.000Z",
  });
  const recovered = createStatusSnapshot(run, "2026-08-11T00:23:00.000Z");

  assert.equal(recovered.tasks[0].progressState, "normal");
  assert.equal(recovered.tasks[0].inactivityMinutes, 1);
  assert.notEqual(first.alerts[0]?.dedupeKey, recovered.alerts[0]?.dedupeKey);
});

test("rejects unknown dependencies and dependency cycles", () => {
  assert.throws(
    () => createRun({ ...plan, tasks: [{ ...plan.tasks[0], dependencies: ["missing"] }] }),
    /unknown dependency/i,
  );

  const cyclic = {
    ...plan,
    tasks: [
      { ...plan.tasks[0], dependencies: ["implementation"] },
      { ...plan.tasks[1], dependencies: ["contract"] },
    ],
  };
  assert.throws(() => createRun(cyclic), /cycle/i);
});

test("requires inspectable evidence before completion and unlocks dependents", () => {
  let run = createRun(plan, "2026-08-11T00:00:00.000Z");

  assert.throws(
    () => recordEvent(run, { taskId: "contract", type: "complete", evidence: "" }),
    /evidence/i,
  );

  run = recordEvent(run, {
    taskId: "contract",
    type: "complete",
    evidence: "Focused contract test passed",
    at: "2026-08-11T00:01:00.000Z",
  });

  assert.equal(run.tasks[0].status, "completed");
  assert.deepEqual(getReadyTaskIds(run), ["implementation"]);
});

test("completed tasks cannot regress to a non-terminal state", () => {
  let run = createRun(plan, "2026-08-11T00:00:00.000Z");
  run = recordEvent(run, {
    taskId: "contract",
    type: "complete",
    evidence: "Synthetic contract test passed",
    at: "2026-08-11T00:01:00.000Z",
  });

  for (const event of [
    { type: "failure", failureKey: "late-failure" },
    { type: "block" },
    { type: "unverified" },
  ]) {
    assert.throws(
      () => recordEvent(run, {
        taskId: "contract",
        evidence: "Late synthetic event",
        at: "2026-08-11T00:02:00.000Z",
        ...event,
      }),
      /already completed/,
    );
  }
});

test("blocks an equivalent failure path after two attempts", () => {
  let run = createRun(plan, "2026-08-11T00:00:00.000Z");

  run = recordEvent(run, {
    taskId: "contract",
    type: "failure",
    failureKey: "assertion-mismatch",
    evidence: "Expected object but received string",
  });
  assert.equal(run.tasks[0].status, "pending");

  run = recordEvent(run, {
    taskId: "contract",
    type: "failure",
    failureKey: "assertion-mismatch",
    evidence: "Same assertion failed after the bounded retry",
  });
  assert.equal(run.tasks[0].status, "blocked");
  assert.equal(run.tasks[0].attemptCount, 2);

  assert.throws(
    () => recordEvent(run, { taskId: "contract", type: "start", evidence: "Try again" }),
    /blocked/i,
  );
});

test("requires remediation evidence before a blocked task can resume", () => {
  let run = createRun(plan, "2026-08-11T00:00:00.000Z");
  for (const at of ["2026-08-11T00:01:00.000Z", "2026-08-11T00:02:00.000Z"]) {
    run = recordEvent(run, {
      taskId: "contract",
      type: "failure",
      failureKey: "synthetic-root-cause",
      evidence: "Synthetic focused check failed",
      at,
    });
  }

  assert.throws(
    () => recordEvent(run, {
      taskId: "contract",
      type: "resume",
      at: "2026-08-11T00:03:00.000Z",
    }),
    /remediation evidence/,
  );

  run = recordEvent(run, {
    taskId: "contract",
    type: "resume",
    evidence: "Synthetic root cause changed and focused reproduction is clear",
    at: "2026-08-11T00:04:00.000Z",
  });
  assert.deepEqual(getReadyTaskIds(run), ["contract"]);
  assert.equal(run.tasks[0].blocker, null);
});

test("an unverified task can resume after a verification path is added", () => {
  let run = createRun(plan, "2026-08-11T00:00:00.000Z");
  run = recordEvent(run, {
    taskId: "contract",
    type: "unverified",
    evidence: "No synthetic runtime check exists",
    at: "2026-08-11T00:01:00.000Z",
  });
  run = recordEvent(run, {
    taskId: "contract",
    type: "resume",
    evidence: "Synthetic runtime check was added",
    at: "2026-08-11T00:02:00.000Z",
  });
  run = recordEvent(run, {
    taskId: "contract",
    type: "complete",
    evidence: "Synthetic runtime check passed",
    at: "2026-08-11T00:03:00.000Z",
  });

  assert.equal(run.tasks[0].status, "completed");
});

test("verification gate passes only after every task has evidence", () => {
  let run = createRun(plan, "2026-08-11T00:00:00.000Z");
  assert.equal(getGateResult(run).result, "unverified");

  run = recordEvent(run, {
    taskId: "contract",
    type: "complete",
    evidence: "Contract test passed",
  });
  run = recordEvent(run, {
    taskId: "implementation",
    type: "complete",
    evidence: "Focused and regression tests passed",
  });

  assert.deepEqual(getGateResult(run), {
    result: "passed",
    completed: 2,
    total: 2,
    blockers: [],
  });
});

test("handoff redacts common private material", () => {
  const email = ["person", "example.com"].join("@");
  const privatePath = ["C:", "private", "project"].join("\\");
  const secret = ["sk", "example-secret-value"].join("-");
  const address = [203, 0, 113, 8].join(".");
  const authorization = ["Author", "ization"].join("");
  let run = createRun(
    {
      ...plan,
      objective: `Continue work for ${email} in ${privatePath}`,
    },
    "2026-08-11T00:00:00.000Z",
  );
  run = recordEvent(run, {
    taskId: "contract",
    type: "complete",
    evidence: `${authorization}: Bearer ${secret} at ${address}`,
  });

  const handoff = createHandoff(run);
  assert.equal(handoff.includes(email), false);
  assert.equal(handoff.includes(privatePath), false);
  assert.equal(handoff.includes(secret), false);
  assert.match(handoff, /<redacted-email>/);
  assert.match(handoff, /<redacted-path>/);
  assert.match(handoff, /<redacted-secret>/);
});

test("handoff redacts standalone provider tokens", () => {
  const tokens = [
    ["sk-proj", "SyntheticOpenAiTokenValue123"].join("-"),
    ["ghp", "SyntheticGitHubTokenValue12345"].join("_"),
    ["AKIA", "SYNTHETICKEY1234"].join(""),
    ["xoxb", "123456", "SyntheticSlackTokenValue"].join("-"),
  ];
  let run = createRun(plan, "2026-08-11T00:00:00.000Z");
  run = recordEvent(run, {
    taskId: "contract",
    type: "complete",
    evidence: tokens.join(" "),
    at: "2026-08-11T00:01:00.000Z",
  });

  const handoff = createHandoff(run);
  for (const token of tokens) assert.equal(handoff.includes(token), false);
});

test("exposes a typed error for invalid transitions", () => {
  const run = createRun(plan);
  assert.throws(
    () => recordEvent(run, { taskId: "implementation", type: "start" }),
    (error) => error instanceof ControlTowerError && /not dependency-ready/i.test(error.message),
  );
});
