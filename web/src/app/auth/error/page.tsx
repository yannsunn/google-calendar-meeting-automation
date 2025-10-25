'use client'

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { Box, Button, Container, Paper, Typography, Alert } from '@mui/material'
import Link from 'next/link'

function AuthErrorContent() {
  const searchParams = useSearchParams()
  const error = searchParams.get('error')

  const getErrorMessage = (errorCode: string | null) => {
    switch (errorCode) {
      case 'AccessDenied':
        return 'アクセスが拒否されました。許可されたユーザーのみがログインできます。'
      case 'Configuration':
        return '認証設定にエラーがあります。管理者にお問い合わせください。'
      case 'Verification':
        return 'メールアドレスの確認に失敗しました。'
      default:
        return '認証中にエラーが発生しました。もう一度お試しください。'
    }
  }

  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Paper elevation={3} sx={{ p: 4, width: '100%' }}>
          <Typography variant="h5" component="h1" gutterBottom align="center">
            ログインエラー
          </Typography>

          <Alert severity="error" sx={{ my: 3 }}>
            {getErrorMessage(error)}
          </Alert>

          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
            <Button
              component={Link}
              href="/auth/signin"
              variant="contained"
              color="primary"
            >
              再度ログイン
            </Button>
          </Box>
        </Paper>
      </Box>
    </Container>
  )
}

export default function AuthErrorPage() {
  return (
    <Suspense fallback={
      <Container maxWidth="sm">
        <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Paper elevation={3} sx={{ p: 4, width: '100%' }}>
            <Typography variant="h5" component="h1" align="center">
              読み込み中...
            </Typography>
          </Paper>
        </Box>
      </Container>
    }>
      <AuthErrorContent />
    </Suspense>
  )
}
