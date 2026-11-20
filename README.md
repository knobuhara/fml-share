# FML Share — フロントエンド

Vue 3による動画一覧・ダウンロード画面です。PHP APIは [fml-share-server](https://github.com/knobuhara/fml-share-server) を使用します。

```powershell
Copy-Item .env.example .env.local
npm ci
npm run serve
```

ローカルのAPI接続先は `.env.local` の `VUE_APP_API_URL` で設定します。Vueのビルドに含まれるため、この値に認証情報を入れないでください。

Xserverの `/app/` に配置する場合は、`$env:VUE_APP_API_URL = '/app/'` を設定して `npm run build` を実行します。同じドメインの `/app/api` を呼び出します。
