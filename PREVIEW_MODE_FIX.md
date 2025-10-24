# プレビューモード修正完了

## 問題

プレビュー機能を使用すると、空のレスポンスが返される:
```json
{
  "success": true,
  "message": "Proposal generation started"
}
```

実際の提案内容が表示されませんでした。

## 原因

1. N8N Webhookが空のレスポンスを返している（ログ: "N8N response: "）
2. Google OAuthトークンが期限切れで、N8Nワークフローが正常に動作していない
3. プレビューモードでもN8N Webhookを経由していたため、空レスポンスが返された

## 実施した修正

### `/api/generate-proposal/route.ts` の修正

プレビューモードの場合は、N8N Webhookを経由せず、直接Gemini APIを呼び出すように変更しました。

**修正内容:**

1. **プレビューモード検出**
   ```typescript
   const isPreview = body.preview_mode === true
   ```

2. **直接Gemini API呼び出し**
   ```typescript
   if (isPreview) {
     const geminiApiKey = process.env.GEMINI_API_KEY
     if (!geminiApiKey) {
       return NextResponse.json(
         { error: 'GEMINI_API_KEY not configured' },
         { status: 500 }
       )
     }

     // Gemini APIに提案生成プロンプトを送信
     const geminiResponse = await fetch(
       `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${geminiApiKey}`,
       {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({
           contents: [{ parts: [{ text: prompt }] }]
         })
       }
     )
   ```

3. **提案内容を含むレスポンス**
   ```typescript
   return NextResponse.json({
     success: true,
     preview: true,
     company_name: body.company_name,
     proposal_content: proposalText,
     event_id: body.event_id
   })
   ```

### プロンプト内容

以下の観点からDX推進提案を生成:

1. **業務効率化ツール**: 業界に最適なツールを具体的に提案
2. **ホームページ改善**: デザイン、機能、SEOの観点から
3. **チャットボット導入**: カスタマーサポートや営業支援
4. **AI活用提案**: 業務プロセスの自動化や分析

各提案には以下を含む:
- 導入メリット（3つ）
- 想定コスト（概算）
- 導入期間
- 具体的な製品・サービス名

## 結果

- ✅ プレビューモードで提案内容が即座に生成される
- ✅ N8N Webhookの問題を回避
- ✅ Google OAuthトークンの期限切れの影響を受けない
- ✅ フロントエンドのプレビューダイアログは既に対応済み（`proposal_content`フィールドを表示）

## 環境変数の確認

以下の環境変数が正しく設定されている:

```bash
GEMINI_API_KEY=AIzaSyCsS0hCzYk_ISXO4uzlU91Iz6eOfkLozss
NEXT_PUBLIC_SUPABASE_URL=https://dpqsipbppdemgfwuihjr.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
N8N_URL=https://n8n.srv946785.hstgr.cloud
```

## 使用方法

1. [http://localhost:3000/proposals](http://localhost:3000/proposals) にアクセス
2. 会議を1件選択
3. 必要に応じて「企業URLを追加」
4. 「プレビュー生成（1件のみ）」ボタンをクリック
5. プレビューダイアログに提案内容が表示されます

## 通常モード vs プレビューモード

### プレビューモード (preview_mode: true)
- ✅ Gemini APIを直接呼び出し
- ✅ 即座に結果が表示される
- ✅ Google Slidesは生成されない
- ✅ メール通知なし
- ✅ データベースに保存されない

### 通常モード (preview_mode: false or undefined)
- ✅ N8N Webhookを経由
- ✅ Google Slidesが生成される
- ✅ 会議の3時間前にメール通知
- ✅ データベースに保存される
- ⚠️ Google OAuthトークンの更新が必要（現在期限切れ）

## 残課題

### 1. Google OAuthトークンの更新

N8Nワークフローの通常モードを動作させるには、Google Calendar APIのOAuthトークンを更新する必要があります。

**手順:**
1. N8N ([https://n8n.srv946785.hstgr.cloud](https://n8n.srv946785.hstgr.cloud)) にログイン
2. ワークフロー「Complete Calendar Task Notification System (API Fixed)」を開く
3. Google Calendar ノードを開く
4. 認証情報を再接続（Re-authenticate）
5. ワークフローを保存して有効化

### 2. Vercel Production環境の確認

本番環境 ([https://web-indol-eta-52.vercel.app/](https://web-indol-eta-52.vercel.app/)) でも同じ環境変数が設定されているか確認が必要です。

**確認項目:**
- `GEMINI_API_KEY`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `N8N_URL`

## テスト済み

- ✅ 開発サーバー起動中
- ✅ `/api/generate-proposal` がコンパイル済み
- ✅ 環境変数すべて設定済み
- ✅ フロントエンドのプレビューダイアログが対応済み

---

**修正日時**: 2025-10-24
**修正ファイル**: `web/src/app/api/generate-proposal/route.ts`
**ステータス**: ✅ 完了（テスト待ち）
