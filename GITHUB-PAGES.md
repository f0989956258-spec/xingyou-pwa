# 將行遊 PWA 部署到 GitHub Pages

本專案是純靜態 PWA，不需要 Node.js、後端或資料庫。GitHub Pages 會提供 HTTPS，因此可啟用 Manifest、Service Worker、離線快取與加入主畫面功能。

## 專案檔案

請保持以下結構：

```text
.
├── index.html
├── manifest.webmanifest
├── sw.js
├── .nojekyll
├── icons/
│   ├── icon-192.png
│   └── icon-512.png
└── .github/
    └── workflows/
        └── deploy-pages.yml
```

`index.html` 已使用相對路徑，例如 `./manifest.webmanifest`、`./sw.js` 與 `./icons/...`，因此能正確支援 GitHub Pages 的 repository 子路徑。

## 方式一：使用 GitHub 網頁介面

1. 在 GitHub 建立新的 repository，例如 `xingyou-pwa`。
2. 將本專案檔案上傳到 repository 的根目錄。
3. 確認 `.github/workflows/deploy-pages.yml` 也已上傳。
4. 開啟 repository 的 **Settings → Pages**。
5. 在 **Build and deployment → Source** 選擇 **GitHub Actions**。
6. 開啟 **Actions** 頁面，確認 `Deploy PWA to GitHub Pages` 執行成功。
7. 在 **Settings → Pages** 查看正式網址。

網址通常會是：

```text
https://你的帳號.github.io/xingyou-pwa/
```

## 方式二：使用 Git 指令

將 ZIP 解壓縮後，在專案資料夾執行：

```bash
cd xingyou-pwa

git init
git branch -M main
git add .
git commit -m "Deploy Xingyou PWA to GitHub Pages"
git remote add origin https://github.com/你的帳號/xingyou-pwa.git
git push -u origin main
```

接著到 GitHub repository 的 **Settings → Pages**，將 Source 設為 **GitHub Actions**。

之後每次執行：

```bash
git add .
git commit -m "Update PWA"
git push
```

GitHub Actions 就會自動重新部署。

## Workflow 說明

`deploy-pages.yml` 會執行以下工作：

- 只在 `main` 分支推送時部署。
- 允許從 Actions 頁面手動執行。
- 讀取整個 repository 根目錄作為靜態網站。
- 上傳 GitHub Pages artifact。
- 使用 GitHub Pages 官方部署 Action 發布網站。
- 取消同一時間重複的舊部署，避免版本競爭。

## PWA 測試

部署完成後，使用 HTTPS 網址開啟網站，接著用 Chrome DevTools 的 **Application** 檢查：

- Manifest 是否成功載入。
- Service Worker 是否顯示 activated 或 running。
- Cache Storage 是否存在 `xingyou-pwa-v2`。
- 關閉網路後重新整理，首頁是否仍能開啟。
- iPhone Safari 是否可使用「分享 → 加入主畫面」。

## 發布新版本

每次修改 PWA 程式碼後，請同步修改 `sw.js` 的快取版本：

```javascript
const VERSION = "xingyou-pwa-v3";
```

版本字串變更後，瀏覽器會下載新的 Service Worker，並顯示「新版本可用，立即更新」提示。

## 自訂網域（可選）

如果之後要使用自己的網域，可在 GitHub Pages 設定中加入 Custom domain，並在 DNS 設定建立 GitHub 要求的記錄。若使用自訂網域，Service Worker 的 `./` 相對路徑仍然可以正常運作。

## 常見問題

### 頁面顯示但 PWA 無法安裝

確認網站網址是 `https://`，而不是本機 `file://`。也確認 Manifest、圖示與 Service Worker 在瀏覽器 Network 面板中都是 HTTP 200。

### GitHub Pages 顯示 Jekyll 錯誤

確認根目錄存在空白的 `.nojekyll` 檔案。

### 修改後仍看到舊版

先等待 GitHub Actions 完成，再重新整理。若仍是舊版，請在 DevTools 的 Application → Service Workers 取消註冊後重新載入，並確認 `sw.js` 的 `VERSION` 已更新。
