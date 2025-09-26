# 🔐 必要な環境変数リスト

## Vercel環境変数設定ガイド

以下の環境変数を**必ず**Vercelプロジェクトに設定してください：
https://vercel.com/yasuus-projects/calendar/settings/environment-variables

### 1. Google Calendar API関連
```
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_REDIRECT_URI=https://web-msfum28eo-yasuus-projects.vercel.app/api/auth/callback/google
GOOGLE_REFRESH_TOKEN=your-google-refresh-token
GOOGLE_ACCESS_TOKEN=your-google-access-token
```

### 2. Supabase関連
```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
```

### 3. N8N関連
```
N8N_URL=https://n8n.srv946785.hstgr.cloud
N8N_API_KEY=your-n8n-api-key
N8N_WEBHOOK_BASE_URL=https://n8n.srv946785.hstgr.cloud/webhook
```

### 4. アプリケーション設定
```
NEXT_PUBLIC_API_URL=/api
NEXT_PUBLIC_WEBSOCKET_URL=wss://your-websocket-url
NEXT_PUBLIC_N8N_URL=https://n8n.srv946785.hstgr.cloud
```

### 5. Cron Job関連
```
CRON_SECRET=your-secure-random-string-here
```

### 6. その他（オプション）
```
GEMINI_API_KEY=your-gemini-api-key
DATABASE_URL=postgresql://user:password@localhost:5432/meeting_automation
NODE_ENV=production
```

## 🚨 重要な注意事項

1. **vercel.json内の参照シークレット**
   以下のシークレットも設定が必要です（@記号で参照）：
   - `n8n_url` → N8N_URLと同じ値
   - `api_url` → NEXT_PUBLIC_API_URLと同じ値
   - `websocket_url` → NEXT_PUBLIC_WEBSOCKET_URLと同じ値

2. **Google認証トークンの取得方法**
   ```bash
   cd web
   node setup-google-auth.js
   ```
   表示されるURLでGoogleにログインし、取得したトークンを環境変数に設定

3. **Supabaseテーブルの作成**
   ```sql
   CREATE TABLE calendar_events (
     id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
     event_id text UNIQUE NOT NULL,
     summary text,
     description text,
     start_time timestamp,
     end_time timestamp,
     location text,
     meeting_url text,
     attendees jsonb,
     raw_data jsonb,
     synced_at timestamp DEFAULT now(),
     created_at timestamp DEFAULT now(),
     updated_at timestamp DEFAULT now()
   );
   ```

## 設定確認方法

1. Vercelダッシュボードで環境変数が設定されているか確認
2. デプロイログでエラーがないか確認
3. 以下のエンドポイントをテスト：
   - `GET /api/calendar/sync` - カレンダー同期テスト
   - `POST /api/calendar/auto-sync` - 自動同期テスト
   - `GET /api/cron/sync-calendar` - Cronジョブテスト

## トラブルシューティング

### "Environment Variable references Secret which does not exist"エラー
→ Vercelのシークレット設定で、@記号の参照先を作成

### "invalid_grant"エラー
→ Google認証トークンの再取得が必要

### ビルドエラー "syncCalendarEvents is not a valid Route export"
→ 最新のコードがデプロイされていることを確認

---
⚠️ このファイルは環境変数のリファレンスとして保管してください。
実際の値はGitにコミットしないでください。