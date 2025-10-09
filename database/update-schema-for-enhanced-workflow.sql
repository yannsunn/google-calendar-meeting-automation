-- 拡張ワークフロー用のスキーマ更新SQL
-- Supabase SQL Editorで実行してください

-- ========================================
-- 1. calendar_events テーブルに新しいカラムを追加
-- ========================================

-- 外部参加者情報を保存
ALTER TABLE public.calendar_events
ADD COLUMN IF NOT EXISTS external_attendees JSONB DEFAULT '[]'::JSONB;

-- 外部参加者の有無フラグ
ALTER TABLE public.calendar_events
ADD COLUMN IF NOT EXISTS has_external_attendees BOOLEAN DEFAULT FALSE;

-- 外部参加者の数
ALTER TABLE public.calendar_events
ADD COLUMN IF NOT EXISTS external_count INTEGER DEFAULT 0;

-- 会議の期間（分）
ALTER TABLE public.calendar_events
ADD COLUMN IF NOT EXISTS duration_minutes INTEGER;

-- 重要会議フラグ（30分以上 & 外部参加者あり）
ALTER TABLE public.calendar_events
ADD COLUMN IF NOT EXISTS is_important BOOLEAN DEFAULT FALSE;

-- 主催者メール
ALTER TABLE public.calendar_events
ADD COLUMN IF NOT EXISTS organizer_email TEXT;

-- 会議ステータス
ALTER TABLE public.calendar_events
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'confirmed';

-- インデックス追加
CREATE INDEX IF NOT EXISTS idx_calendar_events_external ON public.calendar_events(has_external_attendees);
CREATE INDEX IF NOT EXISTS idx_calendar_events_important ON public.calendar_events(is_important);

-- ========================================
-- 2. proposals テーブルを更新（N8Nワークフロー用）
-- ========================================

-- 既存のproposalsテーブルを削除して再作成（構造が違う場合）
DROP TABLE IF EXISTS public.proposals CASCADE;

-- 新しいproposalsテーブル作成
CREATE TABLE public.proposals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id TEXT NOT NULL,
  company_domain TEXT NOT NULL,
  company_name TEXT,
  company_analysis TEXT,
  proposal_content TEXT,
  search_results JSONB,
  status TEXT DEFAULT 'generated',
  generated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- インデックス作成
CREATE INDEX IF NOT EXISTS idx_proposals_event_id ON public.proposals(event_id);
CREATE INDEX IF NOT EXISTS idx_proposals_company_domain ON public.proposals(company_domain);
CREATE INDEX IF NOT EXISTS idx_proposals_status ON public.proposals(status);
CREATE INDEX IF NOT EXISTS idx_proposals_generated_at ON public.proposals(generated_at DESC);

-- RLS有効化
ALTER TABLE public.proposals ENABLE ROW LEVEL SECURITY;

-- ポリシー作成
CREATE POLICY "Service role has full access" ON public.proposals
    FOR ALL
    USING (auth.role() = 'service_role');

CREATE POLICY "Allow public read access" ON public.proposals
    FOR SELECT
    USING (true);

CREATE POLICY "Allow public insert access" ON public.proposals
    FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Allow public update access" ON public.proposals
    FOR UPDATE
    USING (true);

-- 自動更新トリガー
CREATE TRIGGER update_proposals_updated_at
BEFORE UPDATE ON public.proposals
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 権限付与
GRANT ALL ON public.proposals TO service_role;
GRANT SELECT, INSERT, UPDATE ON public.proposals TO anon;

-- ========================================
-- 3. 統計ビューの作成（ダッシュボード用）
-- ========================================

-- 会議統計ビュー
CREATE OR REPLACE VIEW public.meeting_stats AS
SELECT
  COUNT(*) as total_meetings,
  COUNT(*) FILTER (WHERE has_external_attendees = true) as external_meetings,
  COUNT(*) FILTER (WHERE is_important = true) as important_meetings,
  COUNT(DISTINCT CASE
    WHEN external_attendees IS NOT NULL
    THEN jsonb_array_elements(external_attendees)->>'domain'
  END) as unique_companies,
  DATE_TRUNC('day', start_time) as meeting_date
FROM public.calendar_events
WHERE start_time >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY DATE_TRUNC('day', start_time);

-- 提案統計ビュー
CREATE OR REPLACE VIEW public.proposal_stats AS
SELECT
  COUNT(*) as total_proposals,
  COUNT(DISTINCT company_domain) as unique_companies,
  COUNT(*) FILTER (WHERE status = 'generated') as generated_proposals,
  DATE_TRUNC('day', generated_at) as proposal_date
FROM public.proposals
WHERE generated_at >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY DATE_TRUNC('day', generated_at);

-- ビューへのアクセス権限
GRANT SELECT ON public.meeting_stats TO anon;
GRANT SELECT ON public.proposal_stats TO anon;

-- ========================================
-- 4. サンプルデータの挿入（テスト用）
-- ========================================

-- サンプルカレンダーイベント（コメントアウト - 必要に応じて有効化）
/*
INSERT INTO public.calendar_events (
  event_id,
  summary,
  description,
  start_time,
  end_time,
  attendees,
  external_attendees,
  has_external_attendees,
  external_count,
  duration_minutes,
  is_important,
  organizer_email,
  status
) VALUES (
  'test-event-001',
  '株式会社テスト様との打ち合わせ',
  '新規AI導入の相談',
  NOW() + INTERVAL '1 day',
  NOW() + INTERVAL '1 day 1 hour',
  '[{"email": "test@example.com", "name": "Test User"}]'::JSONB,
  '[{"email": "client@testcompany.co.jp", "name": "クライアント", "domain": "testcompany.co.jp"}]'::JSONB,
  true,
  1,
  60,
  true,
  'organizer@gmail.com',
  'confirmed'
) ON CONFLICT (event_id) DO NOTHING;
*/

-- ========================================
-- 5. 確認クエリ
-- ========================================

-- テーブル構造確認
SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'calendar_events'
ORDER BY ordinal_position;

-- 既存データ確認
SELECT
  COUNT(*) as total_events,
  COUNT(*) FILTER (WHERE has_external_attendees = true) as events_with_external
FROM public.calendar_events;

-- proposals テーブル確認
SELECT COUNT(*) as total_proposals FROM public.proposals;

-- ========================================
-- 完了!
-- ========================================

-- 実行後、以下を確認してください:
-- 1. calendar_events テーブルに新しいカラムが追加されている
-- 2. proposals テーブルが作成されている
-- 3. インデックスが作成されている
-- 4. RLSポリシーが設定されている
-- 5. ビューが作成されている
