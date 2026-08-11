import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import test from "node:test";

import {
  createHandoff,
  createRun,
  createStatusSnapshot,
  recordEvent,
} from "../src/control-tower.mjs";

const fixtureDirectory = new URL("./fixtures/timelines/", import.meta.url);
const fixtureNames = (await readdir(fixtureDirectory))
  .filter((name) => name.endsWith(".json"))
  .sort();

function selectedTaskFields(task) {
  return {
    id: task.id,
    status: task.status,
    progressState: task.progressState,
    inactivityMinutes: task.inactivityMinutes,
  };
}

for (const fixtureName of fixtureNames) {
  test(`synthetic timeline: ${fixtureName}`, async () => {
    const fixture = JSON.parse(
      await readFile(new URL(fixtureName, fixtureDirectory), "utf8"),
    );
    let run = createRun(fixture.plan, fixture.createdAt);

    for (const [index, step] of fixture.steps.entries()) {
      assert.notEqual(Boolean(step.event), Boolean(step.assessment), `step ${index} must have exactly one action`);
      if (step.event) {
        run = recordEvent(run, step.event);
        continue;
      }

      const snapshot = createStatusSnapshot(run, step.assessment.at);
      assert.equal(snapshot.gate.result, step.assessment.expected.gateResult);
      assert.deepEqual(snapshot.alerts, step.assessment.expected.alerts);
      assert.deepEqual(
        snapshot.tasks.map(selectedTaskFields),
        step.assessment.expected.tasks,
      );
    }

    if (fixture.handoff) {
      const handoff = createHandoff(run);
      for (const expected of fixture.handoff.contains) {
        assert.match(handoff, new RegExp(expected.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
      }
    }
  });
}
