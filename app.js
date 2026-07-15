import {
  EVENTS,
  MISSIONS,
  applyChoice,
  createInitialState,
  getChoiceOutcome,
  getMissionResult,
  getShuffledChoices,
  stopAgent,
} from "./game-engine.js";

const $ = (selector) => document.querySelector(selector);
const elements = {
  intro: $("#intro-screen"),
  game: $("#game-screen"),
  result: $("#result-screen"),
  missionDialog: $("#mission-dialog"),
  missionClose: $("#mission-close"),
  missionAccept: $("#mission-accept"),
  missionRevealIcon: $("#mission-reveal-icon"),
  missionCodename: $("#mission-codename"),
  missionDialogTitle: $("#mission-dialog-title"),
  missionBrief: $("#mission-brief"),
  briefTokenTarget: $("#brief-token-target"),
  briefProgressTarget: $("#brief-progress-target"),
  briefQualityTarget: $("#brief-quality-target"),
  briefSafetyTarget: $("#brief-safety-target"),
  start: $("#start-button"),
  restart: $("#restart-button"),
  copy: $("#copy-button"),
  kill: $("#kill-switch"),
  missionMode: $("#mission-mode"),
  missionName: $("#mission-name"),
  controlCharges: $("#control-charges"),
  tokenValue: $("#token-value"),
  progressValue: $("#progress-value"),
  qualityValue: $("#quality-value"),
  safetyValue: $("#safety-value"),
  tokenTarget: $("#token-target"),
  progressTarget: $("#progress-target"),
  qualityTarget: $("#quality-target"),
  safetyTarget: $("#safety-target"),
  tokenMeter: $("#token-meter"),
  progressMeter: $("#progress-meter"),
  qualityMeter: $("#quality-meter"),
  safetyMeter: $("#safety-meter"),
  eventPanel: $("#event-panel"),
  eventStep: $("#event-step"),
  eventEyebrow: $("#event-eyebrow"),
  eventIcon: $("#event-icon"),
  eventTitle: $("#event-title"),
  eventPrompt: $("#event-prompt"),
  choices: $("#choice-list"),
  agentLine: $("#agent-line"),
  toolName: $("#tool-name"),
  agentStage: $("#agent-stage"),
  gameRobot: $("#game-robot"),
  feedback: $("#feedback-card"),
  feedbackIcon: $("#feedback-icon"),
  feedbackTitle: $("#feedback-title"),
  feedbackCopy: $("#feedback-copy"),
  countdownText: $("#countdown-text"),
  countdownFill: $("#countdown-fill"),
  stepDots: $("#step-dots"),
  endingIcon: $("#ending-icon"),
  endingTitle: $("#ending-title"),
  endingKicker: $("#ending-kicker"),
  endingDescription: $("#ending-description"),
  endingLesson: $("#ending-lesson"),
  resultMission: $("#result-mission"),
  missionScore: $("#mission-score"),
  finalTokens: $("#final-tokens"),
  finalProgress: $("#final-progress"),
  finalQuality: $("#final-quality"),
  finalSafety: $("#final-safety"),
  finalTokenTarget: $("#final-token-target"),
  finalProgressTarget: $("#final-progress-target"),
  finalQualityTarget: $("#final-quality-target"),
  finalSafetyTarget: $("#final-safety-target"),
  history: $("#history-list"),
};

let state = createInitialState();
let pendingMission = null;
let pendingSeed = 1;
let decisionTimer = null;
let countdownTimer = null;
let secondsLeft = 12;
let locked = false;
let displayedChoices = [];

function showScreen(target) {
  [elements.intro, elements.game, elements.result].forEach((screen) => {
    screen.hidden = screen !== target;
  });
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function formatNumber(value) {
  return new Intl.NumberFormat("zh-Hant").format(value);
}

function randomInteger() {
  if (globalThis.crypto?.getRandomValues) {
    return globalThis.crypto.getRandomValues(new Uint32Array(1))[0];
  }
  return Math.floor(Math.random() * 0xffffffff);
}

function closeMissionDialog() {
  if (typeof elements.missionDialog.close === "function") elements.missionDialog.close();
  else elements.missionDialog.removeAttribute("open");
}

function revealMission() {
  const candidates = pendingMission
    ? MISSIONS.filter((mission) => mission.id !== pendingMission.id)
    : MISSIONS;
  const entropy = randomInteger();
  pendingMission = candidates[entropy % candidates.length];
  pendingSeed = (entropy % 999983) + 1;

  elements.missionDialog.style.setProperty("--mission-color", pendingMission.color);
  elements.missionRevealIcon.textContent = pendingMission.icon;
  elements.missionCodename.textContent = pendingMission.codename;
  elements.missionDialogTitle.textContent = pendingMission.name;
  elements.missionBrief.textContent = pendingMission.brief;
  elements.briefTokenTarget.textContent = `≥ ${pendingMission.thresholds.tokens}`;
  elements.briefProgressTarget.textContent = `≥ ${pendingMission.thresholds.progress}%`;
  elements.briefQualityTarget.textContent = `≥ ${pendingMission.thresholds.quality}%`;
  elements.briefSafetyTarget.textContent = `≥ ${pendingMission.thresholds.safety}%`;

  if (typeof elements.missionDialog.showModal === "function") elements.missionDialog.showModal();
  else elements.missionDialog.setAttribute("open", "");
}

function setMeter(element, value, max) {
  const percent = Math.round((value / max) * 100);
  element.setAttribute("aria-valuenow", String(value));
  element.querySelector("span").style.width = `${percent}%`;
}

function setTargetState(element, value, threshold) {
  element.classList.toggle("target-met", value >= threshold);
}

function renderHud() {
  const mission = MISSIONS.find((candidate) => candidate.id === state.missionId);
  elements.missionMode.textContent = mission.codename;
  elements.missionName.textContent = `${mission.icon} ${mission.name} · ${mission.target}`;
  elements.missionName.parentElement.parentElement.style.setProperty("--mission-color", mission.color);
  elements.controlCharges.innerHTML = `
    <span class="control-label">護欄介入</span>
    <span class="charge ${state.controls >= 1 ? "available" : "spent"}" aria-hidden="true">🛡</span>
    <span class="charge ${state.controls >= 2 ? "available" : "spent"}" aria-hidden="true">🛡</span>
    <strong>${state.controls} / 2</strong>`;
  elements.controlCharges.setAttribute("aria-label", `剩餘 ${state.controls} 次護欄介入`);

  elements.tokenValue.textContent = formatNumber(state.tokens);
  elements.progressValue.textContent = `${state.progress}%`;
  elements.qualityValue.textContent = `${state.quality}%`;
  elements.safetyValue.textContent = `${state.safety}%`;
  elements.tokenTarget.textContent = `門檻 ≥ ${mission.thresholds.tokens}`;
  elements.progressTarget.textContent = `門檻 ≥ ${mission.thresholds.progress}%`;
  elements.qualityTarget.textContent = `門檻 ≥ ${mission.thresholds.quality}%`;
  elements.safetyTarget.textContent = `門檻 ≥ ${mission.thresholds.safety}%`;
  setTargetState(elements.tokenTarget, state.tokens, mission.thresholds.tokens);
  setTargetState(elements.progressTarget, state.progress, mission.thresholds.progress);
  setTargetState(elements.qualityTarget, state.quality, mission.thresholds.quality);
  setTargetState(elements.safetyTarget, state.safety, mission.thresholds.safety);
  setMeter(elements.tokenMeter, state.tokens, 1000);
  setMeter(elements.progressMeter, state.progress, 100);
  setMeter(elements.qualityMeter, state.quality, 100);
  setMeter(elements.safetyMeter, state.safety, 100);

  const heat = state.tokens <= 250 ? "critical" : state.tokens <= 520 ? "warm" : "steady";
  elements.agentStage.dataset.heat = heat;
}

function renderStepDots() {
  elements.stepDots.innerHTML = EVENTS.map((event, index) => {
    const status = index < state.eventIndex ? "done" : index === state.eventIndex ? "active" : "";
    const detail = status === "done" ? " 已完成" : status === "active" ? " 進行中" : "";
    return `<span class="${status}" aria-label="事件 ${index + 1}${detail}"></span>`;
  }).join("");
}

function clearTimers() {
  window.clearTimeout(decisionTimer);
  window.clearInterval(countdownTimer);
  decisionTimer = null;
  countdownTimer = null;
}

function startCountdown(event) {
  clearTimers();
  secondsLeft = 12;
  elements.countdownText.textContent = `${secondsLeft} 秒`;
  elements.countdownFill.style.animation = "none";
  void elements.countdownFill.offsetWidth;
  elements.countdownFill.style.animation = "countdown 12s linear forwards";

  countdownTimer = window.setInterval(() => {
    secondsLeft -= 1;
    elements.countdownText.textContent = `${Math.max(0, secondsLeft)} 秒`;
  }, 1000);

  decisionTimer = window.setTimeout(() => {
    if (locked) return;
    const fallback = displayedChoices.find(
      (choice) => getChoiceOutcome(state, event.id, choice.id).controlCost <= state.controls,
    );
    if (fallback) selectChoice(event, fallback, true);
  }, 12000);
}

function choiceCostLabel(outcome) {
  const tokenLabel = outcome.tokenCost === 0 ? "0 T" : `−${outcome.tokenCost} T`;
  return outcome.controlCost ? `${tokenLabel} · 🛡 1` : tokenLabel;
}

function renderEvent() {
  locked = false;
  elements.feedback.hidden = true;
  const event = EVENTS[state.eventIndex];
  displayedChoices = getShuffledChoices(event, state);

  elements.eventPanel.classList.toggle("danger", Boolean(event.danger));
  elements.eventStep.textContent = event.step;
  elements.eventEyebrow.textContent = event.eyebrow;
  elements.eventIcon.textContent = event.icon;
  elements.eventTitle.textContent = event.title;
  elements.eventPrompt.textContent = event.prompt;
  elements.agentLine.textContent = event.agentLine;
  elements.toolName.textContent = event.tool;

  elements.choices.innerHTML = displayedChoices
    .map((choice, index) => {
      const outcome = getChoiceOutcome(state, event.id, choice.id);
      const unavailable = outcome.controlCost > state.controls;
      const reasonText = outcome.reasons.length ? ` · ${outcome.reasons.join("；")}` : "";
      return `
        <button class="choice-button${unavailable ? " unavailable" : ""}" type="button"
          data-choice="${choice.id}" aria-keyshortcuts="${index + 1}" ${unavailable ? "disabled" : ""}>
          <span class="choice-key" aria-hidden="true">${index + 1}</span>
          <span class="sr-only">快捷鍵 ${index + 1}</span>
          <span class="choice-copy">
            <strong>${choice.label}</strong>
            <small>${unavailable ? "護欄額度已用完，這條路線被鎖住" : `${choice.note}${reasonText}`}</small>
          </span>
          <span class="choice-cost ${outcome.tokenCost >= 180 ? "hot" : ""} ${outcome.controlCost ? "guarded" : ""}">
            ${unavailable ? "🔒 護欄用完" : choiceCostLabel(outcome)}
          </span>
        </button>`;
    })
    .join("");

  elements.choices.querySelectorAll("button:not(:disabled)").forEach((button) => {
    button.addEventListener("click", () => {
      const choice = displayedChoices.find((candidate) => candidate.id === button.dataset.choice);
      selectChoice(event, choice, false);
    });
  });

  renderHud();
  renderStepDots();
  startCountdown(event);
  elements.eventPanel.classList.remove("panel-enter");
  void elements.eventPanel.offsetWidth;
  elements.eventPanel.classList.add("panel-enter");
  elements.choices.querySelector("button:not(:disabled)")?.focus({ preventScroll: true });
}

function spawnTokenBurst(cost) {
  const count = Math.min(10, Math.max(3, Math.ceil(cost / 35)));
  for (let index = 0; index < count; index += 1) {
    const spark = document.createElement("span");
    spark.className = "token-spark";
    spark.textContent = "T";
    spark.style.setProperty("--spark-x", `${(Math.random() - 0.5) * 220}px`);
    spark.style.setProperty("--spark-y", `${-80 - Math.random() * 170}px`);
    spark.style.setProperty("--spark-delay", `${index * 35}ms`);
    elements.agentStage.append(spark);
    window.setTimeout(() => spark.remove(), 1100);
  }
}

function signed(value) {
  return value > 0 ? `+${value}` : String(value);
}

function effectSummary(outcome) {
  const effects = [
    `Token −${outcome.tokenCost}`,
    `進度 ${signed(outcome.progress)}`,
    `品質 ${signed(outcome.quality)}`,
    `安全 ${signed(outcome.safety)}`,
  ];
  if (outcome.controlCost) effects.push("護欄 −1");
  return effects.join(" · ");
}

function selectChoice(event, choice, timedOut) {
  if (locked || !choice) return;
  const outcome = getChoiceOutcome(state, event.id, choice.id);
  if (outcome.controlCost > state.controls) return;

  locked = true;
  clearTimers();
  elements.choices.querySelectorAll("button").forEach((button) => {
    button.disabled = true;
    button.classList.toggle("selected", button.dataset.choice === choice.id);
  });

  state = applyChoice(state, event.id, choice.id);
  renderHud();
  renderStepDots();
  spawnTokenBurst(outcome.tokenCost);
  elements.gameRobot.classList.remove("react");
  void elements.gameRobot.offsetWidth;
  elements.gameRobot.classList.add("react");

  elements.feedbackIcon.textContent = timedOut ? "⏰" : outcome.controlCost ? "🛡" : outcome.reasons.length ? "🔗" : "⚡";
  elements.feedbackTitle.textContent = timedOut
    ? `時間到！Agent 自己選了「${choice.label}」`
    : `你選了「${choice.label}」`;
  const chain = outcome.reasons.length ? ` 連鎖後果：${outcome.reasons.join("；")}。` : "";
  elements.feedbackCopy.textContent = `${outcome.feedback} ${effectSummary(outcome)}。${chain}`;
  elements.feedback.hidden = false;

  const delay = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 180 : 1500;
  window.setTimeout(() => {
    if (state.eventIndex >= EVENTS.length) finishRun();
    else renderEvent();
  }, delay);
}

function startGame() {
  if (!pendingMission) return;
  clearTimers();
  closeMissionDialog();
  state = createInitialState({ missionId: pendingMission.id, seed: pendingSeed });
  elements.kill.classList.remove("pressed");
  showScreen(elements.game);
  renderEvent();
}

function setFinalMetric(metric, value, threshold, suffix = "") {
  const card = document.querySelector(`[data-metric="${metric}"]`);
  card.classList.toggle("metric-pass", value >= threshold);
  card.classList.toggle("metric-fail", value < threshold);
  const label = card.querySelector("small");
  label.textContent = `${value >= threshold ? "PASS" : "MISS"} · 門檻 ≥ ${threshold}${suffix}`;
}

function finishRun() {
  clearTimers();
  const result = getMissionResult(state);
  const { ending, mission } = result;
  elements.endingIcon.textContent = ending.icon;
  elements.endingTitle.textContent = ending.title;
  elements.endingKicker.textContent = ending.kicker;
  elements.endingDescription.textContent = ending.description;
  elements.endingLesson.textContent = ending.lesson;
  elements.resultMission.textContent = `${mission.icon} ${mission.name} · ${mission.target}`;
  elements.missionScore.textContent = `${result.passed ? "任務通過" : "任務失敗"} · 綜合分數 ${result.score}`;
  elements.finalTokens.textContent = formatNumber(state.tokens);
  elements.finalProgress.textContent = `${state.progress}%`;
  elements.finalQuality.textContent = `${state.quality}%`;
  elements.finalSafety.textContent = `${state.safety}%`;
  setFinalMetric("tokens", state.tokens, mission.thresholds.tokens);
  setFinalMetric("progress", state.progress, mission.thresholds.progress, "%");
  setFinalMetric("quality", state.quality, mission.thresholds.quality, "%");
  setFinalMetric("safety", state.safety, mission.thresholds.safety, "%");

  elements.history.innerHTML = state.history
    .map((item) => {
      const guardrail = item.controlCost ? " · 護欄 −1" : "";
      const chain = item.reasons.length ? item.reasons.join("；") : item.feedback;
      return `
        <li>
          <span>${item.eventTitle}</span>
          <strong>${item.choiceLabel}</strong>
          <small>${item.tokenCost ? `−${item.tokenCost} T` : "0 T"}${guardrail}</small>
          <em>${chain}</em>
        </li>`;
    })
    .join("");

  elements.result.dataset.ending = ending.id;
  elements.result.dataset.passed = String(result.passed);
  showScreen(elements.result);
  elements.restart.focus({ preventScroll: true });
}

async function copyResult() {
  const result = getMissionResult(state);
  const text = `我的 AI 實習生監工結果：${result.mission.name} ${result.passed ? "通過" : "失敗"}，${result.ending.title}！分數 ${result.score}，剩餘 ${state.tokens} Token，進度 ${state.progress}%，品質 ${state.quality}%，安全 ${state.safety}%。`;
  try {
    await navigator.clipboard.writeText(text);
    elements.copy.textContent = "已複製 ✓";
  } catch {
    elements.copy.textContent = "複製失敗";
  }
  window.setTimeout(() => {
    elements.copy.textContent = "複製結果";
  }, 1800);
}

elements.start.addEventListener("click", revealMission);
elements.restart.addEventListener("click", revealMission);
elements.missionAccept.addEventListener("click", startGame);
elements.missionClose.addEventListener("click", closeMissionDialog);
elements.copy.addEventListener("click", copyResult);
elements.kill.addEventListener("click", () => {
  if (locked) return;
  locked = true;
  clearTimers();
  state = stopAgent(state);
  elements.agentLine.textContent = "嗶——緊急終止。剩下的工作交還人類。";
  elements.kill.classList.add("pressed");
  window.setTimeout(finishRun, 500);
});

document.addEventListener("keydown", (event) => {
  if (elements.game.hidden || locked || elements.missionDialog.open) return;
  const numeric = Number(event.key);
  if (numeric >= 1 && numeric <= 3) {
    elements.choices.querySelectorAll("button")[numeric - 1]?.click();
  }
});
