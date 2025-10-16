'use client'

import { useState, useEffect } from 'react'
import { useSession, signOut } from 'next-auth/react'
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
  CircularProgress,
  Avatar,
  Menu,
  MenuItem
} from '@mui/material'
import {
  CalendarMonth,
  Business,
  AutoAwesome,
  Refresh,
  CheckCircle,
  Schedule,
  Logout,
  AccountCircle
} from '@mui/icons-material'
import MeetingList from '@/components/MeetingList'
import StatsCard from '@/components/StatsCard'
import CalendarSyncButton from '@/components/CalendarSyncButton'
import { useMeetings } from '@/hooks/useMeetings'

export default function Dashboard() {
  const { data: session } = useSession()
  const { meetings, isLoading, error, refetch } = useMeetings()
  const [processingWorkflow, setProcessingWorkflow] = useState(false)
  const [lastSyncTime, setLastSyncTime] = useState<string>('')
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)

  useEffect(() => {
    setLastSyncTime(new Date().toLocaleTimeString('ja-JP'))
  }, [])

  const todayMeetings = meetings?.filter(meeting => {
    const meetingDate = new Date(meeting.start_time)
    const today = new Date()
    return meetingDate.toDateString() === today.toDateString()
  }) || []

  const uniqueCompaniesCount = new Set(
    todayMeetings
      .flatMap(m => m.attendees || [])
      .map(a => a.company_id)
      .filter(Boolean)
  ).size

  const handleGenerateProposals = async () => {
    setProcessingWorkflow(true)
    try {
      // 有効な会議のIDを取得
      const enabledMeetings = todayMeetings.filter(m => m.is_enabled)
      const meetingIds = enabledMeetings.map(m => m.id)

      if (meetingIds.length === 0) {
        alert('提案を生成する会議を選択してください')
        return
      }

      // APIを呼び出し
      const response = await fetch('/api/workflows/trigger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          meetingIds,
          workflowId: 'final-ai-agent-workflow'
        })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to trigger workflow')
      }

      // 成功メッセージ
      alert(`提案資料の生成を開始しました。\n成功: ${result.triggered}件\n失敗: ${result.failed}件`)

      // データを再取得
      await refetch()
    } catch (err) {
      console.error('Error triggering workflow:', err)
      alert(`エラーが発生しました: ${err instanceof Error ? err.message : '不明なエラー'}`)
    } finally {
      setProcessingWorkflow(false)
    }
  }

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget)
  }

  const handleMenuClose = () => {
    setAnchorEl(null)
  }

  const handleLogout = () => {
    handleMenuClose()
    signOut({ callbackUrl: '/auth/signin' })
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Box>
          <Typography variant="h3" component="h1" gutterBottom>
            打ち合わせ準備自動化システム
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
            <CalendarSyncButton />
            {lastSyncTime && (
              <Typography variant="body2" color="text.secondary">
                Last sync: {lastSyncTime}
              </Typography>
            )}
          </Box>
        </Box>

        {/* ユーザーメニュー */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Typography variant="body2" color="text.secondary">
            {session?.user?.email}
          </Typography>
          <IconButton onClick={handleMenuOpen} size="small">
            {session?.user?.image ? (
              <Avatar src={session.user.image} alt={session.user.name || ''} sx={{ width: 32, height: 32 }} />
            ) : (
              <AccountCircle />
            )}
          </IconButton>
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleMenuClose}
            anchorOrigin={{
              vertical: 'bottom',
              horizontal: 'right',
            }}
            transformOrigin={{
              vertical: 'top',
              horizontal: 'right',
            }}
          >
            <MenuItem onClick={handleLogout}>
              <Logout fontSize="small" sx={{ mr: 1 }} />
              ログアウト
            </MenuItem>
          </Menu>
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
            value={uniqueCompaniesCount}
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