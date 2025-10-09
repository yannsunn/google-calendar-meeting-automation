declare global {
  namespace NodeJS {
    interface ProcessEnv {
      // Supabase
      NEXT_PUBLIC_SUPABASE_URL: string
      SUPABASE_SERVICE_ROLE_KEY: string

      // Google
      GOOGLE_SERVICE_ACCOUNT_KEY: string
      GOOGLE_CALENDAR_ID?: string
      GOOGLE_CLIENT_ID?: string
      GOOGLE_CLIENT_SECRET?: string

      // N8N
      N8N_URL?: string
      N8N_API_KEY?: string

      // Node
      NODE_ENV: 'development' | 'production' | 'test'
    }
  }
}

export {}
