import {
  EVENTS,
  applyChoice,
  createInitialState,
  getEnding,
  stopAgent,
} from "./game-engine.js";

const $ = (selector) => document.querySelector(selector);
const elements = {
  intro: $("#intro-screen"),
  game: $("#game-screen"),
  result: $("#result-screen"),
  start: $("#start-button"),
  restart: $("#restart-button"),
  copy: $("#copy-button"),
  kill: $("#kill-switch"),
  tokenValue: $("#token-value"),
  progressValue: $("#progress-value"),
  safetyValue: $("#safety-value"),
  tokenMeter: $("#token-meter"),
  progressMeter: $("#progress-meter"),
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
  finalTokens: $("#final-tokens"),
  finalProgress: $("#final-progress"),
  finalQuality: $("#final-quality"),
  finalSafety: $("#final-safety"),
  history: $("#history-list"),
};

let state = createInitialState();
let decisionTimer = null;
let countdownTimer = null;
let secondsLeft = 12;
let locked = false;

function showScreen(target) {
  [elements.intro, elements.game, elements.result].forEach((screen) => {
    screen.hidden = screen !== target;
  });
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function formatNumber(value) {
  return new Intl.NumberFormat("zh-Hant").format(value);
}

function setMeter(element, value, max) {
  const percent = Math.round((value / max) * 100);
  element.setAttribute("aria-valuenow", String(value));
  element.querySelector("span").style.width = `${percent}%`;
}

function renderHud() {
  elements.tokenValue.textContent = formatNumber(state.tokens);
  elements.progressValue.textContent = `${state.progress}%`;
  elements.safetyValue.textContent = `${state.safety}%`;
  setMeter(elements.tokenMeter, state.tokens, 1000);
  setMeter(elements.progressMeter, state.progress, 100);
  setMeter(elements.safetyMeter, state.safety, 100);

  const heat = state.tokens <= 250 ? "critical" : state.tokens <= 520 ? "warm" : "steady";
  elements.agentStage.dataset.heat = heat;
}

function renderStepDots() {
  elements.stepDots.innerHTML = EVENTS.map((event, index) => {
    const status = index < state.eventIndex ? "done" : index === state.eventIndex ? "active" : "";
    return `<span class="${status}" aria-label="事件 ${index + 1}${status === "done" ? " 已完成" : status === "active" ? " 進行中" : ""}"></span>`;
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
    if (!locked) selectChoice(event, event.choices[0], true);
  }, 12000);
}

function renderEvent() {
  locked = false;
  elements.feedback.hidden = true;
  const event = EVENTS[state.eventIndex];

  elements.eventPanel.classList.toggle("danger", Boolean(event.danger));
  elements.eventStep.textContent = event.step;
  elements.eventEyebrow.textContent = event.eyebrow;
  elements.eventIcon.textContent = event.icon;
  elements.eventTitle.textContent = event.title;
  elements.eventPrompt.textContent = event.prompt;
  elements.agentLine.textContent = event.agentLine;
  elements.toolName.textContent = event.tool;

  elements.choices.innerHTML = event.choices
    .map(
      (choice, index) => `
        <button class="choice-button" type="button" data-choice="${choice.id}">
          <span class="choice-key" aria-hidden="true">${index + 1}</span>
          <span class="choice-copy">
            <strong>${choice.label}</strong>
            <small>${choice.note}</small>
          </span>
          <span class="choice-cost ${choice.tokenCost >= 200 ? "hot" : ""}">
            ${choice.tokenCost === 0 ? "免費" : `−${choice.tokenCost} T`}
          </span>
        </button>`,
    )
    .join("");

  elements.choices.querySelectorAll("button").forEach((button) => {
    button.addEventListener("click", () => {
      const choice = event.choices.find((candidate) => candidate.id === button.dataset.choice);
      selectChoice(event, choice, false);
    });
  });

  renderHud();
  renderStepDots();
  startCountdown(event);
  elements.eventPanel.classList.remove("panel-enter");
  void elements.eventPanel.offsetWidth;
  elements.eventPanel.classList.add("panel-enter");
  elements.choices.querySelector("button")?.focus({ preventScroll: true });
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

function selectChoice(event, choice, timedOut) {
  if (locked) return;
  locked = true;
  clearTimers();

  elements.choices.querySelectorAll("button").forEach((button) => {
    button.disabled = true;
    button.classList.toggle("selected", button.dataset.choice === choice.id);
  });

  state = applyChoice(state, event.id, choice.id);
  renderHud();
  renderStepDots();
  spawnTokenBurst(choice.tokenCost);
  elements.gameRobot.classList.remove("react");
  void elements.gameRobot.offsetWidth;
  elements.gameRobot.classList.add("react");

  elements.feedbackIcon.textContent = timedOut ? "⏰" : choice.recommended ? "✨" : "⚡";
  elements.feedbackTitle.textContent = timedOut
    ? `時間到！Agent 自己選了「${choice.label}」`
    : `你選了「${choice.label}」`;
  elements.feedbackCopy.textContent = choice.feedback;
  elements.feedback.hidden = false;

  const delay = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 180 : 1250;
  window.setTimeout(() => {
    if (state.eventIndex >= EVENTS.length) finishRun();
    else renderEvent();
  }, delay);
}

function startGame() {
  clearTimers();
  state = createInitialState();
  showScreen(elements.game);
  renderEvent();
}

function finishRun() {
  clearTimers();
  const ending = getEnding(state);
  elements.endingIcon.textContent = ending.icon;
  elements.endingTitle.textContent = ending.title;
  elements.endingKicker.textContent = ending.kicker;
  elements.endingDescription.textContent = ending.description;
  elements.endingLesson.textContent = ending.lesson;
  elements.finalTokens.textContent = formatNumber(state.tokens);
  elements.finalProgress.textContent = `${state.progress}%`;
  elements.finalQuality.textContent = `${state.quality}%`;
  elements.finalSafety.textContent = `${state.safety}%`;

  elements.history.innerHTML = state.history
    .map(
      (item) => `
        <li>
          <span>${item.eventTitle}</span>
          <strong>${item.choiceLabel}</strong>
          <small>${item.tokenCost ? `−${item.tokenCost} Token` : "0 Token"}</small>
        </li>`,
    )
    .join("");

  elements.result.dataset.ending = ending.id;
  showScreen(elements.result);
  elements.restart.focus({ preventScroll: true });
}

async function copyResult() {
  const ending = getEnding(state);
  const text = `我的 AI 實習生監工結果：${ending.title}！剩餘 ${state.tokens} Token，任務進度 ${state.progress}%，安全護欄 ${state.safety}%。`;
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

elements.start.addEventListener("click", startGame);
elements.restart.addEventListener("click", startGame);
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
  if (elements.game.hidden || locked) return;
  const numeric = Number(event.key);
  if (numeric >= 1 && numeric <= 3) {
    elements.choices.querySelectorAll("button")[numeric - 1]?.click();
  }
});
