# GitHub Actions CI/CD セットアップガイド

## 概要
このドキュメントでは、GitHubのmainブランチへのpushを自動的にXserverにデプロイするCI/CDパイプラインのセットアップ方法を説明します。

## セットアップ手順

### ステップ1：Xserverの秘密鍵をBase64エンコード

1. ローカルのダウンロードフォルダから`bears.key`を取得
2. PowerShellで以下を実行してBase64エンコード：

```powershell
$keyPath = "C:\Users\knobuhara\Downloads\bears.key"
$keyContent = [System.IO.File]::ReadAllBytes($keyPath)
$base64Key = [Convert]::ToBase64String($keyContent)
$base64Key | Set-Clipboard
# クリップボードにコピーされます
```

### ステップ2：GitHubリポジトリのシークレット変数を設定

以下のURLにアクセス：
```
https://github.com/knobuhara/fml-share/settings/secrets/actions
```

以下のシークレット変数を追加します（右上の「New repository secret」をクリック）：

| 変数名 | 値 | 説明 |
|--------|-----|------|
| `XSERVER_HOST` | `sv161.xserver.jp` | Xserverのホスト名 |
| `XSERVER_USER` | `bears` | Xserverのsshユーザー名 |
| `XSERVER_SSH_KEY` | *(Base64エンコードされた秘密鍵)* | 上記で生成したBase64文字列 |

**セットアップの詳細手順：**

1. GitHub リポジトリのSettingsタブを開く
2. 左サイドバーの「Secrets and variables」→「Actions」をクリック
3. 右上の「New repository secret」ボタンをクリック
4. 以下を入力：
   - **Name**: `XSERVER_HOST`
   - **Secret**: `sv161.xserver.jp`
5. 「Add secret」をクリック

6. 同じ手順で残りのシークレットも追加：
   - **Name**: `XSERVER_USER`
   - **Secret**: `bears`

7. 秘密鍵の追加（最も重要）：
   - **Name**: `XSERVER_SSH_KEY`
   - **Secret**: *(PowerShellで生成したBase64文字列をペースト)*
   - 「Add secret」をクリック

### ステップ3：Xserverの秘密鍵を使用可能にする設定

Xserverのsshアクセス権限設定：

```bash
# Xserver上で実行
# .sshディレクトリの権限設定
chmod 700 ~/.ssh
chmod 600 ~/.ssh/authorized_keys
```

### ステップ4：デプロイメントの確認

#### 自動デプロイメント
mainブランチへのpushで自動的にデプロイが実行されます：

```bash
git add .
git commit -m "feature: add image header"
git push origin main
```

#### 手動デプロイメント
GitHub Webページから手動でトリガーすることもできます：

1. GitHub リポジトリの「Actions」タブを開く
2. 左サイドバーから「Deploy Frontend to Xserver」を選択
3. 右側に「Run workflow」ボタンが表示される
4. ブランチを選択して「Run workflow」をクリック

### ステップ5：デプロイメント状況の確認

1. GitHub リポジトリの「Actions」タブを開く
2. 最新のワークフロー実行をクリック
3. 以下の内容を確認：
   - ✅ 各ステップが成功したか
   - ✅ ログの詳細メッセージ
   - ⚠️ エラーが発生した場合の原因

## トラブルシューティング

### エラー：「Permission denied (publickey)」

**原因**：Xserverの秘密鍵が正しくセットアップされていない

**解決策**：
1. `bears.key`のパーミッション確認
2. Xserver上の`authorized_keys`にpublic keyが登録されているか確認

```bash
# Xserver上で実行
ls -la ~/.ssh/
cat ~/.ssh/authorized_keys
```

### エラー：「Host key verification failed」

**原因**：known_hostsにXserverのホストキーが登録されていない

**解決策**：自動的に処理されるため、通常は解決します

### デプロイはしたが、ファイルが反映されない

**原因**：ブラウザのキャッシュ

**解決策**：
1. ブラウザキャッシュをクリア（Ctrl+Shift+Delete）
2. 完全リロード（Ctrl+Shift+R）

## 環境変数の補足

### vue.config.js の publicPath 設定

現在の設定：
```javascript
publicPath: process.env.NODE_ENV === 'production' ? '/app/' : '/',
```

- **開発環境**：`/`
- **本番環境**：`/app/`

Xserver上の配置パス：`/home/bears/public_html/app/`

ブラウザからのアクセス：`https://bears.xsrv.jp/app/`

## その他の便利なコマンド

### ローカルでビルドテスト

```bash
npm run build
# dist/ フォルダが生成される
```

### vue.config.js の production path 確認

```bash
# ビルド確認
ls -la dist/
cat dist/index.html | grep publicPath
```

## 参考資料

- [GitHub Actions公式ドキュメント](https://docs.github.com/en/actions)
- [rsync コマンド](https://rsync.samba.org/)
- [SSH 秘密鍵認証](https://docs.github.com/en/authentication/connecting-to-github-with-ssh)

---

## CI/CDパイプラインの構成図

```
┌─────────────────┐
│  Git commit     │
│  to main branch │
└────────┬────────┘
         │
         ▼
┌─────────────────────┐
│ GitHub Actions      │
│ Workflow triggered  │
└────────┬────────────┘
         │
         ▼
┌─────────────────────┐
│ 1. Checkout code    │
│ 2. Install deps     │
│ 3. Build Vue app    │
└────────┬────────────┘
         │
         ▼
┌─────────────────────┐
│ 4. Upload SSH key   │
│ 5. Deploy via rsync │
│ 6. Verify deploy    │
└────────┬────────────┘
         │
         ▼
┌─────────────────────┐
│ ✅ Deployed to      │
│ Xserver /app/       │
└─────────────────────┘
```
