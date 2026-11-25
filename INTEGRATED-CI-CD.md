# 🔗 フロントエンド＆バックエンド 統合CI/CDガイド

## 概要

フロントエンド（Vue.js）とバックエンド（PHP API）を別々のリポジトリで管理し、各リポジトリのmainブランチへのpushで自動的にXserverにデプロイします。

---

## **【2つのリポジトリの関係】**

```
┌─────────────────────────────────┐
│   GitHub Repositories           │
└─────────────────────────────────┘
   │                   │
   ├─ fml-share        │ フロントエンド（Vue.js）
   │  │ main branch    │
   │  └─ Actions → FTP → /public_html/app/
   │                   │
   └─ fml-share-server │ バックエンド（PHP API）
      main branch      │
      └─ Actions → FTP → /fml-share-api/ + /public_html/app/api/
                       │
┌──────────────────────┴──────────────────────┐
│          Xserver (sv161.xserver.jp)         │
│                                              │
│  /fml-share-api/           ← Backend API   │
│  /public_html/             ← Frontend Root │
│  ├── app/                                   │
│  │   ├── index.html        ← Vue.js App   │
│  │   ├── css/              ← Styles       │
│  │   ├── js/               ← Scripts      │
│  │   └── api/              ← Proxy Entry  │
│  │       └── index.php     ← Routing      │
│  └── nobu_contents/        ← Video Files  │
└──────────────────────────────────────────────┘
            ↓
     ユーザーアクセス
     https://bears.xsrv.jp/app/
```

---

## **【デプロイメント手順】**

### **フロントエンド側（fml-share）**

```bash
cd ~/fml-share
git add .
git commit -m "feature: add image header"
git push origin main
```

**実行内容：**
1. Node.js セットアップ
2. `npm install`
3. `npm run build` → `dist/` フォルダ生成
4. FTP でアップロード → `/public_html/app/`

### **バックエンド側（fml-share-server）**

```bash
cd ~/fml-share-server
git add .
git commit -m "fix: API endpoint"
git push origin main
```

**実行内容：**
1. PHP セットアップ
2. PHP構文チェック
3. デプロイメントパッケージ作成
4. FTP でアップロード → `/fml-share-api/` + `/public_html/app/api/`

---

## **【デプロイメント監視】**

### **フロントエンドのデプロイ状態確認**

```
https://github.com/knobuhara/fml-share
  → Actions タブ
  → 「Deploy Frontend to Xserver (FTP)」
  → 最新の実行
```

### **バックエンドのデプロイ状態確認**

```
https://github.com/knobuhara/fml-share-server
  → Actions タブ
  → 「Deploy Backend to Xserver (FTP)」
  → 最新の実行
```

---

## **【アクセス確認】**

### **1️⃣ フロントエンド**

```
https://bears.xsrv.jp/app/
```

**表示内容：**
- Vue.js アプリケーション
- ホスト画像
- 動画一覧

### **2️⃣ API エンドポイント**

```
https://bears.xsrv.jp/app/api/videos
```

**返却内容：**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "title": "動画タイトル",
      "file_path": "/public_html/nobu_contents/file.mp4"
    }
  ]
}
```

---

## **【GitHub Secretsの確認】**

### **フロントエンド側（fml-share）**

```
Settings → Secrets and variables → Actions
```

**必須：**
- `XSERVER_HOST` = `sv161.xserver.jp`
- `XSERVER_FTP_USER` = `nobu@bears.xsrv.jp`
- `XSERVER_FTP_PASSWORD` = `Xuan0911`

### **バックエンド側（fml-share-server）**

```
Settings → Secrets and variables → Actions
```

**必須：**
- `XSERVER_HOST` = `sv161.xserver.jp`
- `XSERVER_FTP_USER` = `nobu@bears.xsrv.jp`
- `XSERVER_FTP_PASSWORD` = `Xuan0911`

---

## **【デプロイメント順序のベストプラクティス】**

**推奨される更新順序：**

```
1️⃣ バックエンド側を更新（新APIエンドポイント追加など）
   git push origin main
   ↓ GitHub Actions が実行されるまで待機
   ↓ APIが反映されるまで待機

2️⃣ フロントエンド側を更新（新UIでAPI呼び出し）
   git push origin main
   ↓ GitHub Actions が実行される
   ↓ フロントエンドがビルド・デプロイされる

3️⃣ ブラウザで確認
   https://bears.xsrv.jp/app/
```

**理由：**
- APIが先に利用可能な状態である必要があります
- フロントエンドはAPIへのリクエストをすぐに実行します
- APIが未デプロイの場合、フロントエンドはエラーを返します

---

## **【トラブルシューティング】**

### ❌ フロントエンドはデプロイされたがAPIが404

**原因：** バックエンドのデプロイが完了していない

**解決策：**
1. `fml-share-server` の Actions を確認
2. デプロイが完了するまで待機
3. ブラウザキャッシュをクリア（Ctrl+Shift+Delete）

### ❌ APIは応答するがデータベース接続エラー

```
SQLSTATE[HY000]: General error: 1030
```

**原因：** Xserver上の `.env` ファイルが設定されていない

**解決策：**
1. FTP でXserverに接続
2. `/fml-share-api/.env` を配置
3. DB接続情報を確認

### ❌ APIが呼び出せない（CORS エラー）

```
Access to XMLHttpRequest blocked by CORS policy
```

**原因：** バックエンドのCORS設定が不足している

**解決策：**
`.env` で `CORS_ORIGINS` を確認
```
CORS_ORIGINS=https://bears.xsrv.jp,http://localhost:8080
```

### ❌ ホスト画像が表示されない

**原因：** フロントエンドのパス設定

**確認：** `src/views/ContentsView.vue`
```javascript
import akiokaImage from '@/../resource/akioka.jpg'
```

---

## **【ローカル開発時の接続】**

### **1️⃣ バックエンド（PHP API）起動**

```bash
cd ~/fml-share-server

# PuTTY でSSHトンネルを起動
# Source port: 3307, Destination: localhost:3306

# .env をコピー
cp .env.xserver .env

# APIサーバー起動
php -S 127.0.0.1:3001 -t public public/index.php
```

### **2️⃣ フロントエンド（Vue.js）起動**

```bash
cd ~/fml-share
npm run serve
```

**APIベースURL：** `http://127.0.0.1:3001`（vue.config.js で自動設定）

---

## **【本番環境との差異】**

| 項目 | ローカル | 本番（Xserver） |
|------|---------|----------------|
| フロントエンド | `http://localhost:8080/` | `https://bears.xsrv.jp/app/` |
| バックエンド | `http://127.0.0.1:3001/api/` | `https://bears.xsrv.jp/app/api/` |
| DB接続 | localhost:3307（トンネル） | 秘密鍵認証（トンネル） |
| HTTPS | 不要 | 必須 |
| .env | `.env.local` | Xserver上に配置 |

---

## **【CI/CDパイプラインの全体像】**

```
Developer
  ↓
git commit → git push origin main
  ↓
GitHub (fml-share)
  ├─ Actions: Lint/Test
  ├─ npm install
  ├─ npm run build
  └─ FTP Deploy to /public_html/app/
  ↓
GitHub (fml-share-server)
  ├─ Actions: PHP Lint
  ├─ Prepare package
  └─ FTP Deploy to /fml-share-api/
  ↓
Xserver (sv161.xserver.jp)
  ├─ /public_html/app/        (Frontend)
  ├─ /public_html/app/api/    (Entry)
  └─ /fml-share-api/          (Backend API)
  ↓
User Browser
  https://bears.xsrv.jp/app/
```

---

## **【チェックリスト】**

デプロイメント前に以下を確認してください：

### **GitHub Secrets（両リポジトリ）**
- ✅ `XSERVER_HOST` = `sv161.xserver.jp`
- ✅ `XSERVER_FTP_USER` = `nobu@bears.xsrv.jp`
- ✅ `XSERVER_FTP_PASSWORD` = `Xuan0911`

### **Xserver設定**
- ✅ `/fml-share-api/.env` が配置されている
- ✅ DB接続情報が正確
- ✅ `/public_html/app/` ディレクトリ存在
- ✅ `.htaccess` が配置されている

### **ローカル動作**
- ✅ フロントエンド：`npm run build` 成功
- ✅ バックエンド：`php -l` 構文エラーなし
- ✅ ブラウザ：キャッシュをクリア

---

これでCI/CDセットアップが完全に統合されました！🎉
