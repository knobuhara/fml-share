# 🚀 Xserver SSH設定 実行ステップ

## **【最速セットアップ】3ステップ**

### **ステップ1：Xserverに接続テスト**

PowerShell（管理者権限）を開いて、このコマンドを実行：

```powershell
ssh -i "C:\Users\knobuhara\Downloads\bears.key" bears@sv161.xserver.jp
```

**成功すると、こう表示されます：**
```
bears@sv161:~$
```

---

### **ステップ2：SSH設定を確認・修正**

Xserverのコマンドライン上で以下を実行：

```bash
# コピー＆ペースト全部実行
chmod 700 ~/.ssh
chmod 600 ~/.ssh/authorized_keys
cat ~/.ssh/authorized_keys
ls -la ~/public_html/app/
```

**出力確認ポイント：**
- `authorized_keys` にssh-rsa... で始まる行が表示される → ✅ OK
- `app` ディレクトリが存在する → ✅ OK

---

### **ステップ3：接続を終了**

```bash
exit
```

---

## **【次のステップ】GitHub Secretsの設定**

以下のURLにアクセス：
```
https://github.com/knobuhara/fml-share/settings/secrets/actions
```

**以下の3つのシークレット変数を追加：**

| 変数名 | 値 |
|--------|-----|
| `XSERVER_HOST` | `sv161.xserver.jp` |
| `XSERVER_USER` | `bears` |
| `XSERVER_SSH_KEY` | *(クリップボードのBase64文字列)* |

**クリップボードにBase64文字列がない場合：**

PowerShellで実行：
```powershell
$keyPath = "C:\Users\knobuhara\Downloads\bears.key"
$keyContent = [System.IO.File]::ReadAllBytes($keyPath)
$base64Key = [Convert]::ToBase64String($keyContent)
$base64Key | Set-Clipboard
```

---

## **【デプロイメント実行】自動デプロイ**

mainブランチへのpushで自動デプロイが実行されます：

```bash
git add .
git commit -m "feature: some change"
git push origin main
```

**状態確認：**
- GitHub → Actions タブ
- 「Deploy Frontend to Xserver」ワークフローが実行されているか確認
- すべてのステップが ✅ でクローズしたらデプロイ完了

---

## **【よくある質問】**

### Q: SSH接続がタイムアウトする
A: 以下を試してください：
```powershell
# ホスト名の確認
nslookup sv161.xserver.jp

# 別ポートを試す
ssh -p 10022 -i "C:\Users\knobuhara\Downloads\bears.key" bears@sv161.xserver.jp
```

### Q: Permission denied が出る
A: Xserver上で実行：
```bash
chmod 600 ~/.ssh/authorized_keys
chmod 700 ~/.ssh
cat ~/.ssh/authorized_keys  # 内容があるか確認
```

### Q: authorized_keys が空
A: public key を追加する必要があります。バックエンド側に確認してください。

---

## **トラブル時の連絡先**

詳細は `XSERVER-SSH-SETUP.md` を参照してください。
