# 擴充功能介面

模式：Operate。入口為 src/ui/options.html 與 src/ui/popup.html。

## Direction contract

THESIS：以 Chrome 設定頁的熟悉結構管理分頁卸載；規則、例外及實際狀態一眼可辨。

OWN-WORLD：使用者指定的 Chrome 設定頁方向。中性色背景、乾淨的設定列、藍色主要動作、原生字型與圓角控制；淺深色採相同語意色彩角色。

STORY：使用者先確認執行狀態，再調整時間／模式、保護網站，最後查看分頁的到期或跳過原因。Popup 專注暫停、保護與網站規則的快速增刪；顯示 hostname／主網域範圍及繼承來源，移除可復原。

FIRST VIEWPORT：頂部為品牌與真實執行狀態；桌面左側為四個真正的功能目的地，設定內容約 680px 寬，以緊湊設定列、條列單選及右側開關呈現。分頁管理獨立採較寬清單。窄視窗導覽四等分且不截斷。Popup 為 360px 單欄，共用控制元件，呈現目前保護原因；狀態改變時不重建整份清單，保持鍵盤焦點與表單草稿。

FORM：使用者已明確選擇 Chrome 設定頁的慣用形式，採 code-first；沿用其操作語言，不另開視覺方向選拔。深淺色跟隨系統／瀏覽器偏好。稽核補記 concept-seed key `7d851431`（operate、degraded、未取得候選服務）；使用者既有方向優先於隨機指派，此 key 不是另一次風格核准。

v0.3 EXTENSION：保留既有方向，新增繁體中文／簡體中文／英語、紀錄 50 筆分頁與清除、網站範圍控制及 Undo。品牌統一 Scythe Discards；依使用者參考角色製作透明二次元頭像，僅用於品牌／擴充圖示，不擴張為整頁裝飾。

v0.3.2 POLISH：popup 內容區獨立捲動；通知與頁尾佔用各自空間。保留 360px 寬度、Chrome 風格與角色圖示，縮短範圍選單標籤並分開說明實際作用網域。通知在聚焦／停留時保留，錯誤需明確關閉；連線中斷顯示舊資料時間與重試狀態。

v0.3.3 REFINEMENT：網站繼承保護改以鎖定圖示、實際來源及管理入口呈現，保留範圍選單切換；長 hostname 與規則來源精簡顯示，可用鍵盤展開完整可選取文字。減少重複說明與垂直留白。斷線恢復優先於舊成功通知，Undo 保留到可重新操作。

FINISH：unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

## Quality bar

對照 [Chrome 設定頁方向品質基準](UI_QUALITY_BAR.md)。這是使用者指定的慣用介面基準，不是候選服務產生的設計稿，亦不要求像素級複製 Chrome 品牌。
