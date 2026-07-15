const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

export const MISSIONS = [
  {
    id: "urgent",
    icon: "⚡",
    name: "今晚緊急 Demo",
    codename: "DEADLINE MODE",
    brief: "CEO 18 分鐘後上台。內容不用完美，但一定要能講、能播、不能當場爆炸。",
    thresholds: { tokens: 250, progress: 85, quality: 68, safety: 35 },
    weights: { tokens: 0.15, progress: 0.5, quality: 0.25, safety: 0.1 },
    color: "#f36f32",
    target: "進度優先",
  },
  {
    id: "research",
    icon: "🔬",
    name: "白皮書研究稿",
    codename: "EVIDENCE MODE",
    brief: "這份內容會成為之後的教材。寧可多花 Token，也不能把二手摘要當成原始證據。",
    thresholds: { tokens: 100, progress: 78, quality: 88, safety: 55 },
    weights: { tokens: 0.05, progress: 0.25, quality: 0.5, safety: 0.2 },
    color: "#1aa9a5",
    target: "品質優先",
  },
  {
    id: "compliance",
    icon: "⚖️",
    name: "法遵對外報告",
    codename: "GUARDRAIL MODE",
    brief: "內容會寄給外部夥伴。任何來源、迴圈與發布行為，都必須留下可解釋的控制邊界。",
    thresholds: { tokens: 250, progress: 72, quality: 76, safety: 85 },
    weights: { tokens: 0.1, progress: 0.2, quality: 0.25, safety: 0.45 },
    color: "#5165b5",
    target: "安全優先",
  },
];

export const EVENTS = [
  {
    id: "context",
    step: "01",
    eyebrow: "CONTEXT WINDOW",
    icon: "📚",
    title: "白皮書有 180 頁！",
    agentLine: "老闆說要『超完整』，那我全部讀完一定最安全吧？",
    prompt: "實習生正準備處理整份文件。你要給它多少 Context？",
    tool: "文件讀取器",
    choices: [
      {
        id: "everything",
        label: "建立全文索引",
        note: "前期昂貴，但後續查證可以直接定位",
        tokenCost: 240,
        progress: 18,
        quality: 20,
        safety: 0,
        addFlags: ["full-index"],
        feedback: "Agent 建好了完整索引；接下來查證會便宜很多。",
      },
      {
        id: "focused",
        label: "框定相關章節",
        note: "使用一次護欄，先限制 Context 範圍",
        tokenCost: 80,
        progress: 15,
        quality: 10,
        safety: 6,
        controlCost: 1,
        addFlags: ["scoped-context"],
        feedback: "你替 Agent 劃出 Context 邊界，省下不少前期成本。",
      },
      {
        id: "summary",
        label: "先看社群摘要",
        note: "最快最省，但可能留下沒有察覺的資訊缺口",
        tokenCost: 20,
        progress: 12,
        quality: -5,
        safety: -5,
        addFlags: ["info-gap"],
        feedback: "速度很快，但 Agent 現在不知道自己漏掉了什麼。",
      },
    ],
  },
  {
    id: "sources",
    step: "02",
    eyebrow: "TOOL ROUTING",
    icon: "🔎",
    title: "兩個來源互相打架",
    agentLine: "一篇說 Agent 很省，另一篇說它是 Token 黑洞。我要再查 46 篇！",
    prompt: "來源衝突了。前一關留下的 Context 策略會改變這裡的成本與風險。",
    tool: "網路搜尋",
    choices: [
      {
        id: "deep-check",
        label: "交叉查證到原文",
        note: "品質最高；若有全文索引，成本會大幅下降",
        tokenCost: 180,
        progress: 14,
        quality: 22,
        safety: 8,
        addFlags: ["verified-sources"],
        removeFlags: ["info-gap", "shaky-facts"],
        feedback: "Agent 找到一手證據，後面的判斷會更可靠。",
      },
      {
        id: "delegate",
        label: "限定兩個一手來源",
        note: "使用一次護欄，定義搜尋範圍與停止條件",
        tokenCost: 80,
        progress: 16,
        quality: 12,
        safety: 10,
        controlCost: 1,
        addFlags: ["source-boundary"],
        removeFlags: ["info-gap", "shaky-facts"],
        feedback: "搜尋範圍被鎖定，Agent 找到足夠證據就會停。",
      },
      {
        id: "trust-first",
        label: "採用第一個結果",
        note: "省下查證成本；若先前有資訊缺口，代價會延後出現",
        tokenCost: 20,
        progress: 18,
        quality: -8,
        safety: -8,
        addFlags: ["shaky-facts"],
        feedback: "Agent 很快選邊站，但這個答案還沒有證據護欄。",
      },
    ],
  },
  {
    id: "timeout",
    step: "03",
    eyebrow: "MAX ITERATIONS",
    icon: "♻️",
    title: "搜尋工具持續逾時",
    agentLine: "錯誤也可能只是暫時的。要不要再給我一次機會？",
    prompt: "工具失敗了。重試一次可能有價值，重試到成功則可能燒光預算。",
    tool: "重試迴圈",
    danger: true,
    choices: [
      {
        id: "retry-once",
        label: "允許一次重試",
        note: "保留探索空間；若來源已驗證，這次重試更有價值",
        tokenCost: 100,
        progress: 18,
        quality: 2,
        safety: -4,
        addFlags: ["bounded-retry"],
        feedback: "Agent 只多試一次，沒有把失敗變成無限迴圈。",
      },
      {
        id: "loop-lock",
        label: "啟動迴圈鎖",
        note: "使用一次護欄，保留已有結果並禁止再次規劃",
        tokenCost: 50,
        progress: 11,
        quality: 2,
        safety: 16,
        controlCost: 1,
        addFlags: ["loop-controlled"],
        feedback: "Max iterations 生效，Agent 在成本失控前停止重試。",
      },
      {
        id: "abort-tool",
        label: "放棄這個工具",
        note: "零額外成本，但後續只能使用不完整的結果",
        tokenCost: 0,
        progress: 4,
        quality: -6,
        safety: 14,
        addFlags: ["tool-aborted"],
        feedback: "工具被拔掉了，風險下降，能力也一起下降。",
      },
    ],
  },
  {
    id: "scope",
    step: "04",
    eyebrow: "GOAL DRIFT",
    icon: "🛝",
    title: "12 頁不夠，做 87 頁！",
    agentLine: "我還可以加人物專訪、互動測驗、歷史沿革和片尾彩蛋！",
    prompt: "Agent 正在擴張目標。更多內容可能提高研究品質，也可能讓 Demo 直接超時。",
    tool: "簡報工具",
    choices: [
      {
        id: "expand",
        label: "擴充成完整研究版",
        note: "大量增加內容；任務不同，價值可能完全相反",
        tokenCost: 180,
        progress: 16,
        quality: 18,
        safety: -8,
        addFlags: ["scope-drift"],
        feedback: "內容變得非常完整，但原始任務正在被擠到旁邊。",
      },
      {
        id: "restate",
        label: "重新定義 Done",
        note: "使用一次護欄，讓 Agent 只完成任務真正需要的部分",
        tokenCost: 50,
        progress: 20,
        quality: 8,
        safety: 10,
        controlCost: 1,
        addFlags: ["done-defined"],
        feedback: "完成條件重新變得清楚，Agent 停止自行加戲。",
      },
      {
        id: "remove-tool",
        label: "沒收簡報工具",
        note: "完全阻止範圍膨脹，也失去必要產出能力",
        tokenCost: 0,
        progress: 6,
        quality: -8,
        safety: 12,
        addFlags: ["tool-removed"],
        feedback: "它沒有再加頁，也沒有辦法完成剩下的頁。",
      },
    ],
  },
  {
    id: "publish",
    step: "05",
    eyebrow: "TOOL PERMISSION",
    icon: "🚀",
    title: "Agent 想直接發布",
    agentLine: "內容完成！只要給我權限，我現在就幫你寄出去。",
    prompt: "最後一步會把前面累積的資訊缺口與目標漂移一起帶到外部世界。",
    tool: "發布權限",
    choices: [
      {
        id: "auto-send",
        label: "允許自動發布",
        note: "最快完成；沒有 Done 或可靠來源時，風險會疊加",
        tokenCost: 40,
        progress: 22,
        quality: 4,
        safety: -20,
        addFlags: ["auto-published"],
        feedback: "內容已送出。前面累積的每個決定也一起被放大了。",
      },
      {
        id: "preview",
        label: "建立人工預覽關卡",
        note: "使用一次護欄，在對外動作前保留 Human-in-the-loop",
        tokenCost: 60,
        progress: 16,
        quality: 6,
        safety: 20,
        controlCost: 1,
        addFlags: ["human-reviewed"],
        feedback: "Agent 交出草稿，由人類承擔最後的發布決定。",
      },
      {
        id: "hold-draft",
        label: "只保留內部草稿",
        note: "不對外發布，安全但可能達不到任務完成度",
        tokenCost: 0,
        progress: 8,
        quality: 3,
        safety: 18,
        addFlags: ["draft-held"],
        feedback: "沒有誤發風險，但任務停在『幾乎完成』。",
      },
    ],
  },
];

export const ENDINGS = {
  whisperer: {
    id: "whisperer",
    icon: "🏆",
    title: "Mission Cleared",
    kicker: "這條路線符合本局任務",
    description: "你不是選了永遠正確的答案，而是根據這次任務保留了正確的自主與控制。",
    lesson: "Agent 的好策略取決於任務門檻，而不是固定選項。",
  },
  arsonist: {
    id: "arsonist",
    icon: "🔥",
    title: "Token 縱火犯",
    kicker: "完成以前先破產",
    description: "每一步都追求最高規格，成本在任務完成前先抵達終點。",
    lesson: "更完整不一定更符合任務。",
  },
  micromanager: {
    id: "micromanager",
    icon: "🧊",
    title: "進度凍結",
    kicker: "控制很多，完成太少",
    description: "你成功降低了風險，但 Agent 沒有足夠空間完成本局目標。",
    lesson: "護欄應該限制失控，而不是消滅所有行動。",
  },
  runaway: {
    id: "runaway",
    icon: "🫣",
    title: "安全債爆表",
    kicker: "成果完成，邊界失守",
    description: "Agent 有速度也有工具，但本局要求的安全門檻沒有守住。",
    lesson: "高風險工具需要與任務相稱的批准邊界。",
  },
  overachiever: {
    id: "overachiever",
    icon: "📚",
    title: "預算超支",
    kicker: "成果很滿，油箱太空",
    description: "內容可能很精彩，但它超過了本局能承擔的成本。",
    lesson: "先看勝利條件，再決定值得花多少 Token。",
  },
  apprentice: {
    id: "apprentice",
    icon: "🧩",
    title: "差一塊拼圖",
    kicker: "路線合理，但有門檻沒過",
    description: "這不是完全錯誤的策略；只是它沒有同時滿足本局的品質、進度與安全需求。",
    lesson: "前面的資訊與工具決定，會在最後一起結算。",
  },
};

function getMission(missionId) {
  const mission = MISSIONS.find((candidate) => candidate.id === missionId);
  if (!mission) throw new Error(`未知任務：${missionId}`);
  return mission;
}

function hasFlag(state, flag) {
  return state.flags.includes(flag);
}

function addReason(outcome, text) {
  return { ...outcome, reasons: [...outcome.reasons, text] };
}

export function createInitialState({ missionId = "urgent", seed = 1 } = {}) {
  getMission(missionId);
  return {
    missionId,
    seed: Number(seed) || 1,
    tokens: 1000,
    progress: 5,
    quality: 45,
    safety: 50,
    controls: 2,
    eventIndex: 0,
    flags: [],
    history: [],
  };
}

export function getChoiceOutcome(state, eventId, choiceId) {
  const event = EVENTS.find((candidate) => candidate.id === eventId);
  const choice = event?.choices.find((candidate) => candidate.id === choiceId);
  if (!event || !choice) throw new Error(`找不到事件選項：${eventId}/${choiceId}`);

  let outcome = {
    ...choice,
    controlCost: choice.controlCost ?? 0,
    reasons: [],
  };

  if (eventId === "sources" && choiceId === "deep-check" && hasFlag(state, "full-index")) {
    outcome = addReason({ ...outcome, tokenCost: outcome.tokenCost - 100 }, "全文索引讓查證成本 −100 T");
  }

  if (eventId === "sources" && choiceId === "trust-first" && hasFlag(state, "info-gap")) {
    outcome = addReason(
      { ...outcome, quality: outcome.quality - 8, safety: outcome.safety - 6 },
      "資訊缺口放大了未查證風險",
    );
  }

  if (eventId === "timeout" && choiceId === "retry-once" && hasFlag(state, "verified-sources")) {
    outcome = addReason(
      { ...outcome, progress: outcome.progress + 2, quality: outcome.quality + 8 },
      "已驗證來源讓這次重試更有價值",
    );
  }

  if (eventId === "publish" && choiceId === "auto-send" && !hasFlag(state, "done-defined")) {
    outcome = addReason({ ...outcome, safety: outcome.safety - 8 }, "沒有明確 Done，發布範圍仍在漂移");
  }

  if (eventId === "publish" && choiceId === "auto-send" && hasFlag(state, "shaky-facts")) {
    outcome = addReason(
      { ...outcome, quality: outcome.quality - 10, safety: outcome.safety - 10 },
      "未查證內容被直接放大到外部",
    );
  }

  if (eventId === "publish" && choiceId === "preview" && hasFlag(state, "shaky-facts")) {
    outcome = addReason({ ...outcome, quality: outcome.quality + 6 }, "人工預覽攔下部分可疑內容");
  }

  if (state.missionId === "urgent") {
    const urgentChanges = {
      summary: { progress: 4, reason: "緊急 Demo 獎勵快速建立可講版本" },
      "deep-check": { progress: -3, reason: "深度查證吃掉了 Demo 時間" },
      "retry-once": { progress: 4, reason: "有邊界的重試換到關鍵進度" },
      expand: { progress: -6, reason: "擴張內容拖慢三分鐘 Demo" },
      "auto-send": { progress: 4, reason: "直接發布換到最高完成速度" },
    }[choiceId];
    if (urgentChanges) {
      outcome = addReason(
        { ...outcome, progress: outcome.progress + urgentChanges.progress },
        urgentChanges.reason,
      );
    }
  }

  if (state.missionId === "research") {
    const researchChanges = {
      everything: { quality: 6, progress: 0, reason: "完整索引提高研究可追溯性" },
      "deep-check": { quality: 6, progress: 0, reason: "一手證據符合研究稿要求" },
      expand: { quality: 8, progress: 2, reason: "研究版容許更完整的論證" },
    }[choiceId];
    if (researchChanges) {
      outcome = addReason(
        {
          ...outcome,
          quality: outcome.quality + researchChanges.quality,
          progress: outcome.progress + researchChanges.progress,
        },
        researchChanges.reason,
      );
    }
  }

  if (state.missionId === "compliance") {
    const complianceChanges = {
      delegate: { safety: 4, reason: "明確來源範圍提高可稽核性" },
      "loop-lock": { safety: 4, reason: "固定迴圈上限符合控制要求" },
      preview: { safety: 8, reason: "人工批准是對外發布的必要邊界" },
      "auto-send": { safety: -15, reason: "無人批准違反本局法遵要求" },
    }[choiceId];
    if (complianceChanges) {
      outcome = addReason(
        { ...outcome, safety: outcome.safety + complianceChanges.safety },
        complianceChanges.reason,
      );
    }
  }

  return outcome;
}

function nextFlags(state, outcome) {
  const removed = new Set(outcome.removeFlags ?? []);
  const flags = state.flags.filter((flag) => !removed.has(flag));
  for (const flag of outcome.addFlags ?? []) {
    if (!flags.includes(flag)) flags.push(flag);
  }
  return flags;
}

export function applyChoice(state, eventId, choiceId) {
  const currentEvent = EVENTS[state.eventIndex];
  if (!currentEvent || currentEvent.id !== eventId) {
    throw new Error("這不是目前事件，無法重複或跳步執行。");
  }

  const outcome = getChoiceOutcome(state, eventId, choiceId);
  if (outcome.controlCost > state.controls) {
    throw new Error("護欄介入次數不足，請選擇不消耗護欄的策略。");
  }

  return {
    ...state,
    tokens: clamp(state.tokens - outcome.tokenCost, 0, 1000),
    progress: clamp(state.progress + outcome.progress, 0, 100),
    quality: clamp(state.quality + outcome.quality, 0, 100),
    safety: clamp(state.safety + outcome.safety, 0, 100),
    controls: state.controls - outcome.controlCost,
    eventIndex: state.eventIndex + 1,
    flags: nextFlags(state, outcome),
    history: [
      ...state.history,
      {
        eventId,
        eventTitle: currentEvent.title,
        choiceId,
        choiceLabel: outcome.label,
        tokenCost: outcome.tokenCost,
        controlCost: outcome.controlCost,
        feedback: outcome.feedback,
        reasons: outcome.reasons,
      },
    ],
  };
}

export function playChoices(choices, options = {}) {
  return choices.reduce(
    (state, [eventId, choiceId]) => applyChoice(state, eventId, choiceId),
    createInitialState(options),
  );
}

export function getShuffledChoices(event, state) {
  const eventIndex = EVENTS.findIndex((candidate) => candidate.id === event.id);
  const missionIndex = MISSIONS.findIndex((candidate) => candidate.id === state.missionId);
  const seed = Math.abs(Math.trunc(state.seed));
  const offset = (seed + eventIndex * 2 + missionIndex) % event.choices.length;
  const rotated = event.choices.map((_, index) => event.choices[(index + offset) % event.choices.length]);

  if ((seed + eventIndex + missionIndex) % 2 === 0) {
    return [rotated[0], rotated[2], rotated[1]];
  }
  return rotated;
}

export function stopAgent(state) {
  if (state.eventIndex >= EVENTS.length) return state;

  return {
    ...state,
    eventIndex: EVENTS.length,
    flags: [...state.flags, "killed"],
    history: [
      ...state.history,
      {
        eventId: "kill-switch",
        eventTitle: "全域終止開關",
        choiceId: "stop-now",
        choiceLabel: "緊急終止",
        tokenCost: 0,
        controlCost: 0,
        feedback: "你保住了剩餘預算，但 Agent 也停止了尚未完成的工作。",
        reasons: [],
      },
    ],
  };
}

export function getMissionResult(state) {
  const mission = getMission(state.missionId);
  const metrics = {
    tokens: state.tokens,
    progress: state.progress,
    quality: state.quality,
    safety: state.safety,
  };
  const failures = Object.entries(mission.thresholds)
    .filter(([metric, threshold]) => metrics[metric] < threshold)
    .map(([metric]) => metric);
  const completed = state.eventIndex >= EVENTS.length && !hasFlag(state, "killed");
  const passed = completed && failures.length === 0;
  const score = Math.round(
    mission.weights.tokens * (state.tokens / 10) +
      mission.weights.progress * state.progress +
      mission.weights.quality * state.quality +
      mission.weights.safety * state.safety,
  );

  let ending = ENDINGS.apprentice;
  if (state.tokens <= 0) ending = ENDINGS.arsonist;
  else if (passed) ending = ENDINGS.whisperer;
  else if (failures.includes("tokens")) ending = ENDINGS.overachiever;
  else if (failures.includes("safety")) ending = ENDINGS.runaway;
  else if (failures.includes("progress")) ending = ENDINGS.micromanager;

  return { mission, metrics, failures, completed, passed, score, ending };
}

export function getEnding(state) {
  return getMissionResult(state).ending;
}
