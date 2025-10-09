# 📋 N8Nワークフロー ステップバイステップ セットアップ

既存ワークフロー: https://n8n.srv946785.hstgr.cloud/workflow/sQBFAm3od5U20PHG

---

## 🎯 Step 1: データ整形ノードを更新

### 1.1 既存の「データ整形」ノードをクリック

### 1.2 コードを以下に置き換え:

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

### 1.3 「Execute Node」をクリックしてテスト → エラーがないことを確認

---

## 🎯 Step 2: IFノードを追加（外部参加者チェック）

### 2.1 「Supabaseに保存」ノードの後に「+」ボタンをクリック

### 2.2 「IF」ノードを検索して追加

### 2.3 設定:

**Node Name:** `外部参加者チェック`

**Conditions:**
- **Data Type:** Boolean
- **Value 1:** `{{ $json.has_external_attendees }}`
- **Operation:** equals
- **Value 2:** `true`

### 2.4 接続を確認:
- 「Supabaseに保存」 → 「外部参加者チェック」

---

## 🎯 Step 3: Codeノードを追加（企業ドメイン抽出）

### 3.1 「外部参加者チェック」の **true** 出力に「+」ボタンをクリック

### 3.2 「Code」ノードを検索して追加

### 3.3 設定:

**Node Name:** `企業ドメイン抽出`

**Mode:** Run Once for All Items

**JavaScript Code:**

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

---

## 🎯 Step 4: HTTP Requestノードを追加（Web検索）

### 4.1 「企業ドメイン抽出」の後に「+」ボタンをクリック

### 4.2 「HTTP Request」ノードを検索して追加

### 4.3 設定:

**Node Name:** `Web検索 (Serper)`

**Method:** POST

**URL:** `https://google.serper.dev/search`

**Authentication:** None

**Send Query Parameters:** OFF

**Send Headers:** ON

**Headers:**
- **Name:** `X-API-KEY`
- **Value:** `あなたのSerper APIキー`（ここに取得したAPIキーを貼り付け）

追加のヘッダー:
- **Name:** `Content-Type`
- **Value:** `application/json`

**Send Body:** ON

**Body Content Type:** JSON

**JSON:**

```json
{
  "q": "={{ $json.search_query }}",
  "num": 5
}
```

---

## 🎯 Step 5: HTTP Requestノードを追加（Gemini企業分析）

### 5.1 「Web検索 (Serper)」の後に「+」ボタンをクリック

### 5.2 「HTTP Request」ノードを追加

### 5.3 設定:

**Node Name:** `Gemini企業分析`

**Method:** POST

**URL:**
```
https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=AIzaSyCsS0hCzYk_ISXO4uzlU91Iz6eOfkLozss
```

**Authentication:** None

**Send Headers:** ON

**Headers:**
- **Name:** `Content-Type`
- **Value:** `application/json`

**Send Body:** ON

**Body Content Type:** JSON

**JSON:**

```json
{
  "contents": [{
    "parts": [{
      "text": "以下の企業情報を分析して、日本語で簡潔にまとめてください。\n\n企業名: {{ $json.company_name }}\nドメイン: {{ $json.company_domain }}\n\nWeb検索結果:\n{{ JSON.stringify($('Web検索 (Serper)').item.json) }}\n\n以下の形式でまとめてください:\n1. 企業概要（2-3文）\n2. 主要事業（箇条書き）\n3. 業界・規模\n4. 特徴・強み"
    }]
  }],
  "generationConfig": {
    "temperature": 0.7,
    "maxOutputTokens": 1000
  }
}
```

---

## 🎯 Step 6: HTTP Requestノードを追加（Gemini Pro提案生成）

### 6.1 「Gemini企業分析」の後に「+」ボタンをクリック

### 6.2 「HTTP Request」ノードを追加

### 6.3 設定:

**Node Name:** `Gemini Pro 提案生成`

**Method:** POST

**URL:**
```
https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=AIzaSyCsS0hCzYk_ISXO4uzlU91Iz6eOfkLozss
```

**Authentication:** None

**Send Headers:** ON

**Headers:**
- **Name:** `Content-Type`
- **Value:** `application/json`

**Send Body:** ON

**Body Content Type:** JSON

**JSON:**

```json
{
  "contents": [{
    "parts": [{
      "text": "以下の企業に対して、AI・業務効率化ツールの提案を作成してください。\n\n【企業情報】\n{{ $('Gemini企業分析').item.json.candidates[0].content.parts[0].text }}\n\n【会議情報】\n会議タイトル: {{ $('企業ドメイン抽出').item.json.meeting_title }}\n開始時刻: {{ $('企業ドメイン抽出').item.json.meeting_start }}\n参加者: {{ JSON.stringify($('企業ドメイン抽出').item.json.attendees_from_company) }}\n\n【提案内容】\n以下の4つの観点から提案を作成してください：\n1. 業務効率化ツールの提案\n2. ホームページ作成・改善提案\n3. チャットボット導入提案\n4. AI活用提案\n\n各提案は具体的な導入メリット、想定コスト、導入期間を含めてください。"
    }]
  }],
  "generationConfig": {
    "temperature": 0.8,
    "maxOutputTokens": 2000
  }
}
```

---

## 🎯 Step 7: Codeノードを追加（提案データ整形）

### 7.1 「Gemini Pro 提案生成」の後に「+」ボタンをクリック

### 7.2 「Code」ノードを追加

### 7.3 設定:

**Node Name:** `提案データ整形`

**Mode:** Run Once for All Items

**JavaScript Code:**

```javascript
// 提案データを整形してSupabaseに保存する形式に変換
const companyAnalysis = $('Gemini企業分析').item.json.candidates?.[0]?.content?.parts?.[0]?.text || '';
const proposal = $json.candidates?.[0]?.content?.parts?.[0]?.text || '';
const searchResults = $('Web検索 (Serper)').item.json;

return [{
  json: {
    event_id: $('企業ドメイン抽出').item.json.event_id,
    company_domain: $('企業ドメイン抽出').item.json.company_domain,
    company_name: $('企業ドメイン抽出').item.json.company_name,
    company_analysis: companyAnalysis,
    proposal_content: proposal,
    search_results: searchResults,
    status: 'generated',
    generated_at: new Date().toISOString()
  }
}];
```

---

## 🎯 Step 8: HTTP Requestノードを追加（提案をSupabaseに保存）

### 8.1 「提案データ整形」の後に「+」ボタンをクリック

### 8.2 「HTTP Request」ノードを追加

### 8.3 設定:

**Node Name:** `提案をSupabaseに保存`

**Method:** POST

**URL:** `https://dpqsipbppdemgfwuihjr.supabase.co/rest/v1/proposals`

**Authentication:** None

**Send Headers:** ON

**Headers:**
- **Name:** `apikey`
- **Value:** `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRwcXNpcGJwcGRlbWdmd3VpaGpyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgzNzIzMzksImV4cCI6MjA3Mzk0ODMzOX0.Ke1gylvBOHU3XukM_IeQS3K9yM719qhgDbaqzDupy_Y`

追加のヘッダー:
- **Name:** `Authorization`
- **Value:** `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRwcXNpcGJwcGRlbWdmd3VpaGpyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgzNzIzMzksImV4cCI6MjA3Mzk0ODMzOX0.Ke1gylvBOHU3XukM_IeQS3K9yM719qhgDbaqzDupy_Y`

追加のヘッダー:
- **Name:** `Content-Type`
- **Value:** `application/json`

追加のヘッダー:
- **Name:** `Prefer`
- **Value:** `return=representation`

**Send Body:** ON

**Body Content Type:** JSON

**Specify Body:** Using JSON

**JSON:**

```json
={{ $json }}
```

---

## 🎯 Step 9: 実行結果ノードを更新

### 9.1 「提案をSupabaseに保存」の出力と「外部参加者チェック」のfalse出力を両方「実行結果」ノードに接続

### 9.2 完成!

---

## ✅ 完成後の確認

1. 全てのノードが接続されている
2. エラーがない
3. 「Save」ボタンで保存

---

## 🚀 テスト実行

1. 画面右上の「Execute Workflow」をクリック
2. 各ノードの出力を確認
3. Supabaseで`proposals`テーブルにデータが保存されているか確認

---

お疲れさまでした! 🎉
