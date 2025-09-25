#!/bin/bash

# Vercel環境変数自動設定スクリプト
echo "🚀 Vercel環境変数の自動設定を開始します"

# .envファイルを読み込む
if [ ! -f .env ]; then
  echo "❌ .envファイルが見つかりません"
  exit 1
fi

# Vercel CLIがインストールされているか確認
if ! command -v vercel &> /dev/null; then
  echo "📦 Vercel CLIをインストール中..."
  npm install -g vercel
fi

# Vercelにログイン
echo "🔐 Vercelにログインしてください..."
vercel login

# プロジェクトをリンク
echo "🔗 Vercelプロジェクトをリンク中..."
vercel link

# 環境変数を設定
echo "⚙️ 環境変数を設定中..."

# Production環境用
vercel env add N8N_URL production < <(echo "https://n8n.srv946785.hstgr.cloud")
vercel env add N8N_API_KEY production < <(grep N8N_API_KEY .env | cut -d '=' -f2)
vercel env add N8N_WEBHOOK_BASE_URL production < <(echo "https://n8n.srv946785.hstgr.cloud/webhook")
vercel env add NEXT_PUBLIC_SUPABASE_URL production < <(grep NEXT_PUBLIC_SUPABASE_URL .env | cut -d '=' -f2)
vercel env add SUPABASE_SERVICE_ROLE_KEY production < <(grep SUPABASE_SERVICE_ROLE_KEY .env | cut -d '=' -f2)
vercel env add GEMINI_API_KEY production < <(grep GEMINI_API_KEY .env | cut -d '=' -f2)

# Preview環境用
vercel env add N8N_URL preview < <(echo "https://n8n.srv946785.hstgr.cloud")
vercel env add N8N_API_KEY preview < <(grep N8N_API_KEY .env | cut -d '=' -f2)
vercel env add N8N_WEBHOOK_BASE_URL preview < <(echo "https://n8n.srv946785.hstgr.cloud/webhook")
vercel env add NEXT_PUBLIC_SUPABASE_URL preview < <(grep NEXT_PUBLIC_SUPABASE_URL .env | cut -d '=' -f2)
vercel env add SUPABASE_SERVICE_ROLE_KEY preview < <(grep SUPABASE_SERVICE_ROLE_KEY .env | cut -d '=' -f2)
vercel env add GEMINI_API_KEY preview < <(grep GEMINI_API_KEY .env | cut -d '=' -f2)

# Development環境用
vercel env add N8N_URL development < <(echo "https://n8n.srv946785.hstgr.cloud")
vercel env add N8N_API_KEY development < <(grep N8N_API_KEY .env | cut -d '=' -f2)
vercel env add N8N_WEBHOOK_BASE_URL development < <(echo "https://n8n.srv946785.hstgr.cloud/webhook")
vercel env add NEXT_PUBLIC_SUPABASE_URL development < <(grep NEXT_PUBLIC_SUPABASE_URL .env | cut -d '=' -f2)
vercel env add SUPABASE_SERVICE_ROLE_KEY development < <(grep SUPABASE_SERVICE_ROLE_KEY .env | cut -d '=' -f2)
vercel env add GEMINI_API_KEY development < <(grep GEMINI_API_KEY .env | cut -d '=' -f2)

echo "✅ 環境変数の設定が完了しました"

# 再デプロイ
echo "🚀 Vercelで再デプロイ中..."
vercel --prod

echo "✅ すべての設定が完了しました！"