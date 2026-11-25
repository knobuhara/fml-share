# Xserver SSH 設定確認・セットアップガイド

## 現在の接続方法の確認

`.env.xserver` にXserverの接続情報が記載されています：

```
XSERVER_HOST=sv161.xserver.jp
XSERVER_USERNAME=nobu@bears.xsrv.jp（FTP用）
SSH_USER=bears（SSH用）
SSH_PORT=22
```

---

## **方法1：PowerShellから直接SSH接続**

### ステップ1：PowerShellを開く

Windowsキー + X → PowerShell（管理者権限）

### ステップ2：Xserverに接続

```powershell
$keyPath = "C:\Users\knobuhara\Downloads\bears.key"
ssh -i $keyPath bears@sv161.xserver.jp
```

### ステップ3：Xserver上で以下を実行

```bash
# .ssh ディレクトリの権限設定
chmod 700 ~/.ssh
chmod 600 ~/.ssh/authorized_keys

# public key が登録されているか確認
cat ~/.ssh/authorized_keys

# デプロイ先ディレクトリの確認
ls -la ~/public_html/app/

# 接続を終了
exit
```

---

## **方法2：PuTTYを使用する方法（GUI）**

### ステップ1：PuTTY Key Generatorで鍵を変換

1. PuTTY Key Generatorを起動
2. 「Conversions」→「Import key」
3. `C:\Users\knobuhara\Downloads\bears.key` を選択
4. 「Save private key」で `.ppk` 形式で保存

### ステップ2：PuTTYで接続

1. PuTTYを起動
2. ホスト名に `sv161.xserver.jp`
3. ユーザー名に `bears`
4. SSH → 認証 → プライベートキーファイルで `.ppk` を選択
5. 「Open」をクリック

### ステップ3：同様にコマンドを実行

```bash
chmod 700 ~/.ssh
chmod 600 ~/.ssh/authorized_keys
cat ~/.ssh/authorized_keys
ls -la ~/public_html/app/
exit
```

---

## **方法3：WinSCPで管理（ファイルアップロード/ダウンロード）**

WinSCPもSSH秘密鍵を使用して接続できます（GUI操作）

1. WinSCPを起動
2. 新しいサイト：
   - ホスト名：`sv161.xserver.jp`
   - ユーザー名：`bears`
   - 秘密鍵ファイル：`C:\Users\knobuhara\Downloads\bears.key`
3. ログイン

---

## **設定確認チェックリスト**

SSH接続後、以下を確認してください：

### ✅ .ssh ディレクトリの権限

```bash
ls -la ~/.ssh/
# 出力例：
# drwx------ 2 bears bears 4096 Nov 25 10:00 .ssh
```

**権限が `700` の場合：OK**
権限が異なる場合：
```bash
chmod 700 ~/.ssh
```

### ✅ authorized_keys の確認

```bash
cat ~/.ssh/authorized_keys
# public key が表示されるはず
```

**出力例：**
```
ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABgQD... [公開鍵の内容]
```

**出力がない場合の対応：**

PuTTY Key Generator または ssh-keygen で public key を生成し、Xserverの `~/.ssh/authorized_keys` に追加

### ✅ デプロイ先ディレクトリの確認

```bash
ls -la ~/public_html/app/
```

**出力例：**
```
drwxr-xr-x  3 bears bears 4096 Nov 25 10:00 app
-rw-r--r--  1 bears bears  246 Nov 25 10:00 .htaccess
-rw-r--r--  1 bears bears 2048 Nov 25 10:00 api/index.php
```

---

## **GitHub Actions デプロイメント用設定確認**

SSH設定が正しいか確認するコマンド：

```bash
# SSH接続テスト
ssh -i C:\Users\knobuhara\Downloads\bears.key bears@sv161.xserver.jp "echo 'SSH接続成功'; pwd"

# rsync テスト（GitHub Actionsで使用）
# ローカルテスト（PowerShellで実行）
rsync -avz --dry-run -e "ssh -i C:\Users\knobuhara\Downloads\bears.key" ./dist/ bears@sv161.xserver.jp:/home/bears/public_html/app/
```

---

## **トラブルシューティング**

### ❌ SSH接続がタイムアウト

```
ssh: connect to host sv161.xserver.jp port 22: Connection timed out
```

**原因：**
- ネットワーク接続の問題
- ファイアウォール設定
- Xserverのssh portが22でない

**解決策：**
```bash
# ホスト名とポート番号を確認
nslookup sv161.xserver.jp

# 別のポート番号を試す（例：10022）
ssh -p 10022 -i $keyPath bears@sv161.xserver.jp
```

### ❌ Permission denied (publickey)

```
Permission denied (publickey).
```

**原因：**
- SSH秘密鍵が正しくない
- authorized_keysにpublic keyが登録されていない
- キーのパーミッションが正しくない

**解決策：**
```bash
# Xserver上で実行
chmod 600 ~/.ssh/authorized_keys
chmod 700 ~/.ssh

# 秘密鍵が正しいか確認
ssh-keygen -l -f ~/.ssh/authorized_keys
```

### ❌ rsync: command not found

GitHub Actions上で実行される場合は自動的にrsyncがインストールされます。

---

## **参考：デプロイメント先パスの対応関係**

```
ローカル開発：        dist/ （Vue build output）
           ↓↓↓ rsync で転送
Xserver配置：  /home/bears/public_html/app/
           ↓↓↓ ブラウザアクセス
ユーザーアクセス： https://bears.xsrv.jp/app/
```

---

## **最後の確認**

GitHub Actions CI/CDが正常に動作するために必要な項目：

- ✅ SSH秘密鍵（bears.key）が正常
- ✅ Xserver上の `~/.ssh/authorized_keys` にpublic keyが登録
- ✅ `/home/bears/public_html/app/` ディレクトリにrsyncで書き込み可能
- ✅ GitHub Secrets に以下が登録済み：
  - `XSERVER_HOST`
  - `XSERVER_USER`
  - `XSERVER_SSH_KEY`

すべて確認できたら、GitHub Actions を実行してデプロイメント可能です！
