export { default } from 'next-auth/middleware'

export const config = {
  matcher: [
    /*
     * 以下のパス以外はすべて認証が必要
     * - /api/auth/... (NextAuth)
     * - /_next/... (Next.js internal)
     * - /auth/... (ログインページ)
     */
    '/((?!api/auth|_next|auth).*)',
  ],
}
