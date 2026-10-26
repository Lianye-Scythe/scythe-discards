# Validation

## v0.3.3 release baseline

The source repository is public. Ordinary Releases are automatically published after validation of the requested version tag; see the [Releases page](https://github.com/Lianye-Scythe/scythe-discards/releases) for available downloads. This summary describes the tested release baseline at commit `8f74ddc`, not a promise of broad browser or workload coverage.

| Check | Recorded result |
| --- | --- |
| Type checking and core/i18n tests | Passed; 32 tests |
| Linux Chrome for Testing | English, Traditional Chinese and Simplified Chinese each passed 8 API/lifecycle cases + 16 UI groups |
| Windows Chrome for Testing | The same three-language matrix passed |
| Installed Windows Chrome | Traditional Chinese passed the same 8 + 16 groups |
| Initial release workflow | Both OS jobs and the initial draft creation job passed; automated publication is recorded in Actions |
| Release ZIP | 19 files; SHA256SUMS verified; runtime matches both CI builds |

Evidence: [main-branch CI](https://github.com/Lianye-Scythe/scythe-discards/actions/runs/40349873313) and [tag/release CI](https://github.com/Lianye-Scythe/scythe-discards/actions/runs/40350912938). Testing used isolated profiles. The CI browser was Chrome for Testing 156.0.8078.47; the separately installed Windows browser was 156.0.8078.48. Windows copies of text/HTML files differ only in line endings from the Linux release package.

These results cover the fixtures and interaction paths exercised. Real sleep/wake, long-term use, hundreds of real tabs, memory benefit, macOS and complete WCAG conformance remain outside the demonstrated scope. Reports and captures are generated under the Git-ignored `artifacts/` and `.impeccable/review/` directories and retained as GitHub Actions artifacts according to the workflow policy.

## Development record (Traditional Chinese)

以下保留各開發階段的驗證紀錄；「尚未推送」等敘述反映該階段的狀態，目前公開與雲端驗證狀態以上方摘要為準。

日期：2026-10-26。

## 版本策略與實際版本

Node.js 24.22.1 為查閱官方 release index 時的最新 LTS，固定於 `.nvmrc`；npm 12.2.1 為目前最新穩定版。依賴使用精確版本，重現建置使用 `npm ci`。

| 套件 | 版本 | 用途 |
| --- | --- | --- |
| TypeScript | 7.0.2 | 型別檢查 |
| esbuild | 0.28.2 | 打包本機程式 |
| Tailwind CSS / CLI | 4.3.3 | 建置靜態樣式 |
| @types/chrome | 0.3.6 | Chrome API 型別 |
| @types/node | 24.19.2 | 對應 Node 24 LTS 的最新型別版本 |
| Playwright | 1.64.1 | 真實瀏覽器功能測試 |
| @resvg/resvg-js | 2.6.2 | 將 PNG 原稿等比輸出為四種圖示尺寸 |
| fflate | 0.8.3 | ZIP 封裝與測試瀏覽器解壓 |
| React / React DOM | 19.3.1 | 設定頁及 popup 呈現 |
| @types/react / @types/react-dom | 19.3.0 | React 型別 |
| @radix-ui/react-switch | 1.4.1 | 共用開關互動 |
| @radix-ui/react-radio-group | 1.5.1 | 單選與鍵盤操作 |
| @radix-ui/react-checkbox | 1.4.1 | 子網域選項 |
| class-variance-authority / clsx / tailwind-merge | 0.7.1 / 2.1.1 / 3.7.0 | 本機元件變體與樣式組合 |
| lucide-react | 1.61.0 | 一致的 SVG 圖示 |
| tldts | 7.4.19 | 離線主網域與私人後綴解析 |

套件版本以 npm registry 的 stable/latest 與實際 lockfile 核對。`@types/node` 依執行環境選擇 24 系列，而不是較新主版本的型別。

## 自動化檢查

- `npm run check`：TypeScript 嚴格型別檢查。
- `npm test`：政策與控制器測試，覆蓋網域匹配、倒數起點、兩種模式、重啟恢復、白名單與手動保護、競態、失敗退避、儲存失敗及 tab ID 更換。
- `npm run test:setup`：下載官方最新穩定版 Chrome for Testing，不更改系統瀏覽器。
- `npm run test:browser`：在獨立設定檔實際載入擴充功能，以 Chrome API、真實 alarm 及頁面恢復驗證行為。完整結果在 `artifacts/browser-results.json`。
- 介面流程、深淺色、設定頁窄視窗與 popup 使用 Playwright 驗證；畫面證據在 `artifacts/`。

瀏覽器測試會在本機建立測試網頁，並透過測試設定檔的 session storage 加速倒數；正式擴充功能沒有修改時間的測試訊息或遠端控制端點。

## v0.3.3 Popup 資訊密度與網站保護

- 延續使用者指定的 Chrome 方向，繼承網站保護改成鎖定圖示、實際規則來源與管理入口；保留範圍選單以明確切換主網域規則。精確網站的說明不再重複 hostname。
- Windows 相同 360px 寬度的普通畫面由 **528px 降為 475px**，繼承保護由 **580px 降為 503px**。以實際 PNG 尺寸及 DOM 高度核對，結果 `artifacts/popup-height-v033.json`。
- 超過 44 字元的 hostname／規則來源精簡中段，同時保留兩端；原生 details／summary 可用鍵盤展開、收合並讀取完整可選取文字。測試使用 251 字元 hostname 與 187 字元來源，涵蓋 320px 展開、完成一次資料刷新後仍保持展開、來源完整可見與管理按鈕焦點不被遮住。
- 斷線時收起舊的普通成功通知，焦點仍在通知內時移至可用恢復入口；保留錯誤與 Undo，並暫停通知逾時。測試確認 Undo 在離線 20 秒後仍存在，重新連線後可以復原。
- 型別檢查、**32 個核心／i18n 測試**及建置通過。Linux Chrome for Testing **156.0.8078.47** 的英語、簡體中文、繁體中文，以及 Windows 已安裝 Chrome **156.0.8078.48** 的繁體中文，各通過 **8 個 API／生命週期案例 + 16 組 UI 流程**，頁面與 Console 錯誤皆為 0。回歸頁面也會個別收集與檢查兩類錯誤。
- 本次必查畫面為 **31 張**，清單 `artifacts/v033-required-captures.json`；涵蓋三語 popup、Windows／Linux 深淺色、長內容、載入、錯誤、Undo 與離線 Undo，以及共用元件的桌面／窄版設定頁。獨立複查結果 **ship**，未列出必要修正，報告 `artifacts/ui-review-v033.md`。其他目的地仍由完整操作回歸涵蓋，本次視覺複查不擴大為整站重整。
- 偵測工具僅執行一次：**0 個主要項目、24 個建議項目**。字級／圓角值與前版相同，增加一處原生展開控制的既有 2px 圓角用法；沒有擴大比例或新增忽略規則來隱藏結果。完整輸出 `artifacts/design-detect-v033.json`。圖像來源掃描 6 個 PNG、0 缺漏，本次沒有新圖像。
- 設計文件與機器側檔已同步本次呈現方式，YAML／JSON、元件色彩引用與原有 token 一致性核對通過；保留所有既有比例，文件差異另存 `artifacts/design-doc-diff-v033.txt`。
- 本機 ZIP 19 個檔案，已核對三語、四尺寸圖示、MIT／第三方 notices、SHA256SUMS，且 ZIP、`dist/` 與 Windows 載入的實測內容逐檔一致。結果 `artifacts/package-v033.json`。沒有新增依賴、擴充權限或修改卸載政策。

本次沿用專案固定的穩定版 Playwright；CLI／DevTools MCP 連線限制記錄於下方 v0.2 工具紀錄。所有流程使用獨立設定檔，未操作使用者日常分頁；沒有推送 GitHub 或發佈商店，不將本次 UI 檢查當作長期工作量、睡眠喚醒、全面 WCAG 或 RAM 效益驗證。

### GitHub 公開準備

三語 README 已補上安裝包入口與經驗證的 Windows 測試截圖，另有 CONTRIBUTING、問題回報與 PR 範本。相對文件／圖片連結及工作流程／issue form YAML 解析通過，公開截圖與 v0.3.3 測試原檔一致；安裝包雜湊仍符合既有驗證。產物、測試資料與本機設定不列入來源樹。結果 `artifacts/github-preparation-v033.json`。

這一階段只有文件、截圖與 Git 忽略規則變動，沒有更動執行程式或重跑瀏覽器。尚未建立遠端、推送、執行 GitHub-hosted CI 或發佈 Release；第一輪雲端 CI 需推送後確認。

## v0.3.2 Popup 與共用狀態整理

- 修正長內容下的 popup 焦點遮蔽：內容區獨立捲動，頁尾與通知各保留空間；連線失敗訊息及重試入口固定可見。使用有效的 251 字元 hostname 與父網域規則，實測選單、管理入口及通知存在時的鍵盤焦點都可命中，沒有被頁尾遮住。
- 將通知生命週期從訊息傳輸 hook 分離。Undo 在聚焦、指標停留或操作中保留，離開後恢復計時；操作錯誤保留至關閉。關閉與復原後返回適當控制，並保留使用者稍後自行選擇的焦點。
- 共用狀態元件區分讀取、執行、暫停、未連線與重連中。連線失敗時保留最後成功時間、停用遠端操作，舊分頁資料顯示「狀態待更新」；應用層驗證錯誤不會誤標為斷線。讀取期間不顯示猜測的主機名稱。
- 縮短網站範圍選項，另列實際 hostname／主網域及包含範圍；集中 popup／紀錄 CSS，刪除確認未使用的選擇器。沿用 React、Radix、既定焦點樣式與 Chrome 設定頁方向，沒有新增依賴或權限。
- `npm run check`、**32 個核心／i18n 測試**與建置通過。Linux Chrome for Testing **156.0.8078.47** 的英語、簡體中文、繁體中文，以及 Windows 已安裝 Chrome **156.0.8078.48** 的繁體中文，各通過 **8 個 API／生命週期案例 + 14 組 UI 流程**，頁面與 Console 錯誤均為 0。
- 新增的四組 UI 回歸涵蓋通知計時／焦點、長網域捲動、讀取／過期／重試／傳輸錯誤及持續可關閉的應用層錯誤。通知測試使用 Playwright page clock；傳輸故障只注入獨立測試頁，正式程式沒有測試控制端點。
- 最後一輪報告：`artifacts/browser-results-{en,zh_CN,zh_TW}.json`、`artifacts/ui-results-{en,zh_CN,zh_TW}.json`、`artifacts/windows-browser-results.json`、`artifacts/windows-ui-results.json`。**47 張**最終畫面在 `.impeccable/review/v032-*.png`，必查清單為 `artifacts/v032-required-captures.json`。設定頁涵蓋 1440／620／380px，popup 為 360px，邊界情境限制在 600px 高；窄版四個目的地無水平溢出。
- 視覺偵測僅執行一次：0 個主要項目、23 個既有字級／圓角文件對照建議，完整輸出 `artifacts/design-detect-v032.json`。沒有藉本次修正擴大字型或 token 重整。圖像來源掃描為 6 個 PNG、0 個缺漏，紀錄 `artifacts/provenance-v032.log`。
- 獨立複查結果 **ship**，範圍為上述 47 張畫面、相關來源與流程報告；三個先前確認的互動缺陷皆已修正，沒有列出必要修正。審查報告 `artifacts/ui-review-v032.md`，不等同全面無障礙或記憶體效益認證。
- `DESIGN.md` 與 `.impeccable/design.json` 已同步本次 popup／狀態／通知規則；YAML、JSON 及元件色彩引用核對通過，既有色盤、字級、間距與圓角 token 未變更。
- ZIP 共 19 個檔案，三語、四尺寸圖示、MIT 與第三方 notices 均已核對；ZIP、`dist/` 與 Windows 實測載入內容逐檔一致，SHA256SUMS 亦已核對，結果 `artifacts/package-v032.json`。

所有瀏覽器流程使用獨立設定檔；本次不包含日常設定檔、實際睡眠喚醒、長期工作負載或 RAM 效益測量。穩定版 Playwright 與測試瀏覽器直接 CDP 的替代原因沿用下方 v0.2 工具紀錄。尚未推送 GitHub、執行雲端 CI 或發佈商店。

## v0.3.1 焦點樣式修正

使用者指出選單焦點與 Chrome 不一致，實測確認 v0.3 的全域 `outline-offset: 3px` 留白是樣式選擇，未符合既定 Chrome 方向。修正後輸入框／選單使用 2px 外框、offset -1px；按鈕／開關等維持 2px 緊密外圈；導覽與清單連結內縮 2px。錯誤欄位焦點為錯誤色，toast 焦點使用反向表面前景。

- 對照實際 Chrome 設定頁的 `.md-select`，確認焦點 offset 為 -1px，原始畫面與計算樣式保存在 `artifacts/focus-inspection/chrome-native-select.*`。官方依據：[select](https://github.com/chromium/chromium/blob/main/ui/webui/resources/cr_elements/md_select_lit.css#L67)、[stroked input](https://github.com/chromium/chromium/blob/main/ui/webui/resources/cr_elements/cr_input/cr_input_style_lit.css#L192)、[button](https://github.com/chromium/chromium/blob/main/ui/webui/resources/cr_elements/cr_button/cr_button.css#L114)、[toggle](https://github.com/chromium/chromium/blob/main/ui/webui/resources/cr_elements/cr_toggle/cr_toggle.css#L101)。
- Linux Chrome for Testing 156.0.8078.47 與 Windows 已安裝 Chrome 156.0.8078.48，各實測 15 次鍵盤焦點，檢查控制尺寸未隨聚焦變動，包含深淺色、380px、錯誤欄位、toast 及 popup。各有 15 張畫面與 0 頁面錯誤；JSON 與畫面在 `artifacts/focus-inspection/`。
- 型別檢查通過。初次 Windows 既有方向鍵測試偶發逾時；CDP 記錄顯示該互動經非同步焦點與 click 完成，重測可正常選取。測試改為按下方向鍵、等選取更新、再放開，避免用固定 40ms 猜測事件完成時機。應用程式互動邏輯未因此變更。
- 本次偵測工具執行一次：0 個主要項目、23 個既有字級／圓角對照建議。沒有新增依賴或擴充權限。

最終回歸：Linux 英語與 Windows 繁體中文各通過 8 個 API 案例、10 組 UI 流程。紀錄保存在 `artifacts/focus-inspection/{linux,windows}-{browser,ui}-results-v031.json`；焦點樣式獨立複查結果為 **ship**，範圍為本次焦點修正，報告為 `artifacts/focus-inspection/review-v031.md`。設計文件與機器側檔已同步更新焦點規則。

## v0.3 功能與 Windows 驗證

- 型別檢查與 **32 個核心測試**通過。新增 Public Suffix List／私人後綴邊界、繼承來源、移除與復原 ID 競態、清除紀錄不重設計時、三語 key／placeholder 一致性與原因碼在地化測試。
- Linux：Chrome for Testing **156.0.8078.47 Stable**，Node **24.22.1**。英語、簡體中文、繁體中文各通過 **8 個 Chrome API／生命週期案例 + 10 組 UI 流程**，每語系以原生 Chrome i18n 驗證。
- Windows：實際已安裝的 Chrome **156.0.8078.48**，Windows Node **24.22.1**，PowerShell **7.6.8**。繁體中文通過相同的 **8 + 10** 組，頁面與 Console 錯誤皆為 0。以獨立臨時設定檔測試，沒有操作使用者日常分頁。
- Windows 測試透過測試專用 `--enable-unsafe-extension-debugging` 與 CDP `Extensions.loadUnpacked` 載入；正式擴充功能只有 tabs／storage／alarms，沒有 debugger 權限。PowerShell 腳本複製到 Windows 本機暫存目錄正常執行，沒有變更執行政策。
- Popup 驗證精確 hostname／主網域範圍、快速新增／移除／復原、父規則繼承來源及管理入口。紀錄以 125 筆驗證 50／50／25 分頁與持續生效的清除；另有 250 筆測試確認只留最新 200 筆。
- 380px、620px 四個目的地均無文件水平溢出；Windows／Linux 深淺色、未儲存嚴格模式、網站輸入錯誤、繼承規則與較長英文均有畫面證據，共 34 張。
- 三語 UI 字串在建置時產生 Chrome 原生 locale 目錄。儲存的事件／錯誤是原因碼；底層 Chrome 傳回的原始錯誤細節及使用者網頁標題保留原文。
- 使用內建 image_gen 依使用者角色參考生成新頭像，實際圖示為頭部簡化稿。1254px PNG 保留透明 alpha，建置輸出 16／32／48／128px；原稿與各尺寸均保存 prompt 來源。未散佈使用者的原始參考圖。

結果：`artifacts/browser-results-{en,zh_CN,zh_TW}.json`、`artifacts/ui-results-{en,zh_CN,zh_TW}.json`，以及 `artifacts/windows-browser-results.json`、`artifacts/windows-ui-results.json`。畫面：`.impeccable/review/v03-*.png`。流程入口：`npm run test:locales`；Windows helper：`scripts/test-windows.ps1`。

獨立視覺複查結果為 **ship**，範圍是上述 34 張畫面、既有 Chrome 設定頁方向及圖示整合，沒有列出必要修正；不代表全面 WCAG、RAM 效益或商店發佈資格認證。偵測工具只執行一次：0 個主要項目、23 個既有字級／圓角文件對照建議，完整輸出保存在 `artifacts/design-detect-v03.json`。審查記錄：`artifacts/ui-review-v03.md`。

本機 ZIP 內容已與 `dist/` 逐檔核對，包含三語、四種圖示尺寸、MIT 與第三方 notices，另產生 SHA256SUMS。GitHub 工作流程已做 YAML 結構解析，尚未推送或執行雲端 CI。

## v0.2 介面重整實測

- 改用 React 呈現設定頁及 popup；背景排程與核心政策未加入 React。所有程式與 CSS 本機打包，原有擴充功能權限未增加。
- `npm run check` 與 22 個政策／控制器案例通過；8 個真實 Chrome API／生命週期案例重新通過。
- `npm run test:ui` 提供可重跑的 10 組介面流程：規則與期限儲存、草稿與搜尋跨目的地保留、上一頁／下一頁、期限驗證與單選鍵盤操作、白名單增刪與子網域、暫停恢復、分頁保護與 15 秒更新後保持同一 DOM 焦點、搜尋篩選與立即檢查、主題設定，以及 popup 保護／白名單／管理入口與不支援頁面。
- 19 張實際擴充功能截圖涵蓋四個目的地的 1440px、620px、380px，桌面及 popup 深淺色、嚴格模式待儲存提示、窄版白名單輸入錯誤與 popup 已加入狀態。620px／380px 所有目的地沒有文件水平溢出；頁面與 Console 錯誤均為 0。
- 實際樣式檢查發現 Chrome 的擴充頁預設注入 `body { font-size: 75% }` 與字型；新版明確設定 body 字型及 14px 基準，並新增實測回歸檢查。主題測試改判斷實際背景色，避免 CSS 壓縮將 `#ffffff` 縮寫為 `#fff` 造成誤判。
- UI 驗證使用專案固定的 Playwright 1.64.1。原先優先嘗試 Playwright CLI，但 CLI 0.1.22 內建 alpha 版 Playwright 且 CDP 附加逾時；改以穩定版執行相同的 `tests/ui-flows.js`。DevTools MCP 連到另一個瀏覽器且無切換連線工具，因此樣式診斷使用測試 Chrome 的 CDP。
- 視覺偵測工具執行一次，指出新版字型、字級與圓角和舊 DESIGN.md 不同；這是使用者已授權的重整，設計文件在獨立審查後更新，不以此宣稱偵測零問題。

最新結果：`artifacts/browser-results.json`、`artifacts/ui-results.json`。畫面：`.impeccable/review/`。獨立審查另記 `artifacts/ui-review-v02.md`。

同日後續核對新增兩個回歸案例，政策／控制器測試共 **24 個通過**：連續 250 次分頁恢復後只保留最新 200 筆紀錄，並確認讀回超量工作階段資料也會截斷；精確 hostname 白名單涵蓋同主機的不同路徑、協定與 port，但不涵蓋其他或更下一層的子網域。型別檢查通過。本次僅補測試與驗證紀錄，未改變 v0.2 的執行程式或安裝包。

## v0.1 歷史實測結果

- Node.js 24.22.1 LTS；Chrome for Testing **156.0.8078.47 Stable**，Linux 獨立設定檔。
- 型別檢查與 22 個政策／控制器測試通過。
- 8 個真實瀏覽器案例通過：卸載與恢復、釘選且停用自動卸載的嚴格卸載、一般模式保護、白名單／手動保護、暫停恢復、真實 alarm 喚醒、正在播放音訊的嚴格卸載，以及系統色彩偏好與手動覆寫。
- Playwright CLI 驗證 11 個介面流程，包含規則儲存、網站輸入錯誤、白名單增刪、暫停恢復、分頁搜尋篩選、保護、立即檢查、外觀跟隨、窄視窗、popup 保護與加入白名單；無頁面程式錯誤。
- 檢查 1440px 淺／深色設定頁、620px 與 380px 窄設定頁，以及 popup 淺／深色，共 6 張畫面。380px 未出現文件水平溢出。
- 設計機械檢查未發現項目；獨立視覺檢查結果另存於 `artifacts/ui-review.md`。

使用者後續指出視覺品質及 Chrome 風格完成度不足。重新實際對照後，確認先前視覺驗收過於寬鬆；後續介面重整以 [UI 檢視與重做建議](UI_REVIEW.md) 為依據。上述功能測試結果仍有效，但不能當成視覺設計已達標的證據。

上述是測試設定檔的行為與畫面驗證，不是使用者真實分頁的記憶體效益測試。

## 實作中確認的邊界

- discard 可能重建 WebContents，Playwright 的舊 Page 物件會失效；恢復以仍存在的 Chrome 分頁與最新 ID 驗證。
- 在測試的新版 Chromium 中，discard 的回傳值可能帶有新的 tab ID。控制器會轉移原有狀態並以確認後的 ID 記錄成功。
- 擴充功能明確指定分頁卸載與原生 Memory Saver 的自動策略不同；白名單及軟性保護由本工具先判斷。
- worker 啟動檢查並補建 alarm，計時保存在 `storage.session`，不依賴常駐計時器。

## 尚未完成的使用情境驗證

- 使用者實際 Windows Chrome 設定檔的相容性與工作網站狀態。
- 真正的電腦睡眠、喚醒及長期運行。
- 數百個真實分頁的 RAM 改善、CPU 開銷與重載成本比較。
- 真正保留可見 split view 的端到端測試；目前規則由政策測試驗證。

因此目前不宣稱節省特定 GB、百分比或保證到秒執行。

## 版本依據

- [Node.js 官方 release index](https://nodejs.org/dist/index.json)
- [Chrome for Testing 官方穩定版本清單](https://googlechromelabs.github.io/chrome-for-testing/last-known-good-versions-with-downloads.json)
- [Playwright 擴充功能測試](https://playwright.dev/docs/chrome-extensions)
- [Chrome 分頁 API](https://developer.chrome.com/docs/extensions/reference/api/tabs)
- [Chrome alarms](https://developer.chrome.com/docs/extensions/reference/api/alarms)
