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
    // 現在、このページでは会議の選択機能が正しく実装されていません
    // /proposals ページを使用してください
    alert('提案資料の生成は /proposals ページから行ってください')
    window.location.href = '/proposals'
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
              disabled={processingWorkflow}
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