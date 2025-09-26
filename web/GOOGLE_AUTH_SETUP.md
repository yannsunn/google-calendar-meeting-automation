# Google Calendar API 認証設定ガイド

## 現在のエラー
- `redirect_uri_mismatch`: リダイレクトURIが承認済みリストに登録されていない
- `invalid_grant`: トークンの有効期限切れ

## 解決方法

### オプション1: OAuth 2.0の設定を修正

1. **Google Cloud Consoleにアクセス**
   - https://console.cloud.google.com/
   - プロジェクトを選択

2. **OAuth同意画面の設定**
   - 「APIとサービス」→「OAuth同意画面」
   - アプリケーション名、サポートメール等を設定

3. **認証情報の更新**
   - 「APIとサービス」→「認証情報」
   - OAuth 2.0 クライアント IDをクリック
   - 「承認済みのリダイレクト URI」に追加：
     ```
     http://localhost:3000/api/auth/callback
     https://calendar-bgsbsbnp0-yasuus-projects.vercel.app/api/auth/callback
     https://calendar-bgsbsbnp0-yasuus-projects.vercel.app/api/auth/callback/google
     ```

4. **新しいトークンの取得**
   ```bash
   node setup-google-auth.js
   ```

### オプション2: サービスアカウントを使用（推奨）

サービスアカウントを使用すると、ユーザー認証なしでAPIアクセスが可能です。

1. **サービスアカウントの作成**
   - 「IAMと管理」→「サービスアカウント」
   - 「サービスアカウントを作成」をクリック
   - 名前: `calendar-sync-service`
   - ロール: なし（後で設定）

2. **キーの作成**
   - 作成したサービスアカウントをクリック
   - 「キー」タブ→「鍵を追加」→「新しい鍵を作成」
   - JSON形式を選択してダウンロード

3. **カレンダーへのアクセス権限付与**
   - Google Calendarを開く
   - 設定→「特定のユーザーとの共有」
   - サービスアカウントのメールアドレスを追加
   - 権限: 「変更および共有の管理権限」

4. **環境変数の設定**
   ```bash
   GOOGLE_SERVICE_ACCOUNT_KEY=<JSONファイルの内容を1行にしたもの>
   ```

### オプション3: 簡易的な解決策

現在のクライアントIDは「Amazon」として登録されているようです。
新しいOAuth 2.0クライアントIDを作成することを推奨します：

1. **新しいクライアントIDの作成**
   - 「認証情報」→「認証情報を作成」→「OAuth クライアント ID」
   - アプリケーションの種類: ウェブアプリケーション
   - 名前: `Calendar Sync App`
   - 承認済みのリダイレクト URI: 上記のURLを追加

2. **環境変数の更新**
   ```
   GOOGLE_CLIENT_ID=<新しいクライアントID>
   GOOGLE_CLIENT_SECRET=<新しいクライアントシークレット>
   ```

## トラブルシューティング

### "アクセスをブロック: Amazon のリクエストは無効です"
- 現在のクライアントIDは「Amazon」として登録されている
- 新しいクライアントIDを作成するか、既存の設定を修正

### "invalid_grant"
- リフレッシュトークンの有効期限切れ
- 新しい認証フローを実行して新しいトークンを取得

### 今後の対策
- トークンの自動更新機能を実装
- エラーハンドリングの強化
- サービスアカウント方式への移行を検討