# 行遊 PWA

這是「行遊｜台灣縣市旅遊」的可安裝 PWA 版本，支援行程規劃、地圖路線、交通估算、旅費分帳、旅伴與住宿資訊。

## 使用方式

請使用 HTTPS 網站或 `localhost` 提供檔案；直接雙擊 `index.html` 的 `file://` 模式無法啟用 Service Worker，因此不會有完整離線快取功能。

最簡單的本機測試方式：

```bash
python3 -m http.server 8080
```

接著開啟 `http://localhost:8080/`。首次載入後，Service Worker 會快取 App Shell；之後即使沒有網路，已儲存的行程仍可開啟與編輯。Google 地圖、Google Fonts 等外部服務在離線時無法連線，但不會影響核心行程功能。

## 部署檔案

- `index.html`：主要應用程式
- `manifest.webmanifest`：安裝名稱、啟動畫面與圖示設定
- `sw.js`：離線快取與更新策略
- `icons/icon-192.png`、`icons/icon-512.png`：PWA 安裝圖示

若更新應用程式資源，請將 `sw.js` 裡的 `VERSION` 改成新版本字串，瀏覽器便會清除舊快取並重新快取。
