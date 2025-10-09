-- 拡張ワークフロー用のスキーマ更新SQL（修正版）
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
-- 2. proposals テーブルを作成（N8Nワークフロー用）
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
DROP POLICY IF EXISTS "Service role has full access" ON public.proposals;
DROP POLICY IF EXISTS "Allow public read access" ON public.proposals;
DROP POLICY IF EXISTS "Allow public insert access" ON public.proposals;
DROP POLICY IF EXISTS "Allow public update access" ON public.proposals;

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

-- 自動更新トリガー（update_updated_at_column関数が存在する場合のみ）
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_proc WHERE proname = 'update_updated_at_column'
  ) THEN
    DROP TRIGGER IF EXISTS update_proposals_updated_at ON public.proposals;
    CREATE TRIGGER update_proposals_updated_at
    BEFORE UPDATE ON public.proposals
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

-- 権限付与
GRANT ALL ON public.proposals TO service_role;
GRANT SELECT, INSERT, UPDATE ON public.proposals TO anon;
GRANT SELECT, INSERT, UPDATE ON public.proposals TO authenticated;

-- ========================================
-- 3. 統計ビューの作成（ダッシュボード用）- 修正版
-- ========================================

-- 既存ビュー削除
DROP VIEW IF EXISTS public.meeting_stats;
DROP VIEW IF EXISTS public.proposal_stats;

-- 会議統計ビュー（修正版 - LATERAL JOINを使用）
CREATE OR REPLACE VIEW public.meeting_stats AS
SELECT
  DATE_TRUNC('day', start_time) as meeting_date,
  COUNT(*) as total_meetings,
  COUNT(*) FILTER (WHERE has_external_attendees = true) as external_meetings,
  COUNT(*) FILTER (WHERE is_important = true) as important_meetings
FROM public.calendar_events
WHERE start_time >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY DATE_TRUNC('day', start_time);

-- 提案統計ビュー
CREATE OR REPLACE VIEW public.proposal_stats AS
SELECT
  DATE_TRUNC('day', generated_at) as proposal_date,
  COUNT(*) as total_proposals,
  COUNT(DISTINCT company_domain) as unique_companies,
  COUNT(*) FILTER (WHERE status = 'generated') as generated_proposals
FROM public.proposals
WHERE generated_at >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY DATE_TRUNC('day', generated_at);

-- ビューへのアクセス権限
GRANT SELECT ON public.meeting_stats TO anon;
GRANT SELECT ON public.proposal_stats TO anon;
GRANT SELECT ON public.meeting_stats TO authenticated;
GRANT SELECT ON public.proposal_stats TO authenticated;

-- ========================================
-- 4. 確認クエリ
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
-- 完了メッセージ
-- ========================================

DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ スキーマ更新完了!';
  RAISE NOTICE '========================================';
  RAISE NOTICE '1. calendar_events テーブルに新しいカラムを追加しました';
  RAISE NOTICE '2. proposals テーブルを作成しました';
  RAISE NOTICE '3. インデックスを作成しました';
  RAISE NOTICE '4. RLSポリシーを設定しました';
  RAISE NOTICE '5. 統計ビューを作成しました';
  RAISE NOTICE '========================================';
END $$;
