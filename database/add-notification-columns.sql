-- カレンダー通知システムに必要なカラムを追加

-- calendar_eventsテーブルに新しいカラムを追加
ALTER TABLE calendar_events
ADD COLUMN IF NOT EXISTS company_name TEXT,
ADD COLUMN IF NOT EXISTS proposal_status TEXT DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS company_urls TEXT DEFAULT '';

-- proposalsテーブルにcompany_urlsカラムを追加（存在しない場合）
ALTER TABLE proposals
ADD COLUMN IF NOT EXISTS company_urls TEXT DEFAULT '';

-- インデックスを作成（パフォーマンス向上）
CREATE INDEX IF NOT EXISTS idx_calendar_events_company_name ON calendar_events(company_name);
CREATE INDEX IF NOT EXISTS idx_calendar_events_proposal_status ON calendar_events(proposal_status);
CREATE INDEX IF NOT EXISTS idx_calendar_events_has_external ON calendar_events(has_external_attendees);

-- コメントを追加
COMMENT ON COLUMN calendar_events.company_name IS '会議タイトルから抽出された企業名';
COMMENT ON COLUMN calendar_events.proposal_status IS '提案資料の状態: pending, generating, generated';
COMMENT ON COLUMN calendar_events.company_urls IS 'ユーザーが入力した企業URL（複数可）';

COMMENT ON COLUMN proposals.company_urls IS 'AI分析に使用した企業URL';

-- 確認用クエリ
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'calendar_events'
ORDER BY ordinal_position;
