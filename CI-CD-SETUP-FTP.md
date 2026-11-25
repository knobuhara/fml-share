# 🚀 GitHub Actions CI/CD セットアップガイド【FTP版】

## 概要

mainブランチへのpushで自動的にXserverにFTPでデプロイします。

---

## **【3ステップセットアップ】**

### **ステップ1️⃣：GitHub Secretsを設定**

以下のURLにアクセス：
```
https://github.com/knobuhara/fml-share/settings/secrets/actions
```

右上の「New repository secret」をクリックして、以下の3つを追加：

| 変数名 | 値 | 説明 |
|--------|-----|------|
| `XSERVER_HOST` | `sv161.xserver.jp` | Xserverのホスト名 |
| `XSERVER_FTP_USER` | `nobu@bears.xsrv.jp` | FTPユーザー名 |
| `XSERVER_FTP_PASSWORD` | `Xuan0911` | FTPパスワード |

**設定手順：**
1. GitHub Secrets and variables → Actions
2. 「New repository secret」をクリック
3. 以下の3つを順に追加：

```yaml
Name: XSERVER_HOST
Secret: sv161.xserver.jp
✅ Add secret

---

Name: XSERVER_FTP_USER
Secret: nobu@bears.xsrv.jp
✅ Add secret

---

Name: XSERVER_FTP_PASSWORD
Secret: Xuan0911
✅ Add secret
```

---

### **ステップ2️⃣：mainブランチにプッシュ**

```bash
# 現在の作業内容をコミット
git add .
git commit -m "feature: add image header"

# mainブランチへプッシュ
git push origin main
```

---

### **ステップ3️⃣：デプロイメント状態確認**

#### **GitHub Actionsで確認：**

1. GitHub リポジトリ → 「Actions」タブを開く
2. 左サイドバーから「Deploy Frontend to Xserver (FTP)」を選択
3. 最新のワークフロー実行をクリック
4. 各ステップが ✅ で完了したら成功

#### **ブラウザで確認：**

```
https://bears.xsrv.jp/app/
```

---

## **📋 ワークフロー処理フロー**

```
mainブランチへのpush
        ↓
GitHub Actions トリガー
        ↓
1. コード取得（Checkout）
2. Node.js 18 セットアップ
3. npm dependencies インストール
4. Vue アプリケーションビルド（npm run build）
   └→ dist/ フォルダが生成
5. FTPでXserverにアップロード
   └→ /public_html/app/ にデプロイ
6. デプロイ完了通知
        ↓
✅ 完了 & ブラウザで即座に反映
```

---

## **🔧 FTP接続情報**

| 項目 | 値 |
|------|-----|
| ホスト名 | `sv161.xserver.jp` |
| ユーザー名 | `nobu@bears.xsrv.jp` |
| パスワード | `Xuan0911` |
| ポート | 21（標準FTP） |
| SSL/TLS | 有効（FTPS推奨） |
| アップロード先 | `/public_html/app/` |

---

## **💡 環境変数の確認事項**

### **vue.config.js の publicPath 設定**

```javascript
publicPath: process.env.NODE_ENV === 'production' ? '/app/' : '/'
```

- 開発環境：`/`（localhost:8080）
- 本番環境：`/app/`（Xserver上）

### **実際のアクセスURL**

```
Xserver上の配置： /public_html/app/
ブラウザアクセス： https://bears.xsrv.jp/app/
```

---

## **⚠️ トラブルシューティング**

### ❌ FTP接続エラー

```
Error: 530 User cannot log in
```

**原因：** FTP認証情報が間違っている

**解決策：**
1. GitHub Secrets を確認
   - `XSERVER_FTP_USER`: `nobu@bears.xsrv.jp`
   - `XSERVER_FTP_PASSWORD`: 正確なパスワード
2. FTP情報が正しいか確認

### ❌ ファイルが反映されない

**原因：** ブラウザキャッシュ

**解決策：**
1. キャッシュをクリア：Ctrl+Shift+Delete
2. 完全リロード：Ctrl+Shift+R

### ❌ ワークフロー実行されない

**原因：**
- devブランチにコミットしている（mainへのpushが必要）
- GitHub Actionsが無効になっている

**解決策：**
```bash
# devからmainへマージして実行
git checkout main
git merge dev
git push origin main
```

---

## **🎯 次のステップ**

1. **バックエンド（PHP API）のCI/CDも構築** → 別途ワークフロー作成
2. **環境変数の管理** → `.env`ファイルの安全な配置
3. **自動テスト追加** → `npm test` 実行
4. **ステージング環境の追加** → 本番前のテスト環境

---

## **📚 参考資料**

- [GitHub Actions公式ドキュメント](https://docs.github.com/en/actions)
- [FTP-Deploy-Actionの使用方法](https://github.com/SamKirkland/FTP-Deploy-Action)
- [Vue.js ビルド設定](https://cli.vuejs.org/config/#publicpath)
