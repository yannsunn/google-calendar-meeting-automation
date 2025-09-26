# 📅 カレンダーアクセス権限設定ガイド

サービスアカウントにカレンダーへのアクセス権限を付与する方法を説明します。

## 🚀 クイックスタート（推奨）

### 方法1: OAuth Playground を使用（最も簡単）

1. **OAuth Playground を開く**
   - https://developers.google.com/oauthplayground/

2. **Google Calendar API を選択**
   - 左側のAPIリストから `Google Calendar API v3` を探す
   - `https://www.googleapis.com/auth/calendar.acls` にチェック

3. **認証**
   - `Authorize APIs` ボタンをクリック
   - Googleアカウントでログイン（カレンダーの所有者アカウント）

4. **トークンを取得**
   - `Exchange authorization code for tokens` をクリック
   - 表示される `Access token` をコピー

5. **スクリプトを実行**
   ```bash
   ./setup-calendar-access-simple.sh
   ```
   - アクセストークンを貼り付け
   - カレンダーID入力（空の場合は primary）

## 📝 手動設定（GUI使用）

最も確実な方法です：

1. **Google Calendar を開く**
   - https://calendar.google.com

2. **設定を開く**
   - 右上の歯車アイコン → 「設定」

3. **カレンダーを選択**
   - 左メニューから共有したいカレンダーを選択

4. **共有設定**
   - 「特定のユーザーまたはグループと共有」セクション
   - 「ユーザーやグループを追加」をクリック

5. **サービスアカウントを追加**
   - メールアドレス: `calendar-sync-service@amazon-457206.iam.gserviceaccount.com`
   - 権限: 「閲覧権限（すべての予定の詳細）」を選択

6. **送信**
   - 「送信」ボタンをクリック

## 🔧 利用可能なスクリプト

### 1. `setup-calendar-access-simple.sh`
- **最も簡単**: OAuth Playgroundで取得したトークンを使用
- 追加のライブラリ不要

### 2. `setup-calendar-permissions.js`
- Node.js版（npmパッケージが必要）
- OAuth認証フロー込み

### 3. `grant-calendar-access.py`
- Python版（google-api-python-clientが必要）
- 複数の認証方法をサポート

## ✅ 設定確認

設定が完了したら、以下のコマンドで動作確認：

```bash
curl https://web-fnjm8qeyq-yasuus-projects.vercel.app/api/calendar/auto-sync
```

成功すると以下のようなレスポンスが返ります：
```json
{
  "success": true,
  "eventsCount": 5,  // 取得したイベント数
  "savedCount": 5,   // 保存したイベント数
  "lastSync": "2025-09-27T..."
}
```

## ❓ トラブルシューティング

### エラー: `eventsCount: 0`
- カレンダーへのアクセス権限が設定されていない
- カレンダーIDが間違っている
- カレンダーに今後7日間のイベントがない

### エラー: `invalid_grant`
- アクセストークンが期限切れ
- 新しいトークンを取得してやり直す

### エラー: `already exists`
- 既にアクセス権限が設定済み
- これは問題ありません

## 📧 サービスアカウント情報

- **メールアドレス**: `calendar-sync-service@amazon-457206.iam.gserviceaccount.com`
- **プロジェクトID**: `amazon-457206`
- **必要な権限**: カレンダーの読み取り権限

## 🎯 次のステップ

権限設定が完了したら：

1. Vercel上でカレンダー同期をテスト
2. Cron設定で自動同期を確認
3. Supabaseでイベントデータを確認