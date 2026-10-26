---
name: Scythe Discards
description: 熟悉的 Chrome 設定頁結構，清楚管理分頁卸載規則與狀態。
colors:
  page: "#ffffff"
  surface: "#ffffff"
  surface-alt: "#f1f3f4"
  hover: "#f5f7f8"
  ink: "#202124"
  muted: "#5f6368"
  line: "#e0e3e7"
  control-line: "#9aa0a6"
  primary: "#0b57d0"
  on-primary: "#ffffff"
  selected: "#e8f0fe"
  on-selected: "#174ea6"
  success: "#137333"
  warning: "#7c4a03"
  warning-bg: "#fef7e0"
  error: "#b3261e"
  error-bg: "#fce8e6"
  inverse: "#303134"
  on-inverse: "#f1f3f4"
  switch-off: "#747775"
  dark-page: "#202124"
  dark-surface: "#292a2d"
  dark-surface-alt: "#35363a"
  dark-hover: "#35363a"
  dark-ink: "#e8eaed"
  dark-muted: "#bdc1c6"
  dark-line: "#45474b"
  dark-control-line: "#9aa0a6"
  dark-primary: "#a8c7fa"
  dark-on-primary: "#062e6f"
  dark-selected: "#394457"
  dark-on-selected: "#d3e3fd"
  dark-success: "#81c995"
  dark-warning: "#fdd663"
  dark-warning-bg: "#40351e"
  dark-error: "#f2b8b5"
  dark-error-bg: "#4e2728"
  dark-inverse: "#e8eaed"
  dark-on-inverse: "#202124"
  dark-switch-off: "#9aa0a6"
typography:
  headline:
    fontFamily: '"Segoe UI", "Microsoft JhengHei UI", "Noto Sans TC", "Noto Sans CJK TC", system-ui, sans-serif'
    fontSize: "22px"
    fontWeight: 400
    lineHeight: 1.36
  title:
    fontFamily: '"Segoe UI", "Microsoft JhengHei UI", "Noto Sans TC", "Noto Sans CJK TC", system-ui, sans-serif'
    fontSize: "14px"
    fontWeight: 500
    lineHeight: 1.57
  body:
    fontFamily: '"Segoe UI", "Microsoft JhengHei UI", "Noto Sans TC", "Noto Sans CJK TC", system-ui, sans-serif'
    fontSize: "14px"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: '"Segoe UI", "Microsoft JhengHei UI", "Noto Sans TC", "Noto Sans CJK TC", system-ui, sans-serif'
    fontSize: "12px"
    fontWeight: 400
    lineHeight: 1.67
rounded:
  control: "6px"
  panel: "12px"
  button: "24px"
  circular: "50%"
spacing:
  1: "4px"
  2: "8px"
  3: "12px"
  4: "16px"
  5: "20px"
  6: "24px"
  7: "28px"
  8: "32px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    rounded: "{rounded.button}"
    padding: "7px 18px"
    height: "36px"
  button-outline:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.primary}"
    rounded: "{rounded.button}"
    padding: "7px 18px"
    height: "36px"
  input:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    padding: "7px 12px"
    height: "36px"
  panel:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.panel}"
---

# Design System: Scythe Discards

## Overview

**Creative North Star: "熟悉的設定列，清楚的分頁狀態"**

Scythe Discards 延續使用者指定的 Chrome 設定頁語言，讓人先確認自動卸載狀態，再調整規則、管理網站例外，最後查看分頁狀態與近期紀錄。設定頁用四個真正可切換的目的地承載各項工作；工具列 popup 集中處理暫停、目前分頁保護和網站白名單。Popup 頁首、連線回復資訊、通知與頁尾各自保留版面，主要內容獨立捲動。

介面提供繁體中文、簡體中文與英語，依 Chrome 語言選擇。系統 UI 字型、中性表面與克制的藍色互動色構成整體。表面、間距、分隔線和清楚的狀態文字負責建立層次；同一組語意角色在淺色和深色外觀中延續。外觀預設跟隨系統或 Chrome 回報的偏好，也可手動指定。品牌名稱統一為 Scythe Discards；透明角色頭像只出現在品牌與擴充圖示，不改變設定頁的 Chrome 方向。

**Key Characteristics:**
- 熟悉且緊湊的設定導覽與控制列
- 真實的執行、保護來源、到期與錯誤狀態
- 三種語言與淺深色共用語意角色
- 可復原的規則操作與有限保留的活動紀錄

## Colors

中性頁面與表面承載資訊，藍色表示主要互動與選取；綠、琥珀、紅色傳達成功、警告與錯誤。深色值沿用相同的角色分工。

### Primary
- **Chrome 藍**（`colors.primary`）：主要提交動作、已啟用控制與可見鍵盤焦點。
- **選取藍**（`colors.selected`、`colors.on-selected`）：目前導覽項目與選取狀態。

### Secondary
- **琥珀警告**（`colors.warning`、`colors.warning-bg`）：嚴格模式的內容風險與需留意資訊。
- **錯誤紅**（`colors.error`、`colors.error-bg`）：就近呈現驗證或操作錯誤。

### Tertiary
- **狀態綠**（`colors.success`）：成功與受保護分頁狀態。

### Neutral
- **白色頁面與表面**（`colors.page`、`colors.surface`）：主要工作區及分組面板。
- **淺灰表面與懸停色**（`colors.surface-alt`、`colors.hover`）：控制底色和互動回饋。
- **深色文字、次要文字與邊線**（`colors.ink`、`colors.muted`、`colors.line`、`colors.control-line`）：內容層級、分隔與控制輪廓。
- **深色主題角色**（`colors.dark-*`）：對應淺色角色的深色頁面、表面、文字、控制和狀態色。
- **反向表面**（`colors.inverse`、`colors.on-inverse`）：短暫 toast 回饋。
- **成功、警告與錯誤狀態色**（`colors.success`、`colors.warning`、`colors.error` 及對應底色）：表示實際操作狀態；深色主題使用 `colors.dark-*` 同角色。

**The Shared Roles Rule.** 淺深色維持相同的狀態語意；由系統偏好或明確主題設定切換實際色值。

## Typography

**Display Font:** 不使用獨立展示字型。
**Body Font:** Segoe UI、Microsoft JhengHei UI、Noto Sans TC、Noto Sans CJK TC、system-ui、sans-serif。
**Label/Mono Font:** 無獨立標籤字型；時間和數值採等寬數字字形。介面文字依 Chrome 語言提供繁體中文、簡體中文與英語。

**Character:** 原生系統字型讓介面保持熟悉、緊湊、易掃讀。層級由字重、位置與留白形成，避免過大的展示標題。

### Hierarchy
- **Headline**（400、22px、行高 30px）：設定目的地標題；窄螢幕為 20px、行高 28px。
- **Title**（400–500、14px、行高 22px）：設定列、分頁標題和區段標題；區段標題使用 500 字重。
- **Body**（400、14px、行高 21px）：基本內容與控制文字，根字級明確設定為 14px。
- **Label**（400–600、12px、行高約 18–20px）：次要狀態、欄名、計數與提示；依語意需要加重。
- 輔助說明通常為 12–13px，行高約 1.55；控制文字通常為 13px。

## Layout

桌面工作區由 64px 高的頂欄、232px 固定側欄和內容區組成。設定、白名單與紀錄目的地內容寬度最多 680px；分頁管理使用最多 960px 的寬清單。設定表面以 16–20px 列內距、區段間距和細分隔線維持緊湊節奏。

920px 以下，導覽改為頂部四等分的四項目的地列，主內容置中；620px 以下縮小頁面外距、控制內距並讓表單與分頁狀態改為窄版排列。分頁表格在窄版轉為可讀的逐筆狀態列，仍保留保護開關和狀態文字。Popup 寬 360px（最小 320px、最大高度 600px），頁首、連線回復區、通知和頁尾維持各自版面，主要內容獨立捲動。一般狀態實測高度為 475px，繼承保護狀態為 503px；v0.3.2 對照分別為 528px 和 580px（`artifacts/popup-height-v033.json`）。尺寸調整不改變主要內容、回復區和頁尾各自的排列。初始載入不猜測目前網站名稱。設定頁頁尾顯示版本資訊，popup 頁尾只保留本機資料說明與設定入口。

## Elevation & Depth

介面以語意表面、分隔線與空間分組建立層次，面板保持平面。設定頁的非阻斷 toast 固定於視窗下方並使用陰影；popup 通知則佔用自己的正常版面區域，不遮住控制。一般互動不加入裝飾性動態；開關滑塊只以 150ms 位移過渡，減少動態偏好會停用過渡。

### Shadow Vocabulary
- **短暫操作回饋**（`0 4px 14px #0003`）：設定頁固定於視窗下方的 toast。

## Shapes

文件沿用已存在的圓角和控制尺寸角色。掃描器回報的 13px、1rem、20px、2px、21px、8px、19px 與 11px 用法是既有元件中的實際尺寸差異；保留為元件局部值，不將它們提升為新的全域比例，也不藉文件更新改動介面。
面板採 12px 圓角，輸入控制和 popup 動作列採 6px；按鈕使用 24px 膠囊輪廓，開關軌道與狀態點使用圓形端點。模式選項採直列單選，不以多層裝飾卡片承載。細邊線界定面板與文字控制，核取方塊保持 2px 近方形輪廓。

## Components

### Buttons
- **主要按鈕：** 藍底白字，36px 高、7px 18px 內距、膠囊圓角；用於儲存規則和新增網站。
- **描邊按鈕：** 表面底、細邊線與主要色文字，供次要操作使用。
- **文字與圖示按鈕：** 透明底；懸停時顯示選取或替代表面色。圖示按鈕為 36px 方形、圓形輪廓。
- **焦點：** 依控制類型處理。輸入框與選單使用 2px 語意色外框，offset 為 -1px，與既有邊線相接；按鈕、開關、單選與核取框保留 2px 外移。導覽及清單連結向內 2px。錯誤欄位保留紅色焦點；toast 動作使用反向表面的前景色，維持可見。

### Cards / Containers
- 設定面板用表面、1px 邊線和 12px 圓角收納相關列；不使用卡片陰影。
- 設定列至少 72px 高，桌面內距 16px 20px；窄版改為 16px 內距。
- 表單草稿明確提供取消與儲存，髒狀態有文字提示；主題和白名單變更立即生效。

### Inputs / Fields
- 文字、搜尋、數字和選單控制採表面底、1px 邊線、6px 圓角、36px 最小高度與 7px 12px 內距。
- 懸停加深控制邊線；焦點沿既有邊線加強，不另留空白外圈；錯誤靠近欄位呈現並保留文字說明。
- Radix 單選、核取方塊與開關使用此專案的 Chrome 色彩和尺寸，不套用通用 shadcn 預設主題。

### Navigation
- 桌面導覽固定在 232px 側欄，項目最小高度 44px；當前目的地使用選取底色和前景色。
- 920px 以下改為四等分頂部導覽，圖示與繁體中文標籤垂直排列；四個目的地均保持可見。

### Status and Data Views
- 執行狀態以文字和小圓點共同顯示；暫停時改用次要文字色。
- 分頁列呈現真實標題、網站、狀態、到期資訊和手動保護控制。狀態以圖示和文字辨識，不只依賴顏色。
- 空白、讀取、錯誤和暫停使用實際產品狀態；toast 提供不阻斷操作的結果回饋。

### Popup
- 360px 單欄（最小 320px）、最高 600px；頁首、連線回復區、通知和頁尾各自保留版面，主要內容獨立捲動。一般狀態高 475px，繼承保護狀態高 503px；短化間距不改變主要區塊排列。
- 連線錯誤與重試入口位於主要內容捲動區外；狀態文字區分載入中、執行中、暫停、無法使用與重新連線。可用舊資料時標示最後更新時間並停用遠端操作；目前原因保持中性，載入時不猜測 hostname。
- 網站範圍選單採短標籤。精確 hostname 的輔助文字不重複顯示 hostname，並明示不包含子網域；主網域範圍則顯示實際目標。遇到繼承保護時，以鎖定圖示、實際規則來源及管理入口說明狀態；範圍選單仍可用來刻意改變目標範圍。
- 超過 44 個字元的 hostname 或規則來源以原生 disclosure 縮短中段，保留字串兩端；鍵盤可操作，完整值有可存取名稱且展開後可選取。同一網站資料刷新時保留展開狀態。Disclosure 使用局部 2px 焦點圓角，不新增全域圓角 token。
- 通知佔用自己的正常版面區域，不覆蓋控制。成功通知在 4 秒、帶 Undo 的通知在 7 秒後收起；停留、聚焦、操作忙碌或連線中斷時暫停計時。發生連線錯誤時關閉舊的非 Undo 成功通知並返回適當焦點；錯誤與尚待復原的 Undo 保留。錯誤需明確關閉。Undo 後返回合適焦點，不搶走使用者後續選定的焦點。
- Popup 頁尾保留本機資料說明和設定入口；版本資訊只放在設定頁。

### Activity History
- 工具列顯示目前紀錄數與 200 筆上限，提供清除動作；每頁 50 筆並顯示範圍和頁碼。
- 活動列包含事件類型、網站、原因／細節及時間；失敗狀態就近使用錯誤色與文字。清除後以操作回饋確認結果。

### Brand Assets
- 工具列與品牌使用簡化透明頭像，詳細角色肖像是原始素材 companion，不作為頁面裝飾。
- 發佈圖示目前包含 16、32、48、128px 尺寸；來源與用途記錄見 [`public/icon.png.json`](public/icon.png.json) 和 [`artwork/portrait.png.json`](artwork/portrait.png.json)。個人角色參考圖不隨專案分發。

## Do's and Don'ts

### Do:
- **Do** 使用繁體中文、實際的分頁狀態和產品操作結果。
- **Do** 保留系統／Chrome 外觀偏好與手動淺色、深色覆寫。
- **Do** 讓狀態同時有文字或圖示線索，並為鍵盤焦點保留清楚外框。
- **Do** 保持四個目的地、狀態與主要控制在窄視窗可見可操作。
- **Do** 對需要明確提交的規則提供儲存、取消和未儲存提示。
- **Do** 顯示網站保護的實際範圍與繼承來源；繼承狀態使用鎖定圖示及管理入口，範圍仍可主動調整，可復原操作保留清楚的 Undo。
- **Do** 對超長 hostname 與規則來源保留可鍵盤操作的展開方式、完整可選取值及穩定的展開狀態。
- **Do** 讓 popup 的頁首、連線回復入口、通知和頁尾各佔自己的版面，並讓內容區獨立捲動；連線中斷時暫停通知計時，移除舊成功訊息但保留錯誤與 Undo。
- **Do** 對過期資料標示更新時間並停用遠端操作；載入資料未到時不推測目前網站。
- **Do** 活動紀錄遵守每頁 50 筆、最多保留 200 筆的既定容量。
- **Do** 讓三種語言共用相同的資訊層級和控制排列。

### Don't:
- **Don't** 用未經實測的記憶體節省量或效率百分比作為介面主張。
- **Don't** 以裝飾性陰影或多層卡片取代目前的間距、表面與分隔線。
- **Don't** 把 Chrome 設定頁方向誤寫成像素級 Chrome 品牌複製。
- **Don't** 將個人角色肖像擴張成設定頁背景或裝飾圖案。
