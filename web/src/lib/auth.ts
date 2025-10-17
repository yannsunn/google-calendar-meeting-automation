import { NextAuthOptions } from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          scope: 'openid email profile https://www.googleapis.com/auth/calendar.readonly',
          prompt: 'consent',
          access_type: 'offline',
          response_type: 'code'
        }
      }
    })
  ],

  callbacks: {
    async jwt({ token, account, profile }) {
      // 初回サインイン時にアカウント情報を保存
      if (account) {
        return {
          ...token,
          accessToken: account.access_token,
          refreshToken: account.refresh_token,
          expiresAt: account.expires_at,
        }
      }

      // トークンが有効期限内の場合はそのまま返す
      if (token.expiresAt && Date.now() < (token.expiresAt as number) * 1000) {
        return token
      }

      // トークンをリフレッシュ
      try {
        console.log('Refreshing access token...')

        const response = await fetch('https://oauth2.googleapis.com/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({
            client_id: process.env.GOOGLE_CLIENT_ID!,
            client_secret: process.env.GOOGLE_CLIENT_SECRET!,
            grant_type: 'refresh_token',
            refresh_token: token.refreshToken as string,
          }),
        })

        const refreshedTokens = await response.json()

        if (!response.ok) {
          console.error('Failed to refresh token:', refreshedTokens)
          throw refreshedTokens
        }

        console.log('Token refreshed successfully')

        return {
          ...token,
          accessToken: refreshedTokens.access_token,
          expiresAt: Math.floor(Date.now() / 1000) + refreshedTokens.expires_in,
          refreshToken: refreshedTokens.refresh_token ?? token.refreshToken,
        }
      } catch (error) {
        console.error('Error refreshing access token:', error)
        return {
          ...token,
          error: 'RefreshAccessTokenError',
        }
      }
    },

    async session({ session, token }) {
      // セッションにトークン情報を追加
      session.accessToken = token.accessToken as string
      session.refreshToken = token.refreshToken as string
      session.error = token.error as string | undefined
      return session
    },

    async signIn({ account, profile }) {
      // 特定のユーザーのみ許可（単一ユーザー制限）
      const allowedEmail = process.env.ALLOWED_USER_EMAIL || 'yannsunn1116@gmail.com'

      if (profile?.email === allowedEmail) {
        return true
      }

      // 許可されていないユーザーはサインイン拒否
      return false
    }
  },

  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },

  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },

  secret: process.env.NEXTAUTH_SECRET,
}
