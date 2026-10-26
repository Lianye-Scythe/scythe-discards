# Scythe Discards 規劃與技術方案

日期：2026-10-26。狀態：v0.3.3 原始碼已公開，Windows／Linux 三語 GitHub CI 通過；一般 Release 目前為草稿。實測範圍另記於 [VALIDATION.md](VALIDATION.md)。

## 1. 要解決的問題

使用者希望保留大量開啟的分頁，並明確控制閒置網頁何時卸載。即使系統尚有可用 RAM，也能依指定時間發出卸載請求。

第一版的成功條件是「規則可預期、背景排程可恢復、白名單確實生效」，再實測能省多少記憶體及增加多少次重載。

第一版的操作單位是分頁，動作是 Chrome 原生 `discard`。Windows 程序調整、記憶體壓縮、固定 GB 硬上限與 Chromium 修改不在此階段。

## 2. 產品規則

### 2.1 兩種模式，共用一套引擎

| 規則 | 一般逾時模式（預設） | 嚴格逾時模式 |
| --- | --- | --- |
| 閒置時間達到設定值 | 嘗試卸載 | 嘗試卸載 |
| 需要系統記憶體不足 | 不需要 | 不需要 |
| 網站白名單、手動保護 | 一律保留 | 一律保留 |
| 任一視窗的 active 分頁 | 一律保留 | 一律保留 |
| 與 active 分頁同組的可見分割畫面 | 一律保留 | 一律保留 |
| 釘選分頁 | 保留 | 不因釘選而跳過 |
| `audible` 分頁 | 保留 | 不因音訊而跳過 |
| `autoDiscardable === false` | 保留 | 不視為本工具的排除條件 |
| 已卸載、已關閉、無法取得 URL 的分頁 | 跳過 | 跳過 |
| `http:`、`https:` 以外的網址 | 跳過 | 跳過 |

「嚴格」表示本工具不額外套用上述軟性保護條件，會指定 `tabId` 發出請求；不是繞過 Chrome 的最終限制。API 失敗必須顯示與記錄，不能宣稱已成功卸載。

第一版預設逾時 30 分鐘，可設定正整數分鐘，最小 1 分鐘。預設使用一般模式；嚴格模式是清楚可選的設定。

嚴格模式的說明應直接告知：可能中斷背景播放、會議或清除未儲存內容。一般模式也無法保證辨識所有表單、通話、裝置使用和網站內部狀態；重要網站仍應加入白名單。

本工具的白名單獨立於 Chrome 原生「一律保持啟用」設定。原生例外不應被假定能阻止本工具明確指定的卸載請求；本工具亦不保證阻止 Chrome 或作業系統自身的記憶體回收。

### 2.2 閒置時間如何計算

- 分頁從 active 切為背景時，記錄 `inactiveSince`，開始完整的逾時計時。
- 切回該分頁後取消倒數；再次切走時重新開始。
- 單純移開 Chrome 視窗焦點不視為分頁切換；各視窗的 active 分頁仍受保護。
- 在背景建立、且尚未切過去的分頁，從建立時間開始計時。
- 背景網頁自己的 JavaScript、網路活動、播放音訊或重新整理，不重設閒置時間。
- 分割畫面若提供有效、非 NONE 的 `splitViewId`，將同一視窗內 active 分頁的同組頁面視為使用中；離開該組後才開始倒數。舊版無該欄位時不啟用此判斷。
- 不能直接用 `lastAccessed` 當作切走時間：官方定義是最後一次「成為 active」的時間。
- 首次安裝、瀏覽器重啟或擴充功能重新載入後，若缺少可信的背景時間，從重新觀察的時間開始，給完整逾時期間。
- 電腦睡眠期間計入經過時間；喚醒後先重查目前分頁與保護狀態，再處理過期分頁。

例如：分頁 A 使用 2 小時後才切走，設定 30 分鐘時，應從切走後再等 30 分鐘，不應立刻卸載。

### 2.3 白名單與操作

網站規則採用 hostname，提供「包含子網域」選項：

- `example.com`、不包含子網域：只保護該 hostname。
- `example.com`、包含子網域：保護本身及 `docs.example.com` 等子網域。
- `notexample.com`、`example.com.attacker.test` 都不能匹配上述規則。
- 以 `URL.hostname` 解析，統一大小寫、國際化網域及結尾的點；不以整段 URL 的字串包含判斷。
- 不提供任意正規表示式或複雜 URL 萬用字元。
- v0.3 popup 可選「僅目前 hostname」或「主網域與所有子網域」。以本機 tldts 及內附 Public Suffix List 判斷主網域，含私人後綴，例如 alice.github.io 不會擴大為 github.io。
- 公共後綴、IP、localhost 不提供含所有子網域的規則；舊有不安全的廣泛規則降為精確 hostname。
- 繼承父網域規則時顯示來源與管理入口；只移除明確擁有的規則，移除後可復原。廣泛規則升級取得新 ID，避免舊復原操作刪掉新的保護。

操作包含：新增／移除網站白名單、保護目前分頁至本次瀏覽器工作階段結束、全域暫停／恢復、查看到期與跳過原因。

新增白名單立即影響尚未執行的卸載。移除最後一項網站白名單或手動保護後，從移除時間起給完整的逾時期間。恢復全域暫停後，對已載入背景分頁重新計時，避免同時立即卸載。

逾時或模式設定變更時，以原有 `inactiveSince` 重新計算；若新期限已過，下一輪可進入卸載。介面需顯示此行為。

## 3. 技術選擇

| 項目 | 第一版選擇 | 用途 |
| --- | --- | --- |
| 平台 | Chrome Manifest V3，最低 Chrome 120 | 支援 30 秒 alarm 排程 |
| 語言 | TypeScript，嚴格型別 | 保持規則與 Chrome API 的邊界清楚 |
| 執行 | Extension service worker | 處理事件與背景排程 |
| 卸載 | `chrome.tabs.discard(tabId)` | 明確卸載指定的背景分頁 |
| 排程 | 一個全域 `chrome.alarms`，每 30 秒檢查 | 避免每個分頁各有常駐計時器 |
| 設定 | `chrome.storage.local` | 儲存模式、時間與網站白名單 |
| 工作階段狀態 | `chrome.storage.session` | 保存背景時間、手動保護、重試狀態及有限紀錄 |
| 介面 | React、TypeScript，保留靜態 HTML 入口 | 設定頁與工具列 popup；v0.2 依使用者授權遷移 |
| 介面樣式 | Tailwind CSS v4，CLI 建置為本機靜態 CSS | 共用設定頁與 popup 的樣式規則 |
| 網域解析 | tldts，離線 Public Suffix List，含私人後綴 | 精確區分 hostname 與主網域範圍 |
| 在地化 | Chrome 原生 i18n，en／zh_TW／zh_CN | 三語介面、錯誤與紀錄原因 |
| 核心權限 | `tabs`、`storage`、`alarms` | URL 白名單、保存設定及排程 |

`tabs` 權限用於取得 URL 等分頁資訊，不代表讀取網頁內容。第一版不需要網站內容注入、`debugger` 或原生 Windows 安裝程式。

`system.memory` 留待後續記憶體壓力模式，以選用權限加入；嚴格逾時模式不應依賴這項資料。

版本策略：Node.js 採最新 LTS，其他依賴採最新穩定版並鎖定精確版本與 lockfile。最低 Chrome 版本是相容性下限，開發驗證使用最新穩定版；不使用 Dev channel 專屬 API。版本更新應重新執行型別、政策及真實瀏覽器測試。

### 3.1 介面 CSS 建議

採用 Tailwind CSS v4 與 `@tailwindcss/cli`，於開發／建置時產生靜態 CSS，再隨擴充功能打包。Tailwind 的現行相容性要求為 Chrome 111 以上，符合本專案 Chrome 120 以上的目標。

- CSS 僅載入於 popup、設定頁等擴充功能介面；不注入使用者正在瀏覽的網站。
- v0.2 改用 React 管理呈現及互動狀態；共用控制依 shadcn/ui 模式搭配 Radix primitives，自訂 Chrome 方向樣式。卸載政策及背景排程保持獨立，不載入 React。
- 使用 CLI 輸出本機 CSS，不使用 Play CDN 或於瀏覽器內編譯樣式的腳本，符合擴充功能本機資源與 CSP 的整合方向。
- 使用共用的顏色、間距、字級與焦點樣式，保持設定頁、白名單與 popup 一致。重複的按鈕／欄位樣式以少量共用元件樣式維護。
- 動態狀態對應完整的 class 字串，不使用 `bg-${color}-500` 之類的拼接，避免建置時漏掉樣式。
- 驗證 Tailwind Preflight 對原生 input、checkbox、button 的影響；保留清楚的標籤、鍵盤焦點與錯誤狀態。
- 建置產物包含編譯後 CSS，不引入 Tailwind JavaScript 執行時；仍需實測介面的 DOM、樣式與其他程式碼開銷。

### 3.2 模組邊界

```text
Chrome 分頁事件 ──> Session state ──> Policy engine
Chrome alarm ─────────────────────> Policy engine
設定與白名單 ─────────────────────> Policy engine
Policy engine ──> 候選分頁與原因 ──> Executor ──> tabs.discard(tabId)
Executor ──> 結果與有限操作紀錄 ──> 設定頁 / Popup
```

- Policy engine 是純函式，接收設定、時間與分頁快照，回傳決策及原因碼。
- Executor 每次執行前重新取得該分頁、最新設定與保護狀態，再判斷一次。
- API 成功返回的分頁資訊或後續分頁狀態確認 `discarded` 後，才記為成功；已被 Chrome 自行卸載者另記為已卸載。
- 分頁關閉、被替換、移至其他視窗、URL 改變與 split view 改變，需更新或重建對應狀態。
- 同一 worker 內的狀態變更與 sweep 串行處理，避免重複卸載及非同步儲存互相覆蓋。

### 3.3 背景生命週期

Service worker 可能在閒置後被 Chrome 結束，不能依賴常駐的 `setInterval`、`setTimeout` 或僅存在全域變數的狀態。

- 事件監聽器同步註冊，非同步初始化完成後才處理決策。
- 每次 worker 啟動都檢查 alarm 是否存在，必要時重新建立，不依賴跨版本的 alarm 保存行為。
- worker 重啟後從 `storage.session` 恢復計時；瀏覽器重啟後建立新工作階段，不沿用可能已重複使用的 tab ID。
- 保留本機設定；操作紀錄不儲存完整瀏覽歷史，最多保留最近 200 筆工作階段事件，每頁顯示 50 筆，提供清除。事件與錯誤保存原因碼，介面依當下語言呈現；清除不重設倒數、保護或設定。
- 全域暫停時不執行卸載；沒有候選頁時不持續做額外工作。

30 秒檢查間隔是排程粒度，不是最長延遲保證。Chrome 可延遲 alarm；大量候選頁也可能排隊。介面使用「到期後嘗試卸載」，不宣稱準時到秒。

## 4. 第一版演算法

先實作確定性的時間規則，不先做 LRU-K、機器學習、每頁 RAM 評分或 Windows RAM 預算控制器。

```text
收到 alarm：
  讀取設定、工作階段狀態與目前分頁
  若全域暫停，結束

  對每個分頁：
    若使用中、在可見分割畫面、受保護、URL 不支援、已卸載，跳過
    若一般模式，額外套用釘選、音訊及 autoDiscardable 保護
    若沒有可信的 inactiveSince，從現在起算並跳過本輪
    若距離 inactiveSince 未達期限，或尚在重試冷卻，跳過
    否則加入候選佇列

  按最早到期排序候選頁
  逐一重新驗證最新狀態，再指定 tabId 呼叫 discard
  記錄成功、跳過或 API 失敗
```

掃描為 O(n)，候選排序為 O(k log k)。目前不建立每分頁 alarm、優先佇列或預測模型；先以實測確認有必要再增加複雜度。

同一分頁切回後再切走，給新的完整期限。API 失敗採 30、60、120、300 秒上限的重試冷卻，不重設原本的閒置起點，不形成無限立即重試。

大量候選頁逐一處理，worker 單輪採有界的執行時間，剩餘候選下一輪繼續；不刻意喚醒已卸載的分頁來量測記憶體。

## 5. 開發順序與驗收

### 階段 A：API 可行性驗證

- 使用獨立測試設定檔，在實際穩定版 Chrome 驗證明確指定 tab ID 的行為。
- 驗證一般背景頁、釘選、音訊播放、`autoDiscardable=false`、active 頁、分割畫面及已卸載頁。
- 嚴格模式驗收以實測的 Chrome 版本記錄結果；Chromium HEAD 原始碼不等於使用者已安裝版本的保證。
- 驗證切回後重新載入、原分頁標籤保留，以及 API 拒絕時能顯示原因。

### 階段 B：政策引擎與背景排程

- 實作模式、背景時間、白名單、手動保護與全域暫停。
- 實作設定保存、alarm 重建、狀態恢復、重試與有限結果紀錄。
- 對會造成錯誤卸載的邊界寫有意義的政策測試：白名單邊界、倒數起點、模式差異、切回競態與重啟恢復。

### 階段 C：可操作的擴充功能

- 設定頁可選模式、輸入時間、編輯白名單，並顯示規則說明。
- Popup 提供暫停、保護目前分頁、加入目前網站、查看執行狀態及最近結果。
- 顯示預計到期時間、跳過原因及最近實際結果；不顯示無根據的「已省下幾 GB」。

### 階段 D：實際驗證與比較

- 功能流程使用 Playwright；失敗時使用 Chrome DevTools 診斷，再回到 Playwright 驗證。
- 驗證 worker 被終止後倒數仍有效、瀏覽器重啟的寬限、睡眠恢復、暫停與白名單變更。
- 特別驗證：頁面使用 2 小時後切走，仍應得到完整的 30 分鐘期限。
- 在相同分頁與操作流程下比較原生最大節省模式、一般模式、嚴格模式；記錄環境與設定。
- 指標包含系統可用 RAM、Chrome 程序記憶體指標、已載入／已卸載分頁數、重載次數、切回等待及本工具的額外開銷。
- 分清 Working Set、Private Working Set、Commit 與共享程序；不把程序用量直接當單頁可回收量。

## 6. 後續階段的條件

- 若逾時模式會過早卸載常用頁，再研究近期工作集或回訪成本排序。
- 若需要記憶體壓力模式，使用 `system.memory` 的可用量，以高低門檻避免反覆回收；嚴格逾時仍獨立可用。
- 若確實需要根據 Chrome 程序用量訂回收目標，再加入小型 Windows Native Messaging host。量測與分頁選擇分工，仍不承諾固定 GB 硬上限。
- 每一步都先與較簡單的基準策略比較，再決定是否保留複雜度。

## 7. 官方依據

以下於 2026-10-26 查閱。文件支援 API 契約，Chromium HEAD 僅用於理解實作；發布版本差異由階段 A 驗證。

- [Tabs API：discard、lastAccessed、autoDiscardable、splitViewId](https://developer.chrome.com/docs/extensions/reference/api/tabs)
- [Alarms：排程粒度、延遲、睡眠與保存行為](https://developer.chrome.com/docs/extensions/reference/api/alarms)
- [Extension service worker 生命週期](https://developer.chrome.com/docs/extensions/develop/concepts/service-workers/lifecycle)
- [Storage：local 與 session 的生命週期](https://developer.chrome.com/docs/extensions/reference/api/storage)
- [System memory API](https://developer.chrome.com/docs/extensions/reference/api/system/memory)
- [Native Messaging](https://developer.chrome.com/docs/extensions/develop/concepts/native-messaging)
- [Tailwind CLI：產生靜態 CSS](https://tailwindcss.com/docs/installation/tailwind-cli)
- [Tailwind 瀏覽器相容性](https://tailwindcss.com/docs/compatibility)
- [Tailwind class 偵測規則](https://tailwindcss.com/docs/detecting-classes-in-source-files)
- [Chrome 擴充功能 CSP](https://developer.chrome.com/docs/extensions/reference/manifest/content-security-policy)
- [Chromium HEAD：TabsDiscardFunction](https://chromium.googlesource.com/chromium/src/+/HEAD/chrome/browser/extensions/api/tabs/tabs_api.cc)
- [Chromium HEAD：Tab lifecycle unit](https://chromium.googlesource.com/chromium/src/+/HEAD/chrome/browser/resource_coordinator/tab_lifecycle_unit.cc)
