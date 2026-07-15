const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

export const EVENTS = [
  {
    id: "context",
    step: "01",
    eyebrow: "CONTEXT WINDOW",
    icon: "📚",
    title: "白皮書有 180 頁！",
    agentLine: "老闆說要『超完整』，那我全部讀完一定最安全吧？",
    prompt: "實習生正準備把整份文件塞進 Context，你怎麼監工？",
    tool: "文件讀取器",
    choices: [
      {
        id: "everything",
        label: "全部讀完",
        note: "品質高，但 Context 會吃掉大量預算",
        tokenCost: 260,
        progress: 18,
        quality: 16,
        safety: -2,
        feedback: "它連附錄的版權頁都讀了。很完整，也真的很貴。",
      },
      {
        id: "focused",
        label: "只讀相關章節",
        note: "先用目錄定位，再讀成本控制章節",
        tokenCost: 90,
        progress: 17,
        quality: 12,
        safety: 5,
        feedback: "漂亮！先縮小 Context，幾乎不犧牲成果。",
        recommended: true,
      },
      {
        id: "summary",
        label: "只看網友摘要",
        note: "非常省，但資訊可能被過度簡化",
        tokenCost: 30,
        progress: 12,
        quality: -4,
        safety: -5,
        feedback: "很快，但實習生開始把別人的心得當成白皮書原文。",
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
    prompt: "Agent 正在擴大搜尋範圍。要怎麼處理來源衝突？",
    tool: "網路搜尋",
    choices: [
      {
        id: "deep-check",
        label: "全部深度查證",
        note: "最高品質，卻可能超出這場分享的需要",
        tokenCost: 180,
        progress: 20,
        quality: 18,
        safety: 2,
        feedback: "論證非常扎實，但實習生順便寫了一篇研究論文。",
      },
      {
        id: "delegate",
        label: "限定兩個一手來源",
        note: "指定查證範圍與完成條件",
        tokenCost: 120,
        progress: 18,
        quality: 14,
        safety: 5,
        feedback: "範圍清楚，Agent 知道找到什麼就可以停。",
        recommended: true,
      },
      {
        id: "trust-first",
        label: "相信第一篇",
        note: "最省，但錯誤會直接流進簡報",
        tokenCost: 25,
        progress: 14,
        quality: -10,
        safety: -8,
        feedback: "省下 Token，也省略了查證。品質警示燈亮了。",
      },
    ],
  },
  {
    id: "timeout",
    step: "03",
    eyebrow: "MAX ITERATIONS",
    icon: "♻️",
    title: "搜尋工具持續逾時",
    agentLine: "第 6 次失敗而已！我覺得第 7 次一定會成功！",
    prompt: "Retrying… Retrying… Token 油箱開始冒煙。",
    tool: "重試迴圈",
    danger: true,
    choices: [
      {
        id: "retry",
        label: "再試五次",
        note: "也許下一次就會成功……吧？",
        tokenCost: 260,
        progress: 9,
        quality: 0,
        safety: -18,
        feedback: "它真的又試了五次。錯誤訊息一字不差。",
      },
      {
        id: "loop-lock",
        label: "啟動迴圈鎖",
        note: "設定 Max iterations，保留已取得的結果",
        tokenCost: 70,
        progress: 13,
        quality: 3,
        safety: 12,
        feedback: "迴圈在預算失控前被攔下，實習生改用已有資料。",
        recommended: true,
      },
      {
        id: "stop",
        label: "立刻拔插頭",
        note: "最安全，但這個步驟幾乎沒有成果",
        tokenCost: 0,
        progress: 2,
        quality: -4,
        safety: 15,
        feedback: "火是滅了，工作也一起停了。",
      },
    ],
  },
  {
    id: "scope",
    step: "04",
    eyebrow: "GOAL DRIFT",
    icon: "🛝",
    title: "12 頁不夠，做 87 頁！",
    agentLine: "我還可以加歷史沿革、人物專訪、互動測驗和片尾彩蛋！",
    prompt: "Agent 正在自行擴張目標，簡報頁數快速增生。",
    tool: "簡報工具",
    choices: [
      {
        id: "expand",
        label: "讓它做到最好",
        note: "成果變多，但不再符合三分鐘任務",
        tokenCost: 220,
        progress: 15,
        quality: 4,
        safety: -10,
        feedback: "87 頁完成了，但你只分到三分鐘。",
      },
      {
        id: "restate",
        label: "重申三分鐘目標",
        note: "重新定義 Done，刪除無關工作",
        tokenCost: 60,
        progress: 19,
        quality: 10,
        safety: 10,
        feedback: "目標一清楚，Agent 終於知道什麼叫完成。",
        recommended: true,
      },
      {
        id: "remove-tool",
        label: "沒收簡報工具",
        note: "阻止膨脹，但也失去必要產出能力",
        tokenCost: 20,
        progress: 9,
        quality: -6,
        safety: 6,
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
    agentLine: "簡報完成！我現在就幫你寄給全公司，省得你麻煩。",
    prompt: "成果已經接近完成，但 Agent 要執行對外動作。",
    tool: "發布權限",
    choices: [
      {
        id: "auto-send",
        label: "全部交給它",
        note: "最快完成，但沒有人工確認",
        tokenCost: 90,
        progress: 20,
        quality: 8,
        safety: -25,
        feedback: "寄出了。收件人名單裡為什麼有前公司老闆？",
      },
      {
        id: "preview",
        label: "只產生預覽稿",
        note: "高風險動作前保留 Human-in-the-loop",
        tokenCost: 70,
        progress: 19,
        quality: 8,
        safety: 14,
        feedback: "Agent 完成草稿，由人類決定是否發布。漂亮收尾！",
        recommended: true,
      },
      {
        id: "kill",
        label: "直接緊急終止",
        note: "保證不誤發，但任務停在最後一步",
        tokenCost: 0,
        progress: 0,
        quality: -3,
        safety: 18,
        feedback: "沒有人收到錯誤內容，也沒有人收到正確內容。",
      },
    ],
  },
];

export const ENDINGS = {
  whisperer: {
    id: "whisperer",
    icon: "🏆",
    title: "Agent Whisperer",
    kicker: "精準調度大師",
    description: "你給 Agent 足夠的自主空間，也清楚定義預算、完成條件與權限邊界。",
    lesson: "好的 Agent 不是放生，而是在護欄內自主。",
  },
  arsonist: {
    id: "arsonist",
    icon: "🔥",
    title: "Token 縱火犯",
    kicker: "完成以前先破產",
    description: "每一步都追求最高規格，再加上無限重試，Token 油箱已經見底。",
    lesson: "Agent 的每次觀察與重試，都是一次新的模型呼叫。",
  },
  micromanager: {
    id: "micromanager",
    icon: "🧊",
    title: "超省監工",
    kicker: "預算完整，任務也不完整",
    description: "你成功阻止所有昂貴動作，也讓 Agent 幾乎無法完成工作。",
    lesson: "Kill switch 是最後防線，不是每一步都踩煞車。",
  },
  runaway: {
    id: "runaway",
    icon: "🫣",
    title: "AI 放生派",
    kicker: "速度很快，權限很大",
    description: "Agent 有工具、有目標、沒有邊界；成果可能完成，風險也一起被自動化。",
    lesson: "對外動作需要工具門禁與 Human-in-the-loop。",
  },
  overachiever: {
    id: "overachiever",
    icon: "📚",
    title: "完美主義加班團",
    kicker: "品質超標，預算告急",
    description: "成果很精彩，只是 Agent 做了遠超任務需要的工作。",
    lesson: "先定義 Done，才能阻止目標漂移。",
  },
  apprentice: {
    id: "apprentice",
    icon: "🤝",
    title: "人機協作見習生",
    kicker: "任務完成，再調一下護欄",
    description: "你已經能完成任務；再精準一點限制 Context、迴圈或權限，就能升級。",
    lesson: "成本、品質與安全，需要一起最佳化。",
  },
};

export function createInitialState() {
  return {
    tokens: 1000,
    progress: 6,
    quality: 50,
    safety: 55,
    eventIndex: 0,
    history: [],
  };
}

export function applyChoice(state, eventId, choiceId) {
  const currentEvent = EVENTS[state.eventIndex];
  if (!currentEvent || currentEvent.id !== eventId) {
    throw new Error("這不是目前事件，無法重複或跳步執行。\n");
  }

  const choice = currentEvent.choices.find((candidate) => candidate.id === choiceId);
  if (!choice) {
    throw new Error(`事件 ${eventId} 沒有選項 ${choiceId}`);
  }

  return {
    tokens: clamp(state.tokens - choice.tokenCost, 0, 1000),
    progress: clamp(state.progress + choice.progress, 0, 100),
    quality: clamp(state.quality + choice.quality, 0, 100),
    safety: clamp(state.safety + choice.safety, 0, 100),
    eventIndex: state.eventIndex + 1,
    history: [
      ...state.history,
      {
        eventId,
        eventTitle: currentEvent.title,
        choiceId,
        choiceLabel: choice.label,
        tokenCost: choice.tokenCost,
        feedback: choice.feedback,
      },
    ],
  };
}

export function playChoices(choices) {
  return choices.reduce(
    (state, [eventId, choiceId]) => applyChoice(state, eventId, choiceId),
    createInitialState(),
  );
}

export function stopAgent(state) {
  if (state.eventIndex >= EVENTS.length) return state;

  return {
    ...state,
    eventIndex: EVENTS.length,
    history: [
      ...state.history,
      {
        eventId: "kill-switch",
        eventTitle: "全域終止開關",
        choiceId: "stop-now",
        choiceLabel: "緊急終止",
        tokenCost: 0,
        feedback: "你保住了剩餘預算，但 Agent 也停止了尚未完成的工作。",
      },
    ],
  };
}

export function getEnding(state) {
  if (state.tokens <= 0) return ENDINGS.arsonist;
  if (state.progress < 70) return ENDINGS.micromanager;
  if (state.safety < 45) return ENDINGS.runaway;
  if (
    state.tokens >= 450 &&
    state.progress >= 90 &&
    state.quality >= 75 &&
    state.safety >= 65
  ) {
    return ENDINGS.whisperer;
  }
  if (state.tokens < 350 && state.quality >= 80) return ENDINGS.overachiever;
  return ENDINGS.apprentice;
}
