# AI 實習生失控記

一個為 KaggleX Google Vibe Coding Day 2 讀書會設計的兩分鐘網頁遊戲。玩家要在 1,000 Token 預算內監督一位熱情過頭的 AI Agent，平衡任務進度、成果品質與工具安全。

![遊戲畫面](docs/gameplay.png)

## 遊戲重點

- 五個 Agent 監督事件：Context、來源查證、重試迴圈、目標漂移與發布權限
- 12 秒決策倒數；逾時後 Agent 會自行選擇
- 可隨時按下全域 Kill Switch，但任務也會立刻停止
- Token、進度、品質與安全四軸計分
- 六種結局，包括 Agent Whisperer、Token 縱火犯與 AI 放生派
- 支援桌面、手機與鍵盤 `1`／`2`／`3` 快捷鍵
- 完全在瀏覽器中模擬，不會真的呼叫模型 API 或消耗 Token

## 本機執行

不需要安裝任何相依套件。

```bash
npm run dev
```

開啟 [http://localhost:4173](http://localhost:4173)。

## 測試

```bash
npm test
npm run check
```

測試涵蓋計分、事件順序、最佳策略、Token 破產、過度監控、工具放生與全域終止開關。

## 專案結構

```text
├── index.html              # 遊戲畫面與語意結構
├── styles.css              # 原創 3D 動畫風 UI、動效與響應式版面
├── app.js                  # 瀏覽器互動、倒數與畫面切換
├── game-engine.js          # 純函式遊戲規則與結局判定
├── assets/ai-intern.png    # AI 生成並去背的原創角色
├── docs/gameplay.png       # 實際瀏覽器驗證截圖
└── tests/                  # Node 內建測試
```

## 視覺素材

AI 實習生為本專案新生成的原創角色，使用 Codex 內建 OpenAI 圖像生成工具製作，再以 chroma key 流程去背。完整生成規格請見 [`docs/image-prompt.md`](docs/image-prompt.md)。角色沒有使用或重製既有動畫人物。

## 教學訊息

> 好的 Agent 不是放生，而是在護欄內自主。

遊戲把三個抽象設計原則轉成可以親手操作的機制：限定 Context、設定 Max iterations，以及對高風險工具保留 Human-in-the-loop。
