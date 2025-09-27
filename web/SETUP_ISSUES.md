# 🔧 システム設定の問題と解決方法

## 現在の問題

### 1. ❌ calendar_eventsテーブルが存在しない
**症状**: カレンダーイベントがUIに表示されない
**エラー**: `Could not find the table 'public.calendar_events' in the schema cache`

**解決方法**:
1. Supabaseダッシュボードにログイン: https://supabase.com/dashboard
2. プロジェクトを選択
3. 左メニューから「SQL Editor」を選択
4. 以下のSQLを実行:

```sql
-- Calendar events table creation
CREATE TABLE IF NOT EXISTS public.calendar_events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    event_id TEXT UNIQUE NOT NULL,
    summary TEXT,
    description TEXT,
    start_time TIMESTAMPTZ,
    end_time TIMESTAMPTZ,
    location TEXT,
    meeting_url TEXT,
    attendees JSONB DEFAULT '[]'::JSONB,
    raw_data JSONB,
    synced_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_calendar_events_start_time ON public.calendar_events(start_time);
CREATE INDEX IF NOT EXISTS idx_calendar_events_event_id ON public.calendar_events(event_id);
```

### 2. ❌ N8N_API_KEYに改行文字が含まれている
**症状**: N8Nワークフローが動作しない
**エラー**: `Invalid character in header content ["X-N8N-API-KEY"]`

**解決方法**:
```bash
# 1. 現在のキーを削除
vercel env rm N8N_API_KEY production

# 2. 改行なしで再設定（printfを使用）
printf "your-n8n-api-key-here" | vercel env add N8N_API_KEY production
```

### 3. ⚠️ その他の環境変数の改行文字
以下の環境変数にも改行が含まれている可能性があります：
- CRON_SECRET
- GOOGLE_ACCESS_TOKEN
- GOOGLE_REFRESH_TOKEN
- JWT_SECRET
- SESSION_SECRET

## 📋 確認手順

### ステップ1: Supabaseテーブルを作成
```bash
# Supabaseダッシュボードで上記のSQLを実行
```

### ステップ2: 環境変数をクリーンアップ
```bash
# N8N_API_KEYを修正
printf "YOUR_N8N_API_KEY" | vercel env add N8N_API_KEY production

# その他の環境変数も必要に応じて修正
```

### ステップ3: デプロイして確認
```bash
vercel --prod
```

### ステップ4: 動作確認
1. カレンダー同期: https://your-app.vercel.app/api/calendar/auto-sync
2. イベント表示: https://your-app.vercel.app/api/calendar/events
3. N8Nワークフロー: https://your-app.vercel.app/api/n8n/workflows

## 🎯 期待される結果

1. **カレンダーイベント**: 33個のイベントがUIに表示される
2. **N8Nワークフロー**: ワークフロー一覧が表示される
3. **エラーなし**: コンソールにエラーが表示されない

## 🚀 クイックフィックス

最も簡単な解決方法:

1. **Supabaseダッシュボード**で`calendar_events`テーブルを作成
2. **N8N_API_KEY**を改行なしで再設定
3. **デプロイ**して動作確認

これらの修正後、システムは正常に動作するはずです。