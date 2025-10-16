'use client'

import { signIn } from 'next-auth/react'
import { Box, Button, Container, Paper, Typography } from '@mui/material'
import GoogleIcon from '@mui/icons-material/Google'

export default function SignInPage() {
  const handleGoogleSignIn = () => {
    signIn('google', { callbackUrl: '/' })
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
        <Paper
          elevation={3}
          sx={{
            p: 4,
            width: '100%',
            textAlign: 'center',
          }}
        >
          <Typography variant="h4" component="h1" gutterBottom>
            Meeting Automation System
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
            Googleアカウントでログインしてください
          </Typography>
          <Button
            variant="contained"
            size="large"
            startIcon={<GoogleIcon />}
            onClick={handleGoogleSignIn}
            fullWidth
            sx={{ py: 1.5 }}
          >
            Googleでログイン
          </Button>
        </Paper>
      </Box>
    </Container>
  )
}
