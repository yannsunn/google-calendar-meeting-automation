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
        token.accessToken = account.access_token
        token.refreshToken = account.refresh_token
        token.expiresAt = account.expires_at
      }
      return token
    },

    async session({ session, token }) {
      // セッションにトークン情報を追加
      session.accessToken = token.accessToken as string
      session.refreshToken = token.refreshToken as string
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
