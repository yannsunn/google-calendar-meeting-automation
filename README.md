# Google Calendar Meeting Automation System

Google CalendarとN8Nを統合した、AIを活用した打ち合わせ準備の完全自動化システムです。

## 主要機能

- 📅 **自動カレンダー同期**: Google Calendarから会議情報を自動取得
- 🏢 **企業情報収集**: Web検索APIによる参加企業の自動リサーチ
  - Googleカレンダー参加者情報からの企業名自動抽出
  - 企業の業界・規模・事業内容の自動調査
  - 企業公開情報（ウェブサイト、ニュース等）の収集・要約
- 🤖 **AI提案生成**: Gemini/Claude APIによる提案内容の自動生成
  - 業務効率化ツールの提案
  - ホームページ作成・改善の提案
  - チャットボット導入の提案
  - その他AI活用の提案
  - 企業の業界・規模に応じた最適な提案のカスタマイズ
- 📊 **プレゼン作成**: Google Slides APIでプレゼンテーション自動作成
- 📋 **提案資料管理**: 生成された提案の包括的管理
  - 会議ごとの提案保存・履歴管理
  - 過去の提案履歴参照機能
  - 提案の成功/失敗トラッキング
- 🔄 **リアルタイム更新**: WebSocketによる即時通知と更新
- ⏰ **事前準備サポート**: 会議前の自動準備機能
  - 会議前日の自動リマインダー通知
  - 最新企業情報の再取得・更新
  - 競合他社動向を含む追加情報の提供
- 📈 **ダッシュボード**: 会議管理と提案状況の可視化

## 技術スタック

- **ワークフロー**: N8N v1.0+
- **フロントエンド**: Next.js 14, React 18, Material-UI
- **バックエンド**: Node.js, Express, Socket.io
- **データベース**: PostgreSQL 15, Redis 7
- **AI/ML**: Gemini API, Claude API, Web検索API
- **PDF生成**: PDFKit, React-PDF
- **インフラ**: Docker, Docker Compose
- **監視**: Prometheus, Grafana

## 🚀 クイックスタート

1. `.env.template`を`.env`にコピーして必須項目を設定
2. Vercelにデプロイ ([https://vercel.com/import](https://vercel.com/import))
3. 環境変数をVercelに設定

詳細な設定手順は [COMPLETE_SETUP_GUIDE.md](COMPLETE_SETUP_GUIDE.md) を参照してください。

## 🔑 必要なAPIキー

- **N8N API**: https://n8n.srv946785.hstgr.cloud (設定必須)
- **Google OAuth**: https://console.cloud.google.com
- **Gemini API**: https://makersuite.google.com/app/apikey
- **Claude API**: https://console.anthropic.com (オプション)
- **Web検索API**: SerpAPI, Bing Search API (企業情報収集用)
- **Supabase**: https://supabase.com

## 使用方法

### 基本的な流れ

1. **初回セットアップ**
   - Google Calendar連携設定
   - 社内ドメインの設定（外部参加者判定用）

2. **日次運用**
   - 毎朝6時に自動実行
   - ダッシュボードで会議確認
   - 必要に応じて手動実行

3. **会議準備**
   - チェックボックスで対象会議を選択
   - 「提案資料生成」ボタンで資料作成開始
   - 生成された資料をGoogle Slidesで確認
   - PDFエクスポートで提案資料を配布用に出力
   - 過去の提案履歴と成果を参照して改善

## アーキテクチャ

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Google    │◄────│     N8N     │────►│   Web App   │
│  Calendar   │     │  Workflows  │     │  (Next.js)  │
└─────────────┘     └─────────────┘     └─────────────┘
                           │                     │
                           ▼                     ▼
                    ┌─────────────┐     ┌─────────────┐
                    │ PostgreSQL  │     │  WebSocket  │
                    │   Database  │     │   Server    │
                    └─────────────┘     └─────────────┘
                           │                     │
                           ▼                     ▼
                    ┌─────────────┐     ┌─────────────┐
                    │    Redis    │     │   Clients   │
                    │    Cache    │     │  (Browser)  │
                    └─────────────┘     └─────────────┘
```

## N8Nワークフロー

### 1. Daily Meeting Sync
- 毎朝6時に実行
- Google Calendarから当日の会議取得
- データベースに保存
- 外部参加者がいる会議を検出

### 2. Company Research & AI Proposal Generation
- 参加企業の情報をWeb検索APIで収集
- AI分析で企業概要作成
- 業界・規模に応じたカスタマイズ提案生成:
  - 業務効率化ツールの提案
  - ホームページ作成・改善提案
  - チャットボット導入提案
  - AI活用提案
- Google Slidesでプレゼン作成
- PDFエクスポート機能で資料出力
- 提案履歴と成果トラッキング

### 3. Pre-Meeting Preparation Support
- 会議前日の自動リマインダー通知
- 最新企業情報の再取得・更新
- 競合他社動向を含む追加情報提供

## トラブルシューティング

### よくある問題と解決方法

**Q: N8Nが起動しない**
A: PostgreSQLの起動を確認してください
```bash
docker-compose logs postgres
```

**Q: Google Calendar連携エラー**
A: OAuth認証を再設定してください
```bash
# N8N管理画面で認証情報を再設定
```

**Q: AI API制限エラー**
A: APIキーの利用制限を確認し、必要に応じてアップグレード

## 監視とメトリクス

### Prometheus
- http://localhost:9090
- メトリクス収集と監視

### Grafana
- http://localhost:3002
- ダッシュボードでの可視化
- デフォルトパスワード: `.env`で設定

## バックアップ

### データベースバックアップ
```bash
docker exec postgres pg_dump -U meeting_automation meeting_automation_db > backup.sql
```

### N8Nワークフローバックアップ
```bash
# N8N管理画面からエクスポート
```

## セキュリティ

- すべての通信はHTTPS化推奨
- APIキーは環境変数で管理
- データベースアクセスは内部ネットワークのみ
- 定期的なセキュリティアップデート実施

## ライセンス

MIT License

## サポート

問題が発生した場合は、Issueを作成してください。

## 貢献

プルリクエストを歓迎します。大きな変更の場合は、まずIssueを作成して変更内容を説明してください。