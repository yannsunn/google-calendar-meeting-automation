# 📅 Google Calendar同期 - 実行手順

## 🎯 実行する手順（本番環境用）

### ステップ 1: Google Calendar認証を設定

```bash
cd web
npm run setup-calendar
```

**実行後の動作:**
1. ブラウザで開くURLが表示されます
2. URLをブラウザで開き、Googleアカウントでログイン
3. 「yannsunn1116@gmail.com」でログイン
4. カレンダーへのアクセスを許可
5. 表示されたコード（4/0で始まる文字列）をコピー
6. ターミナルに戻ってコードを貼り付けてEnter

### ステップ 2: カレンダーデータをSupabaseに同期

```bash
npm run sync-calendar
```

**実行結果:**
- 今日から7日間の会議データをGoogle Calendarから取得
- Supabaseのcalendar_eventsテーブルに保存
- 15分未満の短い会議は自動的にスキップ

### ステップ 3: 本番環境の環境変数を更新

1. Vercelダッシュボードにアクセス
2. Settings → Environment Variables
3. 以下の環境変数を追加/更新：

```bash
GOOGLE_ACCESS_TOKEN=[生成されたアクセストークン]
GOOGLE_REFRESH_TOKEN=[生成されたリフレッシュトークン]
```

**重要:** `.env.local`ファイルに自動保存されたトークンをコピー

### ステップ 4: 本番環境にデプロイ

```bash
git add .
git commit -m "Add Google Calendar sync functionality"
git push origin main
```

### ステップ 5: 本番環境で確認

https://calendar-yasuus-projects.vercel.app/proposals

## 🔧 トラブルシューティング

### エラー: "invalid_grant"
**原因:** トークンが期限切れ
**解決:** `npm run setup-calendar` を再実行

### エラー: "Cannot find module"
**原因:** パッケージ未インストール
**解決:** `npm install`

### データが表示されない
**原因:** 同期されていない
**解決:** `npm run sync-calendar` を実行

## 📊 同期されるデータ

### 含まれる会議:
- 15分以上の会議
- 今日から7日間の予定
- 外部参加者がいる会議を優先

### 除外される会議:
- 15分未満の短い会議
- 終日イベント
- プライベートな予定

## 🔄 定期同期（オプション）

手動で定期的に同期する場合：
```bash
npm run sync-calendar
```

推奨: 1日1回実行

## 📝 データ構造

Supabaseのcalendar_eventsテーブルに以下の形式で保存:

- event_id: ユニークID
- summary: 会議タイトル
- company_name: 会社名（自動推定）
- start_time/end_time: 開始/終了時刻
- duration_minutes: 会議時間（分）
- attendees: 参加者リスト
- external_attendees: 外部参加者
- is_important: 重要度フラグ
- proposal_status: 提案状態（初期値: pending）

---

**作成日:** 2025-10-25
**プロジェクト:** Googleカレンダータスク通知システム