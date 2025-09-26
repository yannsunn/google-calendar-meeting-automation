'use client'

import React, { useState, useEffect } from 'react'
import { Button, CircularProgress, Alert, Snackbar } from '@mui/material'
import SyncIcon from '@mui/icons-material/Sync'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import axios from 'axios'

export default function CalendarSyncButton() {
  const [syncing, setSyncing] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const [lastSync, setLastSync] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleSync = async () => {
    setSyncing(true)
    setMessage(null)

    try {
      const response = await axios.post('/api/calendar/auto-sync')

      if (response.data.success) {
        setMessage({
          type: 'success',
          text: `✅ ${response.data.eventsCount}件のイベントを同期しました`
        })
        if (mounted) {
          setLastSync(new Date().toLocaleString('ja-JP'))
        }
      } else {
        throw new Error(response.data.error)
      }
    } catch (error: any) {
      setMessage({
        type: 'error',
        text: `❌ 同期エラー: ${error.message}`
      })
    } finally {
      setSyncing(false)
    }
  }

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <Button
          variant="contained"
          color="primary"
          onClick={handleSync}
          disabled={syncing}
          startIcon={syncing ? <CircularProgress size={20} /> : <SyncIcon />}
        >
          {syncing ? 'カレンダー同期中...' : 'カレンダーを同期'}
        </Button>

        {mounted && lastSync && (
          <span style={{ fontSize: '14px', color: '#666' }}>
            最終同期: {lastSync}
          </span>
        )}
      </div>

      <Snackbar
        open={!!message}
        autoHideDuration={6000}
        onClose={() => setMessage(null)}
      >
        <Alert
          onClose={() => setMessage(null)}
          severity={message?.type}
          sx={{ width: '100%' }}
        >
          {message?.text}
        </Alert>
      </Snackbar>
    </>
  )
}