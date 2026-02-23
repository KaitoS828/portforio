# Face Portfolio

Sekimoto Kaito のポートフォリオサイトです。Three.js による 3D キャラクターアニメーションと、Works コンテンツ管理 Admin を備えています。

## Features

- **3D モデルアニメーション** — セクションごとに異なるキャラクター（Standard Walk / House Dancing / Typing / Running Jump）
- **Draco 圧縮** — モデルファイルを最大 86% 圧縮
- **Works Admin** — ブラウザ上でポートフォリオコンテンツを編集・保存・GitHub push
- **2 レイアウト** — スクロール型 (`index.html`) とパネル型 (`index-v2.html`)

## Tech Stack

- Three.js (GLTFLoader / DRACOLoader / UnrealBloomPass)
- Express.js (API サーバー)
- GitHub REST API v2022-11-28 (コンテンツ自動 push)
- Vanilla JS / CSS

## Getting Started

```bash
npm install
npm run serve
```

ポートフォリオ: http://127.0.0.1:8080
Works Admin:   http://127.0.0.1:8080/works/admin.html

## Works Admin

Admin 画面からワーク情報を編集して Save すると、ローカル保存と同時に GitHub へ自動 push されます。
GitHub 接続設定はサイドバー下の「GitHub Push」から行ってください。
