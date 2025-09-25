-- Supabaseでテーブルを作成するSQL
-- Supabase SQL Editorで実行してください

-- UUID拡張を有効化
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- meetings テーブル
CREATE TABLE IF NOT EXISTS meetings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  google_event_id VARCHAR(255) UNIQUE NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE NOT NULL,
  location VARCHAR(255),
  meeting_url VARCHAR(255),
  organizer_email VARCHAR(255),
  status VARCHAR(50) DEFAULT 'scheduled',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- attendees テーブル
CREATE TABLE IF NOT EXISTS attendees (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  meeting_id UUID REFERENCES meetings(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  name VARCHAR(255),
  company_id UUID,
  is_external BOOLEAN DEFAULT FALSE,
  is_organizer BOOLEAN DEFAULT FALSE,
  response_status VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(meeting_id, email)
);

-- calendar_events テーブル
CREATE TABLE IF NOT EXISTS calendar_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id VARCHAR(255) UNIQUE NOT NULL,
  summary VARCHAR(255),
  description TEXT,
  start_time TIMESTAMP WITH TIME ZONE,
  end_time TIMESTAMP WITH TIME ZONE,
  location VARCHAR(255),
  meeting_url VARCHAR(255),
  attendees JSONB,
  raw_data JSONB,
  synced_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- proposals テーブル（提案管理用）
CREATE TABLE IF NOT EXISTS proposals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  meeting_id UUID REFERENCES meetings(id) ON DELETE CASCADE,
  title VARCHAR(255),
  description TEXT,
  status VARCHAR(50) DEFAULT 'draft',
  presentation_url VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- companies テーブル（会社情報）
CREATE TABLE IF NOT EXISTS companies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  domain VARCHAR(255),
  industry VARCHAR(255),
  size VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- インデックスの作成
CREATE INDEX IF NOT EXISTS idx_meetings_start_time ON meetings(start_time);
CREATE INDEX IF NOT EXISTS idx_meetings_google_event_id ON meetings(google_event_id);
CREATE INDEX IF NOT EXISTS idx_attendees_email ON attendees(email);
CREATE INDEX IF NOT EXISTS idx_calendar_events_event_id ON calendar_events(event_id);
CREATE INDEX IF NOT EXISTS idx_calendar_events_start_time ON calendar_events(start_time);

-- Row Level Security (RLS) を有効化（オプション）
ALTER TABLE meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendees ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;

-- すべてのユーザーに読み取りアクセスを許可（開発環境用）
CREATE POLICY "Allow public read access" ON meetings FOR SELECT USING (true);
CREATE POLICY "Allow public read access" ON attendees FOR SELECT USING (true);
CREATE POLICY "Allow public read access" ON calendar_events FOR SELECT USING (true);
CREATE POLICY "Allow public read access" ON proposals FOR SELECT USING (true);
CREATE POLICY "Allow public read access" ON companies FOR SELECT USING (true);

-- すべてのユーザーに書き込みアクセスを許可（開発環境用）
CREATE POLICY "Allow public insert access" ON meetings FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public insert access" ON attendees FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public insert access" ON calendar_events FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public insert access" ON proposals FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public insert access" ON companies FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public update access" ON meetings FOR UPDATE USING (true);
CREATE POLICY "Allow public update access" ON attendees FOR UPDATE USING (true);
CREATE POLICY "Allow public update access" ON calendar_events FOR UPDATE USING (true);
CREATE POLICY "Allow public update access" ON proposals FOR UPDATE USING (true);
CREATE POLICY "Allow public update access" ON companies FOR UPDATE USING (true);

CREATE POLICY "Allow public delete access" ON meetings FOR DELETE USING (true);
CREATE POLICY "Allow public delete access" ON attendees FOR DELETE USING (true);
CREATE POLICY "Allow public delete access" ON calendar_events FOR DELETE USING (true);
CREATE POLICY "Allow public delete access" ON proposals FOR DELETE USING (true);
CREATE POLICY "Allow public delete access" ON companies FOR DELETE USING (true);