# 🚀 実装ガイド - 完全版

このガイドに従って、Google Calendar Meeting Automationシステムの全機能を実装します。

---

## 📋 実装チェックリスト

### Phase 1: データベースのセットアップ ✅

- [ ] **Step 1.1**: Supabaseにアクセス
  - URL: https://supabase.com
  - プロジェクト: dpqsipbppdemgfwuihjr

- [ ] **Step 1.2**: SQL Editorを開く
  - 左メニュー → SQL Editor

- [ ] **Step 1.3**: スキーマ更新SQLを実行
  - `/database/update-schema-for-enhanced-workflow.sql` の内容をコピー
  - SQL Editorに貼り付けて実行
  - ✅ 成功メッセージを確認

- [ ] **Step 1.4**: テーブル作成を確認
  ```sql
  -- calendar_events テーブルの確認
  SELECT * FROM public.calendar_events LIMIT 1;

  -- proposals テーブルの確認
  SELECT * FROM public.proposals LIMIT 1;
  ```

---

### Phase 2: N8Nワークフローのセットアップ ✅

- [ ] **Step 2.1**: N8N管理画面にアクセス
  - URL: https://n8n.srv946785.hstgr.cloud

- [ ] **Step 2.2**: 既存ワークフローのバックアップ
  - ワークフロー: https://n8n.srv946785.hstgr.cloud/workflow/sQBFAm3od5U20PHG
  - 右上「...」メニュー → Export Workflow
  - JSONファイルを保存

- [ ] **Step 2.3**: 環境変数の設定
  - N8N → Settings → Variables
  - 以下を追加:

  ```bash
  # 既存（確認のみ）
  GOOGLE_ACCESS_TOKEN=ya29.a0AQQ_BDT-rHVy8h6vbiTB8Rir1n2Dt5oZhejJaiv-zT7SKjnj5snozrsDudWlqud-LAIn4FBPVP-uVF8lETAPfDJP6M-dKgdYdfshtZhTog3CPA-KB889n3PtFCCCn8bPNhDCu6SICwGEs0oaE_gD_BXDMII3P-B_zKoF3TB_cjYZgK65ObMDCTafKxfQ7YYSCxauiY4aCgYKAbcSAQ4SFQHGX2MiJ8ZiKcP1yVJJv-xQ2Toakg0206

  # 新規追加
  GEMINI_API_KEY=AIzaSyCsS0hCzYk_ISXO4uzlU91Iz6eOfkLozss
  SERPER_API_KEY=（取得が必要）
  ```

- [ ] **Step 2.4**: Serper API キーを取得
  1. https://serper.dev にアクセス
  2. Sign Up（無料プラン: 2,500リクエスト/月）
  3. API Keys → Create New Key
  4. キーをコピーして N8N に設定

- [ ] **Step 2.5**: ワークフローを更新
  - **方法A**: JSONファイルをインポート
    1. `/n8n-workflows/enhanced-calendar-sync.json` を開く
    2. N8N → 既存ワークフロー → 右上「...」→ Import from File
    3. JSONファイルを選択

  - **方法B**: 手動で追加ノードを作成（推奨）
    1. 既存ワークフロー https://n8n.srv946785.hstgr.cloud/workflow/sQBFAm3od5U20PHG を開く
    2. 以下のノードを追加（詳細は次セクション）

---

### Phase 3: ワークフローノードの追加（手動実装）✅

既存ワークフローに以下のノードを追加します:

#### 3.1 データ整形ノードを更新

既存の「データ整形」ノードを以下に置き換え:

```javascript
// イベントデータを整形 + 外部参加者判定
const items = $input.all();
const events = items[0].json.items || [];

const internalDomains = ['gmail.com', 'googlemail.com', 'yasuus-projects.vercel.app'];

return events.map(event => {
  const attendees = (event.attendees || []).map(a => ({
    email: a.email,
    name: a.displayName || a.email.split('@')[0],
    response: a.responseStatus || 'needsAction',
    is_organizer: a.organizer || false,
    domain: a.email.split('@')[1]
  }));

  // 外部参加者の抽出
  const externalAttendees = attendees.filter(a =>
    !internalDomains.includes(a.domain)
  );

  // 会議の期間計算
  const start = new Date(event.start?.dateTime || event.start?.date);
  const end = new Date(event.end?.dateTime || event.end?.date);
  const durationMinutes = (end - start) / 1000 / 60;

  return {
    json: {
      event_id: event.id,
      summary: event.summary || 'タイトルなし',
      description: event.description || '',
      start_time: event.start?.dateTime || event.start?.date,
      end_time: event.end?.dateTime || event.end?.date,
      location: event.location || '',
      meeting_url: event.hangoutLink || '',
      organizer_email: event.organizer?.email || '',
      attendees: attendees,
      external_attendees: externalAttendees,
      has_external_attendees: externalAttendees.length > 0,
      external_count: externalAttendees.length,
      duration_minutes: durationMinutes,
      is_important: durationMinutes >= 30 && externalAttendees.length > 0,
      status: event.status || 'confirmed',
      raw_data: event,
      synced_at: new Date().toISOString()
    }
  };
});
```

#### 3.2 外部参加者チェックノード

「Supabaseに保存」の後に追加:

- **タイプ**: IF
- **名前**: 外部参加者チェック
- **条件**: `{{$json.has_external_attendees}}` = `true`

#### 3.3 企業ドメイン抽出ノード

「外部参加者チェック」のtrueブランチに追加:

- **タイプ**: Code
- **名前**: 企業ドメイン抽出
- **コード**:

```javascript
// 企業ドメインを抽出してWeb検索用のクエリを準備
const externalAttendees = $json.external_attendees || [];

const companies = {};

// ドメインごとに参加者をグループ化
externalAttendees.forEach(attendee => {
  const domain = attendee.domain;
  if (!companies[domain]) {
    companies[domain] = {
      domain: domain,
      company_name: domain.replace(/\.(com|co\.jp|jp|net|org)$/, ''),
      attendees: []
    };
  }
  companies[domain].attendees.push(attendee);
});

const companyList = Object.values(companies);

return companyList.map(company => ({
  json: {
    event_id: $json.event_id,
    meeting_title: $json.summary,
    meeting_start: $json.start_time,
    company_domain: company.domain,
    company_name: company.company_name,
    attendees_from_company: company.attendees,
    search_query: `${company.company_name} 企業情報 事業内容 業界`,
    timestamp: new Date().toISOString()
  }
}));
```

#### 3.4 Web検索ノード

- **タイプ**: HTTP Request
- **名前**: Web検索 (Serper)
- **設定**:
  - Method: POST
  - URL: `https://google.serper.dev/search`
  - Headers:
    - `X-API-KEY`: `{{$env.SERPER_API_KEY}}`
    - `Content-Type`: `application/json`
  - Body (JSON):
    ```json
    {
      "q": "{{$json.search_query}}",
      "num": 5
    }
    ```

#### 3.5 Gemini企業分析ノード

- **タイプ**: HTTP Request
- **名前**: Gemini企業分析
- **設定**:
  - Method: POST
  - URL: `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={{$env.GEMINI_API_KEY}}`
  - Headers:
    - `Content-Type`: `application/json`
  - Body (JSON):
    ```json
    {
      "contents": [{
        "parts": [{
          "text": "以下の企業情報を分析して、日本語で簡潔にまとめてください。\n\n企業名: {{$json.company_name}}\nドメイン: {{$json.company_domain}}\n\nWeb検索結果:\n{{JSON.stringify($json.search_results)}}\n\n以下の形式でまとめてください:\n1. 企業概要（2-3文）\n2. 主要事業（箇条書き）\n3. 業界・規模\n4. 特徴・強み"
        }]
      }],
      "generationConfig": {
        "temperature": 0.7,
        "maxOutputTokens": 1000
      }
    }
    ```

#### 3.6 Gemini Pro提案生成ノード

- **タイプ**: HTTP Request
- **名前**: Gemini Pro 提案生成
- **設定**:
  - Method: POST
  - URL: `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key={{$env.GEMINI_API_KEY}}`
  - Body (JSON):
    ```json
    {
      "contents": [{
        "parts": [{
          "text": "以下の企業に対して、AI・業務効率化ツールの提案を作成してください。\n\n【企業情報】\n{{$node['Gemini企業分析'].json.candidates[0].content.parts[0].text}}\n\n【会議情報】\n会議タイトル: {{$json.meeting_title}}\n開始時刻: {{$json.meeting_start}}\n参加者: {{JSON.stringify($json.attendees_from_company)}}\n\n【提案内容】\n以下の4つの観点から提案を作成してください：\n1. 業務効率化ツールの提案\n2. ホームページ作成・改善提案\n3. チャットボット導入提案\n4. AI活用提案\n\n各提案は具体的な導入メリット、想定コスト、導入期間を含めてください。"
        }]
      }],
      "generationConfig": {
        "temperature": 0.8,
        "maxOutputTokens": 2000
      }
    }
    ```

#### 3.7 提案データ整形ノード

- **タイプ**: Code
- **名前**: 提案データ整形
- **コード**:

```javascript
// 提案データを整形してSupabaseに保存する形式に変換
const companyAnalysis = $node['Gemini企業分析'].json.candidates?.[0]?.content?.parts?.[0]?.text || '';
const proposal = $json.candidates?.[0]?.content?.parts?.[0]?.text || '';
const searchResults = $node['Web検索 (Serper)'].json;

return [{
  json: {
    event_id: $node['企業ドメイン抽出'].json.event_id,
    company_domain: $node['企業ドメイン抽出'].json.company_domain,
    company_name: $node['企業ドメイン抽出'].json.company_name,
    company_analysis: companyAnalysis,
    proposal_content: proposal,
    search_results: searchResults,
    status: 'generated',
    generated_at: new Date().toISOString()
  }
}];
```

#### 3.8 提案をSupabaseに保存ノード

- **タイプ**: HTTP Request
- **名前**: 提案をSupabaseに保存
- **設定**:
  - Method: POST
  - URL: `https://dpqsipbppdemgfwuihjr.supabase.co/rest/v1/proposals`
  - Headers:
    - `apikey`: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRwcXNpcGJwcGRlbWdmd3VpaGpyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgzNzIzMzksImV4cCI6MjA3Mzk0ODMzOX0.Ke1gylvBOHU3XukM_IeQS3K9yM719qhgDbaqzDupy_Y`
    - `Authorization`: `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRwcXNpcGJwcGRlbWdmd3VpaGpyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgzNzIzMzksImV4cCI6MjA3Mzk0ODMzOX0.Ke1gylvBOHU3XukM_IeQS3K9yM719qhgDbaqzDupy_Y`
    - `Content-Type`: `application/json`
    - `Prefer`: `return=representation`
  - Body: `={{$json}}`

---

### Phase 4: テスト実行 ✅

- [ ] **Step 4.1**: ワークフローを保存
  - 画面右上の「Save」ボタン

- [ ] **Step 4.2**: 手動テスト実行
  - 画面右上の「Execute Workflow」ボタン

- [ ] **Step 4.3**: 実行結果を確認
  - 各ノードをクリックして出力データを確認
  - エラーがないことを確認

- [ ] **Step 4.4**: Supabaseでデータ確認
  ```sql
  -- カレンダーイベント確認
  SELECT * FROM public.calendar_events
  WHERE has_external_attendees = true
  ORDER BY synced_at DESC
  LIMIT 5;

  -- 提案確認
  SELECT * FROM public.proposals
  ORDER BY generated_at DESC
  LIMIT 5;
  ```

---

### Phase 5: フロントエンド連携確認 ✅

- [ ] **Step 5.1**: Webアプリにアクセス
  - URL: https://web-kxbzxubh3-yasuus-projects.vercel.app

- [ ] **Step 5.2**: ダッシュボードで確認
  - 会議一覧が表示されるか
  - 外部参加者がいる会議がハイライトされているか

- [ ] **Step 5.3**: 提案資料の確認
  - 「提案資料生成」ボタンが表示されるか
  - ボタンクリックでN8Nワークフローがトリガーされるか

---

## 🎉 実装完了!

すべてのチェックリストが完了したら、以下の機能が利用可能になります:

1. ✅ Google Calendarから自動同期
2. ✅ 外部参加者の自動判定
3. ✅ 企業情報の自動収集
4. ✅ AI企業分析
5. ✅ AI提案生成
6. ✅ ダッシュボードでの可視化

---

## 📞 トラブルシューティング

### エラー: "SERPER_API_KEY is not defined"
→ N8N Settings → Variables で環境変数を追加

### エラー: "Gemini API quota exceeded"
→ Gemini APIの利用制限を確認
→ 翌日まで待機 または 別のAPIキーを使用

### エラー: "Table 'proposals' does not exist"
→ Supabaseで `/database/update-schema-for-enhanced-workflow.sql` を実行

### Web検索が失敗する
→ Serper APIの無料枠を確認（2,500リクエスト/月）

---

## 📚 参考資料

- [N8Nワークフローセットアップガイド](/n8n-workflows/WORKFLOW_SETUP.md)
- [データベーススキーマ](/database/update-schema-for-enhanced-workflow.sql)
- [完全セットアップガイド](/COMPLETE_SETUP_GUIDE.md)

---

**実装を開始する準備ができましたか?**

Phase 1から順番に進めてください。各Phaseが完了したらチェックを入れていきましょう! ✨
