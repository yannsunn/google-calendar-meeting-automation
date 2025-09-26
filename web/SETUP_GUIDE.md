# 🚀 カレンダー同期セットアップガイド

## 1. Vercelで環境変数を追加

1. [Vercelダッシュボード](https://vercel.com/yasuus-projects/web/settings/environment-variables)にアクセス
2. 以下の環境変数を追加：
   ```
   CRON_SECRET=your-secret-key-here-123456
   ```

## 2. Google認証トークンを更新（必要な場合）

ローカルで実行：
```bash
cd web
node setup-google-auth.js
```

1. 表示されるURLをブラウザで開く
2. Googleアカウントでログイン
3. 表示される認証コードをコピー
4. ターミナルに貼り付け

生成された新しいトークンをVercelに追加：
- `GOOGLE_ACCESS_TOKEN`
- `GOOGLE_REFRESH_TOKEN`

## 3. 動作確認

### 方法1: UIから手動同期
1. https://web-fnjm8qeyq-yasuus-projects.vercel.app にアクセス
2. 「カレンダーを同期」ボタンをクリック
3. エラーが出る場合は、ブラウザの開発者ツール（F12）でエラーを確認

### 方法2: Cron URLを直接テスト
```bash
curl https://web-fnjm8qeyq-yasuus-projects.vercel.app/api/cron/sync-calendar
```

### 方法3: N8Nワークフローを使用
1. [N8Nダッシュボード](https://n8n.srv946785.hstgr.cloud)にアクセス
2. ワークフロー「Google Calendar 自動同期 - 1週間分」を開く
3. アクティベートして手動実行

## 4. トラブルシューティング

### エラー: "invalid_grant"
→ Google認証トークンの再取得が必要（手順2を実行）

### エラー: "Unauthorized"
→ CRON_SECRET環境変数が設定されていない

### エラー: "Supabase connection failed"
→ Supabaseのテーブルが作成されていない
```bash
# Supabaseダッシュボードで実行
cat create-supabase-tables.sql
```

## 5. 自動同期の確認

Vercelのcronジョブは1時間ごとに実行されます。
Functions タブで実行ログを確認できます：
https://vercel.com/yasuus-projects/web/functions