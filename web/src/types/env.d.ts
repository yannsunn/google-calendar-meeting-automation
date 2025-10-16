declare global {
  namespace NodeJS {
    interface ProcessEnv {
      // Supabase
      NEXT_PUBLIC_SUPABASE_URL: string
      NEXT_PUBLIC_SUPABASE_ANON_KEY: string
      SUPABASE_SERVICE_ROLE_KEY: string

      // Google
      GOOGLE_SERVICE_ACCOUNT_KEY: string
      GOOGLE_CALENDAR_ID?: string
      GOOGLE_CLIENT_ID: string
      GOOGLE_CLIENT_SECRET: string
      GOOGLE_ACCESS_TOKEN?: string
      GOOGLE_REFRESH_TOKEN?: string

      // N8N
      N8N_URL: string
      N8N_API_KEY: string
      N8N_WEBHOOK_BASE_URL: string
      N8N_WEBHOOK_SECRET?: string

      // NextAuth
      NEXTAUTH_SECRET: string
      NEXTAUTH_URL: string
      ALLOWED_USER_EMAIL?: string

      // AI APIs
      GEMINI_API_KEY?: string
      CLAUDE_API_KEY?: string
      SERPER_API_KEY?: string

      // Node
      NODE_ENV: 'development' | 'production' | 'test'
    }
  }
}

// NextAuth型拡張
declare module 'next-auth' {
  interface Session {
    accessToken?: string
    refreshToken?: string
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    accessToken?: string
    refreshToken?: string
    expiresAt?: number
  }
}

export {}
