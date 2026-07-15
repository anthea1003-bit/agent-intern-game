import test from "node:test";
import assert from "node:assert/strict";

import {
  EVENTS,
  applyChoice,
  createInitialState,
  getEnding,
  playChoices,
  stopAgent,
} from "../game-engine.js";

test("starts with a bounded budget and five agent events", () => {
  const state = createInitialState();

  assert.equal(state.tokens, 1000);
  assert.equal(state.progress, 6);
  assert.equal(state.eventIndex, 0);
  assert.equal(EVENTS.length, 5);
});

test("a choice updates all four supervision dimensions and advances once", () => {
  const state = createInitialState();
  const next = applyChoice(state, "context", "focused");

  assert.deepEqual(
    {
      tokens: next.tokens,
      progress: next.progress,
      quality: next.quality,
      safety: next.safety,
      eventIndex: next.eventIndex,
    },
    { tokens: 910, progress: 23, quality: 62, safety: 60, eventIndex: 1 },
  );
  assert.equal(next.history.length, 1);
  assert.throws(() => applyChoice(next, "context", "focused"), /目前事件/);
});

test("a scoped supervision path earns the Agent Whisperer ending", () => {
  const state = playChoices([
    ["context", "focused"],
    ["sources", "delegate"],
    ["timeout", "loop-lock"],
    ["scope", "restate"],
    ["publish", "preview"],
  ]);

  assert.equal(state.progress, 92);
  assert.equal(state.tokens, 590);
  assert.equal(getEnding(state).id, "whisperer");
});

test("brute-force autonomy burns the whole budget", () => {
  const state = playChoices([
    ["context", "everything"],
    ["sources", "deep-check"],
    ["timeout", "retry"],
    ["scope", "expand"],
    ["publish", "auto-send"],
  ]);

  assert.equal(state.tokens, 0);
  assert.equal(getEnding(state).id, "arsonist");
});

test("stopping every useful action is cheap but incomplete", () => {
  const state = playChoices([
    ["context", "summary"],
    ["sources", "trust-first"],
    ["timeout", "stop"],
    ["scope", "remove-tool"],
    ["publish", "kill"],
  ]);

  assert.ok(state.tokens > 850);
  assert.ok(state.progress < 70);
  assert.equal(getEnding(state).id, "micromanager");
});

test("granting unsafe tool autonomy triggers the runaway ending", () => {
  const state = playChoices([
    ["context", "focused"],
    ["sources", "delegate"],
    ["timeout", "retry"],
    ["scope", "expand"],
    ["publish", "auto-send"],
  ]);

  assert.ok(state.safety < 45);
  assert.equal(getEnding(state).id, "runaway");
});

test("the kill switch ends the run immediately and records the intervention", () => {
  const state = applyChoice(createInitialState(), "context", "focused");
  const stopped = stopAgent(state);

  assert.equal(stopped.eventIndex, EVENTS.length);
  assert.equal(stopped.tokens, state.tokens);
  assert.equal(stopped.history.at(-1).choiceLabel, "緊急終止");
  assert.equal(getEnding(stopped).id, "micromanager");
});
