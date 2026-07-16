import test from "node:test";
import assert from "node:assert/strict";

import {
  EVENTS,
  MISSIONS,
  applyChoice,
  createInitialState,
  getChoiceOutcome,
  getMissionResult,
  getShuffledChoices,
  stopAgent,
} from "../game-engine.js";

function enumerateMission(missionId) {
  const completed = [];

  function walk(state, path) {
    if (state.eventIndex === EVENTS.length) {
      completed.push({ state, path, result: getMissionResult(state) });
      return;
    }

    const event = EVENTS[state.eventIndex];
    for (const choice of event.choices) {
      try {
        walk(applyChoice(state, event.id, choice.id), [...path, choice.id]);
      } catch (error) {
        if (!/護欄介入次數不足/.test(error.message)) throw error;
      }
    }
  }

  walk(createInitialState({ missionId, seed: 17 }), []);
  return completed;
}

function rankRun(run) {
  return (run.result.passed ? 1000 : 0) + run.result.score;
}

test("V2 starts with three missions, five events, and only two interventions", () => {
  const state = createInitialState({ missionId: "urgent", seed: 7 });

  assert.equal(MISSIONS.length, 3);
  assert.equal(EVENTS.length, 5);
  assert.equal(state.controls, 2);
  assert.equal(state.missionId, "urgent");
  assert.deepEqual(state.flags, []);
});

test("a third guardrail intervention is rejected instead of allowing five safe picks", () => {
  let state = createInitialState({ missionId: "compliance", seed: 7 });
  state = applyChoice(state, "context", "focused");
  state = applyChoice(state, "sources", "delegate");

  assert.equal(state.controls, 0);
  assert.throws(
    () => applyChoice(state, "timeout", "loop-lock"),
    /護欄介入次數不足/,
  );
});

test("reading the full document creates an index that makes later deep verification cheaper", () => {
  const indexed = applyChoice(
    createInitialState({ missionId: "research", seed: 3 }),
    "context",
    "everything",
  );
  const summarized = applyChoice(
    createInitialState({ missionId: "research", seed: 3 }),
    "context",
    "summary",
  );

  const indexedOutcome = getChoiceOutcome(indexed, "sources", "deep-check");
  const summarizedOutcome = getChoiceOutcome(summarized, "sources", "deep-check");

  assert.ok(indexed.flags.includes("full-index"));
  assert.ok(summarized.flags.includes("info-gap"));
  assert.ok(indexedOutcome.tokenCost < summarizedOutcome.tokenCost);
});

test("trusting the first result is more dangerous when an earlier information gap exists", () => {
  const focused = applyChoice(
    createInitialState({ missionId: "urgent", seed: 3 }),
    "context",
    "focused",
  );
  const summarized = applyChoice(
    createInitialState({ missionId: "urgent", seed: 3 }),
    "context",
    "summary",
  );

  const focusedOutcome = getChoiceOutcome(focused, "sources", "trust-first");
  const summarizedOutcome = getChoiceOutcome(summarized, "sources", "trust-first");

  assert.ok(summarizedOutcome.quality < focusedOutcome.quality);
  assert.ok(summarizedOutcome.safety < focusedOutcome.safety);
});

test("choice order is deterministic per seed but does not keep one semantic answer in slot two", () => {
  const event = EVENTS[0];
  const seedSeven = getShuffledChoices(event, createInitialState({ missionId: "urgent", seed: 7 }));
  const seedSevenAgain = getShuffledChoices(event, createInitialState({ missionId: "urgent", seed: 7 }));
  const seedEight = getShuffledChoices(event, createInitialState({ missionId: "urgent", seed: 8 }));

  assert.deepEqual(seedSeven.map(({ id }) => id), seedSevenAgain.map(({ id }) => id));
  assert.notDeepEqual(seedSeven.map(({ id }) => id), seedEight.map(({ id }) => id));
  assert.deepEqual(
    [...seedSeven.map(({ id }) => id)].sort(),
    [...event.choices.map(({ id }) => id)].sort(),
  );
});

test("all candidate paths are explored and every mission allows multiple winning strategies", () => {
  const bestPaths = MISSIONS.map((mission) => {
    const runs = enumerateMission(mission.id);
    assert.ok(runs.length > 0 && runs.length < 243);
    assert.ok(runs.filter(({ result }) => result.passed).length > 1);
    return runs.sort((left, right) => rankRun(right) - rankRun(left))[0].path.join("/");
  });

  assert.equal(new Set(bestPaths).size, MISSIONS.length);
});

test("pressing the second visible slot every round is not a universal winning strategy", () => {
  const outcomes = MISSIONS.map((mission, missionIndex) => {
    let state = createInitialState({ missionId: mission.id, seed: 31 + missionIndex });

    while (state.eventIndex < EVENTS.length) {
      const event = EVENTS[state.eventIndex];
      const secondChoice = getShuffledChoices(event, state)[1];
      try {
        state = applyChoice(state, event.id, secondChoice.id);
      } catch (error) {
        if (/護欄介入次數不足/.test(error.message)) return { passed: false, blocked: true };
        throw error;
      }
    }

    return getMissionResult(state);
  });

  assert.ok(outcomes.filter(({ passed }) => passed).length <= 1);
});

test("the kill switch still ends the run immediately and records the intervention", () => {
  const state = applyChoice(
    createInitialState({ missionId: "urgent", seed: 9 }),
    "context",
    "summary",
  );
  const stopped = stopAgent(state);

  assert.equal(stopped.eventIndex, EVENTS.length);
  assert.equal(stopped.tokens, state.tokens);
  assert.equal(stopped.history.at(-1).choiceLabel, "緊急終止");
  assert.equal(getMissionResult(stopped).passed, false);
});
