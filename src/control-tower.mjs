const TASK_ID_PATTERN = /^[a-z0-9][a-z0-9._-]*$/;
const EVENT_TYPES = new Set([
  "start",
  "evidence",
  "complete",
  "failure",
  "block",
  "unverified",
  "resume",
]);

export class ControlTowerError extends Error {
  constructor(message) {
    super(message);
    this.name = "ControlTowerError";
  }
}

function requireText(value, field) {
  if (typeof value !== "string" || value.trim() === "") {
    throw new ControlTowerError(`${field} must be a non-empty string`);
  }
  return value.trim();
}

function requireTextArray(value, field, { allowEmpty = true } = {}) {
  if (!Array.isArray(value) || (!allowEmpty && value.length === 0)) {
    throw new ControlTowerError(`${field} must be an array of strings`);
  }
  return value.map((entry, index) => requireText(entry, `${field}[${index}]`));
}

function normalizeTimestamp(value = new Date().toISOString()) {
  const date = new Date(value);
  if (Number.isNaN(date.valueOf())) {
    throw new ControlTowerError("event time must be a valid date");
  }
  return date.toISOString();
}

function validatePlan(plan) {
  if (!plan || typeof plan !== "object" || Array.isArray(plan)) {
    throw new ControlTowerError("plan must be a JSON object");
  }

  const objective = requireText(plan.objective, "objective");
  const boundaries = requireTextArray(plan.boundaries ?? [], "boundaries");
  if (!Array.isArray(plan.tasks) || plan.tasks.length === 0) {
    throw new ControlTowerError("tasks must contain at least one task");
  }

  const seen = new Set();
  const tasks = plan.tasks.map((task, index) => {
    const prefix = `tasks[${index}]`;
    if (!task || typeof task !== "object" || Array.isArray(task)) {
      throw new ControlTowerError(`${prefix} must be an object`);
    }

    const id = requireText(task.id, `${prefix}.id`);
    if (!TASK_ID_PATTERN.test(id)) {
      throw new ControlTowerError(`${prefix}.id must use lower-case letters, numbers, dots, underscores, or hyphens`);
    }
    if (seen.has(id)) throw new ControlTowerError(`duplicate task id: ${id}`);
    seen.add(id);

    return {
      id,
      outcome: requireText(task.outcome, `${prefix}.outcome`),
      dependencies: requireTextArray(task.dependencies ?? [], `${prefix}.dependencies`),
      writeScope: requireTextArray(task.writeScope ?? [], `${prefix}.writeScope`),
      successCriteria: requireTextArray(
        task.successCriteria,
        `${prefix}.successCriteria`,
        { allowEmpty: false },
      ),
      verification: requireTextArray(
        task.verification,
        `${prefix}.verification`,
        { allowEmpty: false },
      ),
      stopCondition: requireText(task.stopCondition, `${prefix}.stopCondition`),
    };
  });

  for (const task of tasks) {
    const dependencySet = new Set();
    for (const dependency of task.dependencies) {
      if (!seen.has(dependency)) {
        throw new ControlTowerError(`task ${task.id} has unknown dependency: ${dependency}`);
      }
      if (dependency === task.id) {
        throw new ControlTowerError(`task ${task.id} cannot depend on itself`);
      }
      if (dependencySet.has(dependency)) {
        throw new ControlTowerError(`task ${task.id} repeats dependency: ${dependency}`);
      }
      dependencySet.add(dependency);
    }
  }

  const byId = new Map(tasks.map((task) => [task.id, task]));
  const visiting = new Set();
  const visited = new Set();

  function visit(id) {
    if (visiting.has(id)) throw new ControlTowerError(`dependency cycle includes task: ${id}`);
    if (visited.has(id)) return;
    visiting.add(id);
    for (const dependency of byId.get(id).dependencies) visit(dependency);
    visiting.delete(id);
    visited.add(id);
  }

  for (const task of tasks) visit(task.id);
  return { objective, boundaries, tasks };
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function findTask(run, taskId) {
  const task = run.tasks.find((candidate) => candidate.id === taskId);
  if (!task) throw new ControlTowerError(`unknown task: ${taskId}`);
  return task;
}

function dependenciesCompleted(run, task) {
  return task.dependencies.every(
    (dependency) => findTask(run, dependency).status === "completed",
  );
}

function addEvidence(task, type, summary, at, failureKey) {
  const entry = { type, summary, at };
  if (failureKey) entry.failureKey = failureKey;
  task.evidence.push(entry);
  task.latestEvidence = entry;
}

function minutesBetween(earlier, later) {
  return Math.max(0, Math.floor((new Date(later) - new Date(earlier)) / 60_000));
}

function assessProgress(task, run, assessedAt) {
  if (task.status !== "in_progress") {
    return {
      progressState: "not_applicable",
      inactivityMinutes: null,
      attention: null,
    };
  }

  const progressAt = task.lastProgressAt
    ?? task.latestEvidence?.at
    ?? task.startedAt
    ?? run.createdAt;
  const inactivityMinutes = minutesBetween(progressAt, assessedAt);

  if (inactivityMinutes < 20) {
    return { progressState: "normal", inactivityMinutes, attention: null };
  }

  const progressKey = `${task.id}:${progressAt}`;
  if (inactivityMinutes < 30) {
    return {
      progressState: "warning",
      inactivityMinutes,
      attention: {
        level: "warning",
        dedupeKey: `warning:${progressKey}`,
        action: "report_last_evidence_and_blocker",
      },
    };
  }

  return {
    progressState: "stalled",
    inactivityMinutes,
    attention: {
      level: "stalled",
      dedupeKey: `stalled:${progressKey}`,
      action: "pause_at_safe_point",
    },
  };
}

export function createRun(plan, now) {
  const normalized = validatePlan(plan);
  const createdAt = normalizeTimestamp(now);

  return {
    schemaVersion: 1,
    objective: normalized.objective,
    boundaries: normalized.boundaries,
    createdAt,
    updatedAt: createdAt,
    tasks: normalized.tasks.map((task) => ({
      ...task,
      status: "pending",
      attemptCount: 0,
      failureCounts: {},
      blocker: null,
      startedAt: null,
      lastProgressAt: null,
      latestEvidence: null,
      evidence: [],
    })),
  };
}

export function getReadyTaskIds(run) {
  return run.tasks
    .filter((task) => task.status === "pending" && dependenciesCompleted(run, task))
    .map((task) => task.id);
}

export function recordEvent(run, event) {
  if (!run || !Array.isArray(run.tasks)) {
    throw new ControlTowerError("state is not a valid control tower run");
  }
  if (!event || !EVENT_TYPES.has(event.type)) {
    throw new ControlTowerError(`event type must be one of: ${[...EVENT_TYPES].join(", ")}`);
  }

  const next = clone(run);
  const task = findTask(next, requireText(event.taskId, "taskId"));
  const at = normalizeTimestamp(event.at);
  const evidence = typeof event.evidence === "string" ? event.evidence.trim() : "";

  if (task.status === "completed" && event.type !== "evidence") {
    throw new ControlTowerError(`task ${task.id} is already completed and cannot regress`);
  }
  if (task.status === "blocked" && !["evidence", "resume"].includes(event.type)) {
    throw new ControlTowerError(`task ${task.id} is blocked; resolve the blocker before another attempt`);
  }
  if (["start", "complete", "failure"].includes(event.type)
      && task.status !== "in_progress"
      && !dependenciesCompleted(next, task)) {
    throw new ControlTowerError(`task ${task.id} is not dependency-ready`);
  }

  switch (event.type) {
    case "start":
      if (task.status !== "pending") {
        throw new ControlTowerError(`task ${task.id} cannot start from status ${task.status}`);
      }
      task.status = "in_progress";
      task.startedAt = at;
      task.lastProgressAt = at;
      if (evidence) addEvidence(task, event.type, evidence, at);
      break;

    case "evidence":
      if (!evidence) throw new ControlTowerError("evidence event requires evidence");
      addEvidence(task, event.type, evidence, at);
      if (task.status === "in_progress") task.lastProgressAt = at;
      break;

    case "complete":
      if (!evidence) throw new ControlTowerError("completion requires inspectable evidence");
      if (!["pending", "in_progress"].includes(task.status)) {
        throw new ControlTowerError(`task ${task.id} cannot complete from status ${task.status}`);
      }
      task.status = "completed";
      task.blocker = null;
      addEvidence(task, event.type, evidence, at);
      break;

    case "failure": {
      if (!evidence) throw new ControlTowerError("failure event requires evidence");
      const failureKey = requireText(event.failureKey, "failureKey");
      const count = (task.failureCounts[failureKey] ?? 0) + 1;
      task.failureCounts[failureKey] = count;
      task.attemptCount += 1;
      addEvidence(task, event.type, evidence, at, failureKey);
      if (count >= 2) {
        task.status = "blocked";
        task.blocker = `Two equivalent failures: ${failureKey}`;
      } else {
        task.status = "pending";
      }
      break;
    }

    case "block":
      if (!evidence) throw new ControlTowerError("block event requires a reason in evidence");
      task.status = "blocked";
      task.blocker = evidence;
      addEvidence(task, event.type, evidence, at);
      break;

    case "unverified":
      if (!evidence) throw new ControlTowerError("unverified event requires missing-evidence details");
      task.status = "unverified";
      task.blocker = evidence;
      addEvidence(task, event.type, evidence, at);
      break;

    case "resume":
      if (!evidence) throw new ControlTowerError("resume event requires remediation evidence");
      if (!["blocked", "unverified"].includes(task.status)) {
        throw new ControlTowerError(`task ${task.id} cannot resume from status ${task.status}`);
      }
      task.status = "pending";
      task.blocker = null;
      addEvidence(task, event.type, evidence, at);
      break;
  }

  next.updatedAt = at;
  return next;
}

export function getGateResult(run) {
  const blocked = run.tasks.filter((task) => task.status === "blocked");
  const completed = run.tasks.filter((task) => task.status === "completed").length;
  const total = run.tasks.length;
  const blockers = blocked.map((task) => `${task.id}: ${task.blocker ?? "blocked"}`);

  if (blocked.length > 0) return { result: "failed", completed, total, blockers };
  if (completed !== total) return { result: "unverified", completed, total, blockers: [] };
  return { result: "passed", completed, total, blockers: [] };
}

export function sanitizeText(value) {
  return String(value ?? "")
    .replace(/\bauthorization\s*:\s*(?:bearer|basic)\s+\S+/gi, "Authorization: <redacted-secret>")
    .replace(/\b(?:api[_-]?key|access[_-]?token|refresh[_-]?token|secret[_-]?key)\b\s*[:=]\s*\S+/gi, "<redacted-secret>")
    .replace(/\bsk-(?:proj-|svcacct-)?[A-Za-z0-9_-]{8,}\b/g, "<redacted-secret>")
    .replace(/\bgh[pousr]_[A-Za-z0-9]{8,}\b/g, "<redacted-secret>")
    .replace(/\b(?:AKIA|ASIA)[A-Z0-9]{16}\b/g, "<redacted-secret>")
    .replace(/\bxox[baprs](?:-[A-Za-z0-9]+){2,}\b/g, "<redacted-secret>")
    .replace(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi, "<redacted-email>")
    .replace(/(?:\b[A-Z]:\\|\\\\[^\\\s]+\\)[^\s|<>"']+/gi, "<redacted-path>")
    .replace(/\/(?:Users|home)\/[^/\s]+\/[^\s|<>"']*/g, "<redacted-path>")
    .replace(/\b(?:\d{1,3}\.){3}\d{1,3}\b/g, "<redacted-address>")
    .replace(/\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/gi, "<redacted-id>");
}

function markdownCell(value) {
  const escapedPipe = ["\\", "|"].join("");
  return sanitizeText(value).split("|").join(escapedPipe).replace(/\r?\n/g, " ");
}

export function createHandoff(run) {
  const gate = getGateResult(run);
  const rows = run.tasks.map((task) => {
    const latest = task.latestEvidence?.summary ?? "No evidence recorded";
    return `| ${markdownCell(task.id)} | ${markdownCell(task.outcome)} | ${task.status} | ${markdownCell(latest)} |`;
  });
  const ready = getReadyTaskIds(run);
  const nextStep = ready.length > 0
    ? `Continue dependency-ready task: ${ready[0]}`
    : gate.result === "passed"
      ? "No further action; verification passed"
      : "Resolve the recorded blocker or missing evidence before continuing";

  return [
    "# Sanitized Task Handoff",
    "",
    `## Objective\n${sanitizeText(run.objective)}`,
    "",
    "## Frozen Boundaries",
    ...(run.boundaries.length > 0
      ? run.boundaries.map((boundary) => `- ${sanitizeText(boundary)}`)
      : ["- None recorded"]),
    "",
    "## Evidence Board",
    "| Task | Outcome | Status | Latest evidence |",
    "| --- | --- | --- | --- |",
    ...rows,
    "",
    `Gate result: \`${gate.result}\` (${gate.completed}/${gate.total} completed)`,
    "",
    "## Next Safe Step",
    sanitizeText(nextStep),
    "",
  ].join("\n");
}

export function createStatusSnapshot(run, now) {
  const assessedAt = normalizeTimestamp(now);
  const ready = new Set(getReadyTaskIds(run));
  const tasks = run.tasks.map((task) => {
    const assessment = assessProgress(task, run, assessedAt);
    return {
      id: task.id,
      status: ready.has(task.id) ? "ready" : task.status,
      attemptCount: task.attemptCount,
      latestEvidence: task.latestEvidence?.summary ?? null,
      blocker: task.blocker,
      ...assessment,
    };
  });

  return {
    schemaVersion: run.schemaVersion,
    objective: run.objective,
    updatedAt: run.updatedAt,
    assessedAt,
    gate: getGateResult(run),
    alerts: tasks
      .filter((task) => task.attention)
      .map((task) => ({ taskId: task.id, ...task.attention })),
    tasks,
  };
}
