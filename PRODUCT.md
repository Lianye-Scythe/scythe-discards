# Scythe Discards — Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

依本對話已確認的規劃：Chrome Manifest V3、React、TypeScript、Tailwind CSS v4 CLI；共用元件依 shadcn/ui 模式以 Radix primitives 組合，再套用 Chrome 方向樣式。本機產生靜態資源，不載入外部前端程式。Node.js 使用最新 LTS，套件使用最新穩定版與 lockfile。

## Users

使用 Windows Chrome、希望長期保留大量分頁的使用者。需要明確的逾時與白名單規則，包含即使 RAM 足夠仍會執行的嚴格模式。

## Product Purpose

保留分頁標籤與網址，透過 Chrome 原生 discard 釋放背景網頁內容，讓使用者看得懂何時卸載、哪些分頁受保護，以及失敗原因。

## Operating Context

工具列 popup 用於目前分頁的快捷操作；設定頁用於調整時間、模式、網站白名單與檢視分頁狀態。v0.3.2 為可載入的本機預覽版，備妥 GitHub CI、MIT 授權與發佈文件。

## Capabilities and Constraints

依 docs/PLAN.md 實作一般／嚴格逾時、網站白名單、工作階段分頁保護、暫停與有限操作紀錄。Popup 提供精確 hostname／主網域含子網域範圍切換、快速移除與復原，顯示繼承規則來源。紀錄每頁 50 筆、最多保留 200 筆，能清除。不能保證固定 RAM 上限、準時到秒、保存未儲存狀態或阻止 Chrome 自身的回收。

## Brand Commitments

使用者明確選擇偏 Chrome 設定頁的風格。深淺色跟隨系統或 Chrome 回報的偏好，提供手動切換。介面提供繁體中文、簡體中文和英語，跟隨 Chrome 語言。名稱統一為 Scythe Discards；使用者要求以提供的角色圖為參考，製作金髮、草帽、向日葵的二次元少女頭像圖示。工具列使用簡化頭像，角色不改變設定頁的 Chrome 方向。

## Evidence on Hand

完整需求在 docs/PLAN.md；已於 Linux Chrome for Testing 及 Windows 已安裝 Chrome 的獨立設定檔驗證功能；尚無使用者日常工作量的記憶體改善實測。介面不得捏造節省 GB 或效率百分比。

## Product Principles

- 規則可預期，保護狀態優先於卸載。
- 實際成功才顯示成功；錯誤可以追查。
- 背景工作者重啟後仍能恢復計時。
- 額外開銷低，所有設定與紀錄留在本機。
- 快捷介面在長內容與錯誤狀態仍能用鍵盤操作；過期資料不可冒充即時狀態。
- 網站保護直接呈現實際規則來源；精簡的網域顯示仍須能展開讀取完整值，斷線恢復保留尚待復原的操作。
