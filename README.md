# 包包早餐店保衛戰（baobao）

可愛包子守護早餐店的 10 關塔防網頁遊戲。設計文件：[docs/designs/baobao.md](docs/designs/baobao.md)。

## 本機執行

需要 Node 22 以上和 Python 3.8 以上。

```sh
# 建議在虛擬環境裡安裝 Python 工具，避免影響其他專案
python -m venv .venv
.venv\Scripts\activate            # macOS / Linux：source .venv/bin/activate
pip install -r tools/requirements.txt
python tools/subset_font.py       # 產生裁切後的字型（改過中文文字後要重新執行）

npm install
npm run dev                       # 開啟 http://localhost:5173/baobao/
npm test                          # 單元測試
npm run build                     # 打包到 dist/
```

主畫面圖示已經在 `public/icons/` 裡。要重畫的話，執行 `python tools/make_icons.py`。

## 用手機測試

```sh
npm run dev -- --host
```

手機和電腦要連同一個 Wi-Fi。用手機瀏覽器打開終端機顯示的 Network 網址，結尾加上 `/baobao/`。

## 開發用網址參數

只在 `npm run dev` 時有效：

| 參數 | 作用 |
|---|---|
| `?unlockAll` | 解鎖所有包子、所有關卡，每種食材給 2 個 |
| `?level=N` | 開機後直接進入第 N 關 |
| `?fps` | 戰鬥中顯示每秒幀數 |

可以合併使用，例如 `?level=10&unlockAll&fps`。

## 調整數值

所有數值都在 `src/data/` 的 JSON 檔裡，改完存檔，瀏覽器會自動重新整理：

- `buns.json`：包子的蒸氣值、冷卻、血量、攻擊
- `enemies.json`：敵人的血量、速度、咬的傷害
- `levels.json`：每關開放的車道、出怪間隔、每波敵人數量、過關獎勵
- `recipes.json`：合成配方
- `strings.json`：介面文字

戰鬥的固定數值，例如蒸氣值增加速度、子彈速度，在 `src/config.js`。改完後執行 `npm test`，確認資料格式正確。

## 部署到 GitHub Pages

1. 在 GitHub 建立名為 **`baobao`** 的 repo。網址路徑 `/baobao/` 寫在 `vite.config.js` 裡，名稱不同就要一起改。
2. 推送到 `main` 分支。
3. 第一次部署前，到 repo 的 **Settings → Pages**，把 **Source** 設成 **GitHub Actions**。
4. 之後每次推送到 `main`，都會自動測試、打包、部署。網址是 `https://<帳號>.github.io/baobao/`。

注意：免費的 GitHub Pages 需要公開的 repo，原始碼會公開。

## 在她的手機上安裝

存檔放在瀏覽器裡。iPhone 的 Safari 如果 7 天沒打開這個網站，可能會清掉資料。所以請把遊戲**加到主畫面**，之後都從圖示打開：

- **iPhone（Safari）：** 分享按鈕 → 加入主畫面
- **Android（Chrome）：** 右上角選單 → 加到主畫面／安裝應用程式

加到主畫面的版本和 Safari 分頁的存檔是分開的。

## 字型授權

遊戲使用 [jf open 粉圓](https://github.com/justfont/open-huninn-font) 2.1，授權為 SIL Open Font License 1.1（見 `tools/fonts/OFL.txt`）。這個授權保留了「open huninn」和「huninn」兩個名稱，所以裁切後的字型改名為 `BaobaoRounded`。
