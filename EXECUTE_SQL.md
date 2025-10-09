# 📋 スキーマ更新SQL実行手順

## 🔗 Supabase SQL Editor を開く

以下のURLをブラウザで開いてください:

**https://supabase.com/dashboard/project/dpqsipbppdemgfwuihjr/sql/new**

---

## 📝 実行手順

### ステップ1: SQLファイルを開く

ファイルパス:
```
C:\Users\march\Googleカレンダータスク通知\database\update-schema-for-enhanced-workflow.sql
```

### ステップ2: SQLをコピー

上記ファイルの内容をすべてコピーしてください

### ステップ3: SQL Editorに貼り付け

1. ブラウザでSupabase SQL Editorを開く
2. エディタ内にSQLを貼り付け
3. 右下の **"Run"** ボタンをクリック

---

## ✅ 実行結果の確認

実行が成功すると、以下の変更が適用されます:

### 1. calendar_events テーブル
- ✅ `external_attendees` (JSONB) - 外部参加者情報
- ✅ `has_external_attendees` (BOOLEAN) - 外部参加者の有無
- ✅ `external_count` (INTEGER) - 外部参加者の数
- ✅ `duration_minutes` (INTEGER) - 会議の期間
- ✅ `is_important` (BOOLEAN) - 重要会議フラグ
- ✅ `organizer_email` (TEXT) - 主催者メール
- ✅ `status` (TEXT) - 会議ステータス

### 2. proposals テーブル (新規作成)
- ✅ `id` (UUID) - プライマリキー
- ✅ `event_id` (TEXT) - イベントID
- ✅ `company_domain` (TEXT) - 企業ドメイン
- ✅ `company_name` (TEXT) - 企業名
- ✅ `company_analysis` (TEXT) - 企業分析結果
- ✅ `proposal_content` (TEXT) - 提案内容
- ✅ `search_results` (JSONB) - 検索結果
- ✅ `status` (TEXT) - ステータス

### 3. ビュー
- ✅ `meeting_stats` - 会議統計ビュー
- ✅ `proposal_stats` - 提案統計ビュー

### 4. その他
- ✅ インデックス作成
- ✅ RLSポリシー設定
- ✅ アクセス権限設定

---

## 🔍 エラーが発生した場合

### エラー例1: `update_updated_at_column` 関数が存在しない

以下のSQLを先に実行してください:

```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

### エラー例2: テーブルが既に存在する

問題ありません。`IF NOT EXISTS` や `OR REPLACE` が使用されているため、既存のテーブルには影響しません。

---

## 📞 サポート

実行中にエラーが発生した場合は、エラーメッセージをコピーして共有してください。

