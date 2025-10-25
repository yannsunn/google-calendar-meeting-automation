'use client'

import React, { Component, ErrorInfo, ReactNode } from 'react'
import { Alert, AlertTitle, Button, Box, Typography } from '@mui/material'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error to monitoring service
    console.error('ErrorBoundary caught an error:', error, errorInfo)

    // In production, send to error tracking service
    if (process.env.NODE_ENV === 'production') {
      // Example: Send to Sentry or other error tracking
      // Sentry.captureException(error, { contexts: { react: errorInfo } })
    }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined })
    // Optionally reload the page
    if (typeof window !== 'undefined') {
      window.location.reload()
    }
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <Alert severity="error" sx={{ m: 4 }}>
          <AlertTitle>エラーが発生しました</AlertTitle>
          <Box>
            <Typography variant="body2">
              申し訳ございません。予期しないエラーが発生しました。
            </Typography>
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <pre style={{ marginTop: '10px', fontSize: '12px' }}>
                {this.state.error.message}
              </pre>
            )}
            <Button
              onClick={this.handleReset}
              variant="outlined"
              color="error"
              sx={{ mt: 2 }}
            >
              ページを再読み込み
            </Button>
          </Box>
        </Alert>
      )
    }

    return this.props.children
  }
}

// Hook for functional components
export function useErrorHandler() {
  return (error: Error) => {
    console.error('Error caught by useErrorHandler:', error)
    throw error // This will be caught by the nearest ErrorBoundary
  }
}