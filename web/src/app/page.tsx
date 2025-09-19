'use client'

import { useState, useEffect } from 'react'
import {
  Container,
  Typography,
  Box,
  Paper,
  Grid,
  Card,
  CardContent,
  Button,
  Chip,
  IconButton,
  Alert,
  CircularProgress
} from '@mui/material'
import {
  CalendarMonth,
  Business,
  AutoAwesome,
  Refresh,
  CheckCircle,
  Schedule
} from '@mui/icons-material'
import MeetingList from '@/components/MeetingList'
import StatsCard from '@/components/StatsCard'
import { useMeetings } from '@/hooks/useMeetings'
import { useWebSocket } from '@/hooks/useWebSocket'

export default function Dashboard() {
  const { meetings, isLoading, error, refetch } = useMeetings()
  const { isConnected, lastMessage } = useWebSocket()
  const [processingWorkflow, setProcessingWorkflow] = useState(false)

  const todayMeetings = meetings?.filter(meeting => {
    const meetingDate = new Date(meeting.start_time)
    const today = new Date()
    return meetingDate.toDateString() === today.toDateString()
  }) || []

  const handleGenerateProposals = async () => {
    setProcessingWorkflow(true)
    try {
      const response = await fetch('/api/workflows/trigger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workflow: 'generate-proposals',
          meetings: todayMeetings.filter(m => m.is_enabled)
        })
      })
      if (!response.ok) throw new Error('Failed to trigger workflow')
    } catch (err) {
      console.error('Error triggering workflow:', err)
    } finally {
      setProcessingWorkflow(false)
    }
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h3" component="h1" gutterBottom>
          打ち合わせ準備自動化システム
        </Typography>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          <Chip
            icon={isConnected ? <CheckCircle /> : <Schedule />}
            label={isConnected ? 'Connected' : 'Connecting...'}
            color={isConnected ? 'success' : 'default'}
            size="small"
          />
          <Typography variant="body2" color="text.secondary">
            Last sync: {new Date().toLocaleTimeString('ja-JP')}
          </Typography>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          データの取得中にエラーが発生しました: {error.message}
        </Alert>
      )}

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatsCard
            title="本日の会議"
            value={todayMeetings.length}
            icon={<CalendarMonth />}
            color="primary"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatsCard
            title="有効な会議"
            value={todayMeetings.filter(m => m.is_enabled).length}
            icon={<CheckCircle />}
            color="success"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatsCard
            title="参加企業"
            value={new Set(todayMeetings.flatMap(m => m.attendees?.map(a => a.company_id) || [])).size}
            icon={<Business />}
            color="info"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatsCard
            title="生成済み提案"
            value={todayMeetings.filter(m => m.proposals && m.proposals.length > 0).length}
            icon={<AutoAwesome />}
            color="secondary"
          />
        </Grid>
      </Grid>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h5" component="h2">
            本日の会議一覧
          </Typography>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              variant="outlined"
              startIcon={<Refresh />}
              onClick={() => refetch()}
              disabled={isLoading}
            >
              更新
            </Button>
            <Button
              variant="contained"
              startIcon={<AutoAwesome />}
              onClick={handleGenerateProposals}
              disabled={processingWorkflow || todayMeetings.filter(m => m.is_enabled).length === 0}
            >
              {processingWorkflow ? '生成中...' : '提案資料生成'}
            </Button>
          </Box>
        </Box>

        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <MeetingList meetings={todayMeetings} />
        )}
      </Paper>
    </Container>
  )
}