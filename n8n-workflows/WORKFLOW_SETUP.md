# 📊 拡張版カレンダー同期ワークフロー セットアップガイド

## 🎯 概要

既存のカレンダー同期ワークフローを拡張して、以下の全機能を1つのワークフローに統合しました：

1. ✅ Google Calendarからイベント取得
2. ✅ 外部参加者の自動判定
3. ✅ Supabaseへの保存
4. ✅ 企業情報の自動収集（Web検索）
5. ✅ Gemini AIによる企業分析
6. ✅ Gemini Proによる提案資料生成
7. ✅ 提案のデータベース保存

---

## 🔧 セットアップ手順

### Step 1: N8Nワークフローの更新

1. **N8N管理画面にアクセス**
   ```
   https://n8n.srv946785.hstgr.cloud/workflow/sQBFAm3od5U20PHG
   ```

2. **既存ワークフローをバックアップ**
   - 右上の「...」メニュー → Export Workflow

3. **新しいワークフローをインポート**
   - 画面右上の「...」メニュー → Import from File
   - `enhanced-calendar-sync.json` を選択

4. **ワークフローを保存**
   - 画面右上の「Save」ボタンをクリック

---

## 🔑 必要な環境変数

N8N Settings → Variables に以下を追加してください：

### 既存の環境変数（確認のみ）
```bash
GOOGLE_ACCESS_TOKEN=<your-google-oauth-access-token>
```

> **注意**: 実際のアクセストークンはN8N Settings → Variablesで設定してください。

### 新規追加が必要な環境変数

#### 1. Serper API（Web検索用）
```bash
SERPER_API_KEY=取得したAPIキー
```

**取得方法:**
- https://serper.dev にアクセス
- Sign Up → API Keys → Create New Key
- 無料プラン: 2,500リクエスト/月

#### 2. Gemini API（既に設定済みの場合はスキップ）
```bash
GEMINI_API_KEY=AIzaSyCsS0hCzYk_ISXO4uzlU91Iz6eOfkLozss
```

---

## 📁 データベーススキーマの確認

### 1. `calendar_events` テーブル

既存のテーブルに以下のカラムを追加（未追加の場合）:

```sql
ALTER TABLE calendar_events ADD COLUMN IF NOT EXISTS external_attendees JSONB;
ALTER TABLE calendar_events ADD COLUMN IF NOT EXISTS has_external_attendees BOOLEAN DEFAULT FALSE;
ALTER TABLE calendar_events ADD COLUMN IF NOT EXISTS external_count INTEGER DEFAULT 0;
ALTER TABLE calendar_events ADD COLUMN IF NOT EXISTS duration_minutes INTEGER;
ALTER TABLE calendar_events ADD COLUMN IF NOT EXISTS is_important BOOLEAN DEFAULT FALSE;
```

### 2. `proposals` テーブル（新規作成が必要な場合）

```sql
CREATE TABLE IF NOT EXISTS proposals (
  id BIGSERIAL PRIMARY KEY,
  event_id TEXT NOT NULL,
  company_domain TEXT NOT NULL,
  company_name TEXT,
  company_analysis TEXT,
  proposal_content TEXT,
  search_results JSONB,
  status TEXT DEFAULT 'generated',
  generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- インデックス作成
CREATE INDEX IF NOT EXISTS idx_proposals_event_id ON proposals(event_id);
CREATE INDEX IF NOT EXISTS idx_proposals_company_domain ON proposals(company_domain);
CREATE INDEX IF NOT EXISTS idx_proposals_status ON proposals(status);
```

---

## 🚀 ワークフローの動作確認

### テスト実行

1. **N8Nワークフロー画面で「Execute Workflow」をクリック**

2. **正常に動作する場合:**
   - Google Calendarからイベント取得 ✅
   - 外部参加者を判定 ✅
   - Supabaseに保存 ✅
   - 外部参加者がいる場合:
     - Web検索実行 ✅
     - Gemini企業分析 ✅
     - Gemini Pro提案生成 ✅
     - 提案をSupabaseに保存 ✅

3. **ログ確認:**
   - 画面下部の Executions タブで結果を確認
   - 各ノードの出力データを確認

---

## ⚙️ ワークフローの設定変更

### スケジュール変更

デフォルト: **1時間ごと**

変更する場合:
1. 「1時間ごとに実行」ノードをクリック
2. Interval → 任意の間隔に変更（例: 30分、6時間など）

### 社内ドメインの変更

デフォルト: `['gmail.com', 'googlemail.com', 'yasuus-projects.vercel.app']`

変更する場合:
1. 「データ整形 + 外部参加者判定」ノードをクリック
2. コード内の `internalDomains` 配列を編集

---

## 🔍 トラブルシューティング

### エラー: "SERPER_API_KEY is not defined"
→ N8N Settings → Variables で `SERPER_API_KEY` を追加

### エラー: "Table 'proposals' does not exist"
→ Supabaseで `proposals` テーブルを作成（上記SQLを実行）

### エラー: "Gemini API quota exceeded"
→ Gemini APIの利用制限を確認
→ 別のAPIキーを使用するか、翌日まで待機

### Web検索が失敗する
→ Serper APIの無料枠を確認（2,500リクエスト/月）
→ 必要に応じて有料プランにアップグレード

---

## 📊 ワークフローのフロー図

```
1時間ごとに実行
    ↓
Google Calendar取得
    ↓
データ整形 + 外部参加者判定
    ↓
Supabaseに保存
    ↓
外部参加者チェック
    ├─→ YES → 企業ドメイン抽出
    │           ↓
    │        Web検索 (Serper)
    │           ↓
    │        Gemini企業分析
    │           ↓
    │        Gemini Pro提案生成
    │           ↓
    │        提案データ整形
    │           ↓
    │        提案をSupabaseに保存
    │           ↓
    │        実行結果
    │
    └─→ NO → 外部参加者なし → 実行結果
```

---

## 📝 次のステップ

1. ✅ ワークフローのインポート
2. ✅ 環境変数の設定
3. ✅ データベーススキーマの確認
4. ⏳ テスト実行
5. ⏳ フロントエンドとの連携確認
6. ⏳ Google Slides統合の追加（オプション）

---

## 💡 今後の拡張案

### Google Slides統合
- 提案資料を自動的にGoogle Slidesで作成
- テンプレートベースのプレゼン生成

### WebSocket通知
- 提案生成完了時にリアルタイム通知
- フロントエンドへの即時反映

### PDFエクスポート
- 生成された提案をPDF形式でエクスポート
- メール送信機能

---

## ✅ 完了確認チェックリスト

- [ ] N8Nワークフローをインポート済み
- [ ] SERPER_API_KEY を設定済み
- [ ] GEMINI_API_KEY を設定済み
- [ ] `calendar_events` テーブルを更新済み
- [ ] `proposals` テーブルを作成済み
- [ ] テスト実行が成功
- [ ] フロントエンドで提案が表示される

---

お疲れさまでした!これで全機能が1つのワークフローに統合されました 🎉
