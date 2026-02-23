# Sekimoto Kaito — Creative Developer Portfolio

**Live:** https://portforio-liard.vercel.app

フロントエンドからバックエンドまで、Three.js 3D・AI・インタラクティブアートを組み合わせたプロダクトを制作する Creative Developer のポートフォリオサイト。

---

## Overview

| 項目 | 内容 |
|---|---|
| 作者 | Sekimoto Kaito（関本海斗） |
| 公開URL | https://portforio-liard.vercel.app |
| デプロイ | Vercel（静的ホスティング） |
| ローカル開発 | Express.js (`npm run serve`) |

---

## Features

### 3D インタラクティブビジュアル
- **Four 3D Characters** — セクションごとに異なるアニメーションモデルが登場
  - Hero: Standard Walk
  - About: House Dancing
  - Works: Typing
  - Contact: Running Jump
- **Draco 圧縮** — オリジナル GLB（合計 78MB）を Draco 圧縮で **10.4MB（87%削減）** に軽量化
- **UnrealBloomPass** — シネマティックなグロー・ブルーム演出
- **Raycasting インタラクション** — ホバーでエミッシブグロー（シアン）、クリックでスケールバウンス
- **マウス追従** — アイドル時にモデルがカーソルに向いてゆっくり回転
- **2 レイアウト**
  - `index.html` — スクロール型（IntersectionObserver + スクロール位置でモデル切り替え）
  - `index-v2.html` — パネル型（キーボード / ボタンでパネル切り替え）

### Works Detail Pages
- 4 作品の専用詳細ページ（The Board / Face Portfolio / Remotion / Freemarket App）
- モックブラウザウィンドウ UI（スクリーンショット画像対応）
- Features・Tech Stack・CTA セクション
- Prev / Next ナビゲーション

### Works Admin（ローカル専用）
- `http://localhost:8080/works/admin.html` — Works 詳細ページのコンテンツを GUI で編集
- Save → ローカル保存 + **GitHub API 経由で自動 push**（`works/data.json`）
- `⌘S` ショートカット対応

### Site Admin（ローカル専用）
- `http://localhost:8080/site-admin.html` — メインページ（Hero / About / Works / Contact）を GUI で編集
- Save → ローカル保存 + **GitHub API 経由で自動 push**（`site-data.json`）

---

## Tech Stack

| カテゴリ | 技術 |
|---|---|
| 3D / Graphics | Three.js 0.170, GLTFLoader, DRACOLoader, UnrealBloomPass |
| 3D Models | GLB（ReadyPlayer Me / Mixamo）, gltf-pipeline（Draco圧縮） |
| Frontend | Vanilla JS (ES Modules), CSS Custom Properties |
| Backend（dev only） | Express.js 5 |
| Deploy | Vercel（静的ファイルホスティング） |
| CMS | GitHub REST API v2022-11-28（`PUT /repos/.../contents`） |
| SEO | OGP, Twitter Card, JSON-LD (Person), sitemap.xml, robots.txt |

---

## Project Structure

```
face-portfolio/
├── index.html          # メインポートフォリオ（スクロール型）
├── index-v2.html       # パネル型レイアウト
├── site-admin.html     # Site Admin UI
├── site-data.json      # メインページコンテンツ（Hero/About/Works/Contact）
├── server.js           # Express API サーバー（dev only）
├── robots.txt
├── sitemap.xml
│
├── assets/
│   ├── model-draco.glb          # Hero   — Standard Walk  (2.0MB)
│   ├── house-dancing-draco.glb  # About  — House Dancing  (3.8MB)
│   ├── typing-draco.glb         # Works  — Typing         (2.5MB)
│   └── running-jump-draco.glb   # Contact— Running Jump   (2.1MB)
│
├── css/
│   ├── style.css       # index.html 用スタイル
│   └── style-v2.css    # index-v2.html 用スタイル
│
├── js/
│   ├── main.js         # index.html エントリーポイント
│   ├── main-v2.js      # index-v2.html エントリーポイント
│   ├── face.js         # Three.js シーン・モデルロード・アニメーション
│   ├── animations.js   # スクロール連動モデル切り替え
│   ├── scene.js        # レンダラー・カメラ・ライト初期化
│   └── particles.js    # バックグラウンドパーティクル
│
└── works/
    ├── admin.html           # Works Detail Admin UI
    ├── works.js             # 共通: カーソル + フェードイン + データ注入
    ├── style.css            # Works 詳細ページ共通スタイル
    ├── data.json            # Works コンテンツ（4作品）
    ├── the-board.html
    ├── face-portfolio.html
    ├── remotion.html
    └── freemarket.html
```

---

## Getting Started

### Prerequisites
- Node.js 18+

### Install & Run
```bash
cd face-portfolio
npm install
npm run serve
```

| URL | 内容 |
|---|---|
| http://localhost:8080 | ポートフォリオ（スクロール型） |
| http://localhost:8080/index-v2.html | ポートフォリオ（パネル型） |
| http://localhost:8080/site-admin.html | Site Admin |
| http://localhost:8080/works/admin.html | Works Admin |

---

## GitHub Integration（Admin）

Works Admin / Site Admin の Save ボタンで GitHub リポジトリに自動 push できます。

1. Admin ページのサイドバー「GitHub Push」を開く
2. Personal Access Token（`repo` スコープ）を入力
3. Owner / Repo / Branch / File Path を設定して Save Config
4. 以降は Save するたびに自動 push

> `config.json`（認証情報）は `.gitignore` に含まれており、リポジトリには公開されません。

---

## Deployment（Vercel）

1. Vercel で `KaitoS828/portforio` をインポート
2. **Root Directory**: `face-portfolio`
3. **Framework Preset**: Other
4. Deploy

> `server.js` の API エンドポイントは Vercel では動作しません（静的配信のみ）。
> コンテンツの更新は Admin → GitHub push → Vercel 自動デプロイのフローで行います。

---

## SEO

- `<title>` / `<meta description>` 全ページ個別設定
- Open Graph（Facebook / LINE プレビュー）
- Twitter Card（X プレビュー）
- JSON-LD Person スキーマ（Google リッチリザルト対応）
- `sitemap.xml` / `robots.txt`

---

## License

MIT © Sekimoto Kaito
