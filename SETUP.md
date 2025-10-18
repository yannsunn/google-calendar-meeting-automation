# 📋 セットアップガイド

このシステムは**ほぼ完全に自動化**されています。以下の3ステップで完了します。

## ✅ ステップ1: Vercelデプロイ（自動）

**既に完了しています！**

GitHubにプッシュ済みのため、Vercelが自動的にデプロイを開始しています。

- URL: https://web-fnjm8qeyq-yasuus-projects.vercel.app
- 状態: デプロイ中（5-10分で完了）

確認方法:
```bash
curl -I https://web-fnjm8qeyq-yasuus-projects.vercel.app/proposals
```

## 🔧 ステップ2: N8Nワークフローのインポート（1分）

**なぜ手動？**: N8N APIの制限により、認証情報IDのマッピングが必要なため

### 方法:

#### オプションA: ファイルから直接インポート（推奨）

1. **N8Nを開く**:
   ```
   https://n8n.srv946785.hstgr.cloud
   ```

2. **ワークフローファイルを開く**:
   ```
   Win + E
   → C:\Users\march\Googleカレンダータスク通知\n8n-workflows
   → complete-notification-system.json
   ```

3. **ドラッグ&ドロップ**:
   - ファイルをN8Nのブラウザウィンドウにドラッグ
   - または「Import from File」をクリックしてファイル選択

4. **Google Calendar認証を設定**:
   - 「Google Calendar」ノードをクリック
   - 既存の認証情報を選択
   - （認証情報がない場合のみ新規作成）

5. **保存してアクティブ化**:
   - 右上の「Save」をクリック
   - トグルスイッチを「Active」にする

#### オプションB: 自動起動スクリプト（最速）

```bash
# N8Nとファイルを同時に開く
cd "C:\Users\march\Googleカレンダータスク通知"
start https://n8n.srv946785.hstgr.cloud
start "" "n8n-workflows\complete-notification-system.json"
```

その後、ファイル→ブラウザにドラッグ&ドロップ

## 🎯 ステップ3: 動作確認（1分）

### 1. Webアプリで会議を確認

```bash
# ブラウザで開く
start https://web-fnjm8qeyq-yasuus-projects.vercel.app/proposals
```

または直接アクセス: https://web-fnjm8qeyq-yasuus-projects.vercel.app/proposals

### 2. テスト実行

1. 会議を選択（チェックボックス）
2. 「企業URLを追加」で企業サイトを入力（オプション）
3. 「提案資料を生成」をクリック
4. 3時間後にメール通知が届くことを確認

### 3. カレンダー同期の確認

```bash
# Supabaseでデータを確認
start https://supabase.com/dashboard/project/dpqsipbppdemgfwuihjr/editor
```

`calendar_events` テーブルにデータがあることを確認

## 📊 完成状態チェックリスト

- ✅ コード: GitHub にプッシュ済み
- ✅ Webアプリ: Vercel にデプロイ中
- ✅ データベース: Supabase 設定済み
- ⏳ N8Nワークフロー: インポート待ち（1分で完了）

## 🚀 システムの使い方

### 日常運用

1. **毎朝6時**: 自動的にカレンダー同期
2. **必要な時**: Webアプリで会議を選択して提案生成
3. **会議3時間前**: 自動でメール通知

### 会議の準備

```
1. https://web-fnjm8qeyq-yasuus-projects.vercel.app/proposals にアクセス
2. 外部参加者がいる会議が自動表示される
3. 提案を作成したい会議にチェック
4. 企業URLを入力（より詳細な提案のため）
5. 「提案資料を生成」をクリック
6. 3時間前にメールで通知
```

### メール通知の内容

```
件名: 【3時間前】株式会社ABC 打ち合わせ - 提案資料が完成しました

内容:
- 会議情報（タイトル、企業名、時刻）
- AI生成の提案サマリー
- Webアプリへのリンク
```

## 🔧 カスタマイズ

### 通知タイミングを変更

N8Nワークフロー「Prepare Email Notification」ノード:

```javascript
// 3時間前 → 1時間前に変更
const notificationTime = new Date(meetingTime.getTime() - 1 * 60 * 60 * 1000);
```

### メールアドレスを変更

`web/src/app/proposals/page.tsx` の86行目:

```typescript
user_email: 'yannsunn1116@gmail.com'  // ← ここを変更
```

### AI提案の内容を変更

N8Nワークフロー「Prepare AI Research」ノードの `ai_prompt` を編集

## ❓ トラブルシューティング

### Webアプリが404エラー

```bash
# Vercelのデプロイ状況を確認
curl -I https://web-fnjm8qeyq-yasuus-projects.vercel.app/proposals

# まだデプロイ中の場合は5-10分待つ
```

### メール通知が届かない

1. N8Nワークフローがアクティブか確認
2. N8NのEmailノードの設定を確認
3. スパムフォルダを確認

### 提案が生成されない

1. N8NのWebhookが有効か確認: https://n8n.srv946785.hstgr.cloud/webhook/generate-proposal
2. Gemini APIキーが正しいか確認
3. N8Nの実行ログを確認

## 📞 サポート

問題が発生した場合:
1. N8Nの実行ログを確認
2. ブラウザのコンソールを確認（F12）
3. Supabaseのログを確認

---

**すべて準備完了です！N8Nワークフローをインポートするだけで使用開始できます。**
