/**
 * 環境変数の検証とアクセス
 *
 * 必須の環境変数が設定されていない場合はエラーをスローします
 */

function getEnvVar(key: string, required: boolean = true): string {
  const value = process.env[key]

  if (required && !value) {
    throw new Error(`Missing required environment variable: ${key}`)
  }

  return value || ''
}

export const env = {
  // Supabase
  supabaseUrl: getEnvVar('NEXT_PUBLIC_SUPABASE_URL'),
  supabaseAnonKey: getEnvVar('NEXT_PUBLIC_SUPABASE_ANON_KEY', false),
  supabaseServiceKey: getEnvVar('SUPABASE_SERVICE_ROLE_KEY'),

  // Google OAuth
  googleClientId: getEnvVar('GOOGLE_CLIENT_ID'),
  googleClientSecret: getEnvVar('GOOGLE_CLIENT_SECRET'),
  googleCalendarId: getEnvVar('GOOGLE_CALENDAR_ID', false) || 'primary',

  // N8N
  n8nUrl: getEnvVar('N8N_URL'),
  n8nApiKey: getEnvVar('N8N_API_KEY'),
  n8nWebhookBaseUrl: getEnvVar('N8N_WEBHOOK_BASE_URL', false),
  n8nWebhookSecret: getEnvVar('N8N_WEBHOOK_SECRET', false),

  // NextAuth
  nextAuthSecret: getEnvVar('NEXTAUTH_SECRET'),
  nextAuthUrl: getEnvVar('NEXTAUTH_URL', false),
  allowedUserEmail: getEnvVar('ALLOWED_USER_EMAIL', false) || 'yannsunn1116@gmail.com',

  // Database (optional for PostgreSQL direct connection)
  databaseUrl: getEnvVar('DATABASE_URL', false),

  // AI APIs (optional)
  geminiApiKey: getEnvVar('GEMINI_API_KEY', false),
  claudeApiKey: getEnvVar('CLAUDE_API_KEY', false),
  serperApiKey: getEnvVar('SERPER_API_KEY', false),

  // Node environment
  nodeEnv: getEnvVar('NODE_ENV', false) || 'development',
  isDevelopment: (process.env.NODE_ENV || 'development') === 'development',
  isProduction: process.env.NODE_ENV === 'production',
} as const

/**
 * 環境変数の検証を実行
 * アプリケーション起動時に呼び出してください
 */
export function validateEnv(): void {
  try {
    // 必須の環境変数をチェック
    const required = [
      'NEXT_PUBLIC_SUPABASE_URL',
      'SUPABASE_SERVICE_ROLE_KEY',
      'GOOGLE_CLIENT_ID',
      'GOOGLE_CLIENT_SECRET',
      'N8N_URL',
      'N8N_API_KEY',
      'NEXTAUTH_SECRET',
    ]

    const missing = required.filter(key => !process.env[key])

    if (missing.length > 0) {
      throw new Error(
        `Missing required environment variables:\n${missing.map(k => `  - ${k}`).join('\n')}`
      )
    }

    console.log('✅ Environment variables validated successfully')
  } catch (error) {
    console.error('❌ Environment validation failed:', error)
    throw error
  }
}
