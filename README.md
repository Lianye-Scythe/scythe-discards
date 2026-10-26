# Scythe Discards

繁體中文 · [简体中文](README.zh-CN.md) · [English](README.en.md)

保留分頁標籤與網址，依明確的閒置時間卸載背景網頁。以 Chrome Manifest V3、TypeScript 與 React 實作；介面採 Chrome 設定頁方向，資料僅留在本機。

[下載 v0.3.3](https://github.com/Lianye-Scythe/scythe-discards/releases) · [問題回報](https://github.com/Lianye-Scythe/scythe-discards/issues) · [參與開發](CONTRIBUTING.md)

| 小選單 | 網站規則來源 |
| --- | --- |
| <img src="docs/images/popup.png" width="280" alt="小選單：自動卸載、目前分頁與網站保護"> | <img src="docs/images/popup-inherited.png" width="280" alt="繼承保護：顯示規則來源與管理入口"> |

[設定頁預覽](docs/images/settings.png)。畫面使用獨立測試設定檔及範例網站。

## 功能

v0.3.3 精簡 popup 高度與網站範圍說明，明確呈現繼承規則；長網域可展開查看完整名稱，斷線時優先顯示恢復入口並保留 Undo。

- **一般逾時**保留釘選、播放音訊及停用自動卸載的分頁；**嚴格逾時**不受這些軟性保護限制。
- 兩種模式都保留使用中、有效分割畫面、網站白名單與手動保護的分頁。
- Popup 可選「僅此網站」或「主網域及子網域」，快速加入／移除規則並撤銷移除。繼承保護會顯示來源與管理入口，長網域可展開查看。
- 白名單按 hostname 比對，不依網址路徑、協定或 port 區分。主網域辨識使用包含私有後綴的 Public Suffix List。
- 紀錄保留本次工作階段最新 200 筆，每頁 50 筆，可清除。
- 英文、繁體中文、簡體中文跟隨 Chrome 語言，未支援語系回退英文。外觀跟隨系統，亦可手動選深／淺色。
- 背景服務不載入 React，不注入網站內容程式，不使用遙測或遠端後端。

預設：一般模式、30 分鐘、跟隨系統外觀。`discard` 會在切回分頁時重新載入，無法保證保留未儲存內容。排程受睡眠、Chrome 延遲及 API 拒絕影響，不保證準時到秒或固定 RAM 上限。

## 安裝與更新

從 [Releases](https://github.com/Lianye-Scythe/scythe-discards/releases) 下載 `scythe-discards-0.3.3.zip`（擴充功能安裝包），解壓縮至固定資料夾；同頁附有 `SHA256SUMS`。GitHub 自動產生的 Source code 壓縮檔需先建置。

於 `chrome://extensions` 開啟「開發人員模式」，選擇「載入未封裝項目」，指定含 `manifest.json` 的資料夾。Windows 新安裝可用 `C:\Tools\scythe-discards`。自行建置則載入 `dist/`。

**從舊版更新時保留原安裝資料夾路徑**，將 ZIP 內容覆蓋進去，再按「重新載入」。資料夾可維持舊名 `chrome-discards`；路徑保留能沿用未封裝擴充功能的 ID 與網站設定。

重新載入／更新會清除工作階段倒數、手動分頁保護與最近紀錄；模式、時間、網站白名單與外觀設定會保留。

## 開發與測試

Node.js **24.22.1 LTS**、npm **12.2.1**；依賴固定精確版本，使用 `npm ci` 重現。

```bash
npm ci
npm run check
npm test
npm run build
npm run test:setup
npm run test:locales
npm run package
```

`test:setup` 下載官方最新穩定版 Chrome for Testing，使用獨立設定檔。`test:locales` 在英文、簡中、繁中分別驗證核心 Chrome 行為及 UI；可用 `npm run test:ui -- --locale=zh-TW` 單獨執行。結果在 `artifacts/`，畫面在 `.impeccable/review/`。

安裝包：`artifacts/scythe-discards-0.3.3.zip`，檢查碼：`artifacts/SHA256SUMS`。開發時也可載入 `dist/`。

## 文件

- [驗證結果與限制](docs/VALIDATION.md)
- [產品與技術規劃](docs/PLAN.md)
- [版本紀錄](CHANGELOG.md)、[版本說明](docs/RELEASE_NOTES.md)
- [隱私權政策](PRIVACY.md)、[發佈流程](docs/PUBLISHING.md)
- [設計系統](DESIGN.md)、[翻譯維護](docs/I18N.md)

授權：[MIT](LICENSE)。第三方元件遵循各自授權，建置時包含完整 notices。
