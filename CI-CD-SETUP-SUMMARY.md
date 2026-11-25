# ✅ CI/CD統合セットアップ 完了サマリー

## 🎯 セットアップ完了内容

### **【フロントエンド側】fml-share**
- ✅ `.github/workflows/deploy-xserver.yml` - Vue.jsデプロイワークフロー
- ✅ `CI-CD-SETUP-FTP.md` - フロントエンド詳細ガイド
- ✅ `INTEGRATED-CI-CD.md` - 統合管理ガイド

### **【バックエンド側】fml-share-server**
- ✅ `.github/workflows/deploy-xserver.yml` - PHP APIデプロイワークフロー
- ✅ `CI-CD-SETUP-FTP.md` - バックエンド詳細ガイド

---

## **【今すぐやること】GitHub Secrets設定（両リポジトリ）**

### **1️⃣ フロントエンド（fml-share）**

```
https://github.com/knobuhara/fml-share/settings/secrets/actions
```

追加する3つのシークレット：
```yaml
XSERVER_HOST           = sv161.xserver.jp
XSERVER_FTP_USER       = nobu@bears.xsrv.jp
XSERVER_FTP_PASSWORD   = Xuan0911
```

### **2️⃣ バックエンド（fml-share-server）**

```
https://github.com/knobuhara/fml-share-server/settings/secrets/actions
```

追加する3つのシークレット（同じ内容）：
```yaml
XSERVER_HOST           = sv161.xserver.jp
XSERVER_FTP_USER       = nobu@bears.xsrv.jp
XSERVER_FTP_PASSWORD   = Xuan0911
```

---

## **【デプロイメント実行】**

### **パターン1：フロントエンドだけを更新**

```bash
cd ~/fml-share
git add .
git commit -m "feature: add image header"
git push origin main
```

**実行内容：**
```
フロントエンド側のGitHub Actions
  ├─ npm install
  ├─ npm run build → dist/ 生成
  └─ FTP → /public_html/app/ にデプロイ
```

**確認：**
```
https://bears.xsrv.jp/app/
```

---

### **パターン2：バックエンドだけを更新**

```bash
cd ~/fml-share-server
git add .
git commit -m "fix: API endpoint"
git push origin main
```

**実行内容：**
```
バックエンド側のGitHub Actions
  ├─ PHP構文チェック
  ├─ デプロイメントパッケージ作成
  └─ FTP → /fml-share-api/ にデプロイ
```

**確認：**
```bash
curl https://bears.xsrv.jp/app/api/videos
```

---

### **パターン3：両方を更新（推奨）**

**ステップ1：バックエンドを先に更新**

```bash
cd ~/fml-share-server
git add .
git commit -m "feature: new API endpoint"
git push origin main
# ✅ GitHub Actions が実行されるまで待機
```

**ステップ2：フロントエンドを更新**

```bash
cd ~/fml-share
git add .
git commit -m "feature: call new API endpoint"
git push origin main
# ✅ GitHub Actions が実行される
```

**ステップ3：ブラウザで確認**

```
https://bears.xsrv.jp/app/
```

---

## **【デプロイメント監視】**

### **フロントエンドの状態**

```
GitHub → knobuhara/fml-share
  → Actions タブ
  → 「Deploy Frontend to Xserver (FTP)」
  → 最新実行を確認
```

**正常時：** ✅ すべてのステップが緑色
```
✅ Checkout code
✅ Setup Node.js
✅ Install dependencies
✅ Build Vue app
✅ Deploy to Xserver via FTP
✅ Deployment completed
```

---

### **バックエンドの状態**

```
GitHub → knobuhara/fml-share-server
  → Actions タブ
  → 「Deploy Backend to Xserver (FTP)」
  → 最新実行を確認
```

**正常時：** ✅ すべてのステップが緑色
```
✅ Checkout code
✅ Setup PHP
✅ Validate PHP code
✅ Prepare deployment package
✅ Deploy to Xserver via FTP
✅ Verify API deployment
✅ Run PHP Linter
✅ Check for syntax errors
```

---

## **【デプロイメント先の確認】**

### **Xserver上の最終構成**

```
/fml-share-api/                    ← Backend API（非公開）
  ├── api/
  ├── config/
  ├── lib/
  ├── public/
  └── .env                         ← 重要：手動配置

/public_html/app/                  ← Frontend（公開）
  ├── index.html                   ← Vue.js App
  ├── css/
  ├── js/
  ├── api/                         ← Entry Point
  │   ├── index.php                ← Routing
  │   └── .htaccess
  └── [その他のアセット]
```

---

## **【ユーザーアクセスフロー】**

```
1️⃣ ユーザーがブラウザにアクセス
   https://bears.xsrv.jp/app/
        ↓
2️⃣ Xserver がフロントエンドを返す
   /public_html/app/index.html
        ↓
3️⃣ Vue.js が起動・API呼び出し
   https://bears.xsrv.jp/app/api/videos
        ↓
4️⃣ .htaccess がリライト
   /public_html/app/api/index.php
        ↓
5️⃣ index.php がバックエンドにルーティング
   /fml-share-api/public/index.php
        ↓
6️⃣ PHP API が処理・DB照会
   SELECT ... FROM videos
        ↓
7️⃣ JSON レスポンスを返す
   { "success": true, "data": [...] }
        ↓
8️⃣ Vue.js が表示・更新
```

---

## **【トラブルシューティング】**

### ❌ ワークフロー実行されない

**原因：** devブランチにコミットしている（mainへのpushが必要）

**解決策：**
```bash
git checkout main
git merge dev
git push origin main
```

---

### ❌ FTP接続エラー

**確認項目：**
1. GitHub Secrets が正確に入力されているか
2. Xserver FTP接続情報が正確か

**テスト方法（PowerShell）：**
```powershell
# FTP接続テスト
$ftp = New-Object System.Net.FtpWebRequest -ArgumentList "ftp://sv161.xserver.jp"
$ftp.Credentials = New-Object System.Net.NetworkCredential("nobu@bears.xsrv.jp", "Xuan0911")
$ftp.Method = [System.Net.WebRequestMethods+Ftp]::ListDirectory
$response = $ftp.GetResponse()
Write-Host "FTP接続: OK"
```

---

### ❌ API が404

**確認項目：**
1. バックエンド側のGitHub Actions が完了しているか
2. `/fml-share-api/` と `/public_html/app/` が両方デプロイされているか

**解決策：**
```bash
# GitHub Actions で「Deploy Backend to Xserver」が完了するまで待機
# その後ブラウザキャッシュをクリア（Ctrl+Shift+Delete）
```

---

### ❌ DB接続エラー

**原因：** Xserver上に `.env` ファイルがない

**解決策：**
1. ローカルの `.env.xserver` をコピー
2. FTP で `/fml-share-api/.env` にアップロード
3. DB接続情報を確認

---

## **【ファイル一覧】**

### **フロントエンド側：fml-share**
- `.github/workflows/deploy-xserver.yml`
- `CI-CD-SETUP-FTP.md`
- `INTEGRATED-CI-CD.md`
- `XSERVER-QUICK-START.md`
- `XSERVER-SSH-SETUP.md`
- `XSERVER-TROUBLESHOOT.md`

### **バックエンド側：fml-share-server**
- `.github/workflows/deploy-xserver.yml`
- `CI-CD-SETUP-FTP.md`

---

## **【次のステップ】**

1. **GitHub Secrets を両リポジトリに設定**
2. **mainブランチにプッシュしてデプロイテスト**
3. **https://bears.xsrv.jp/app/ で動作確認**
4. **API疎通確認**：`curl https://bears.xsrv.jp/app/api/videos`

---

すべてのセットアップが完了しました！🎉

**さあ、デプロイしましょう！**

```bash
# フロントエンド側
cd ~/fml-share
git push origin main

# バックエンド側
cd ~/fml-share-server
git push origin main
```
