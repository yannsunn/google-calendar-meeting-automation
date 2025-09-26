# 📋 サービスアカウント手動設定ガイド

## ステップ1: Google Cloud Consoleでサービスアカウントを作成

1. **Google Cloud Consoleにアクセス**
   https://console.cloud.google.com/iam-admin/serviceaccounts

2. **「サービスアカウントを作成」をクリック**

3. **サービスアカウントの詳細を入力**
   - サービスアカウント名: `calendar-sync-service`
   - サービスアカウントID: `calendar-sync-service`
   - 説明: Calendar Sync Service Account

4. **「作成して続行」をクリック**

5. **ロールは省略**（後でカレンダー側で権限設定）
   - 「続行」をクリック

6. **「完了」をクリック**

## ステップ2: サービスアカウントキーを作成

1. **作成したサービスアカウントをクリック**

2. **「キー」タブを選択**

3. **「鍵を追加」→「新しい鍵を作成」**

4. **キーのタイプ: JSON を選択**

5. **「作成」をクリック**
   - JSONファイルが自動的にダウンロードされます
   - このファイルを安全に保管してください

## ステップ3: JSONキーの内容を環境変数に設定

ダウンロードしたJSONファイルを開いて、内容をコピーしてください。

### JSONファイルの例:
```json
{
  "type": "service_account",
  "project_id": "your-project-id",
  "private_key_id": "...",
  "private_key": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n",
  "client_email": "calendar-sync-service@your-project-id.iam.gserviceaccount.com",
  "client_id": "...",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "..."
}
```

## ステップ4: Google Calendarへのアクセス権限を付与

### 重要: サービスアカウントのメールアドレスをメモ
JSONファイルの `client_email` の値（例: `calendar-sync-service@your-project-id.iam.gserviceaccount.com`）

### カレンダーを共有:

1. **Google Calendarを開く**
   https://calendar.google.com

2. **設定（歯車アイコン）→「設定」**

3. **左メニューから共有したいカレンダーを選択**

4. **「特定のユーザーまたはグループと共有」**

5. **「ユーザーやグループを追加」**
   - サービスアカウントのメールアドレスを入力
   - 権限: 「予定の変更」または「閲覧権限（すべての予定の詳細）」

6. **「送信」をクリック**

## ステップ5: 環境変数として設定

JSONファイルの内容を1行にして環境変数に設定します。

### コマンド:
```bash
# JSONファイルの内容を1行に変換してクリップボードにコピー
cat service-account-key.json | jq -c . | pbcopy

# または手動でJSONを1行に変換して、以下のコマンドで設定
vercel env add GOOGLE_SERVICE_ACCOUNT_KEY production
```

## ステップ6: このファイルに記入してください

以下の情報を記入してください：

```
サービスアカウントのメールアドレス:
（例: calendar-sync-service@your-project-id.iam.gserviceaccount.com）

JSONキーファイルの内容（1行に変換済み）:
（ここに貼り付け）
```

記入が完了したら、環境変数に設定します。