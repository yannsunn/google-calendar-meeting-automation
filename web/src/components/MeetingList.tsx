'use client'

import { useState } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Checkbox,
  Chip,
  IconButton,
  Tooltip,
  Box,
  Typography,
  Avatar,
  AvatarGroup
} from '@mui/material'
import {
  Visibility,
  Edit,
  PictureAsPdf,
  Groups,
  LocationOn,
  AccessTime
} from '@mui/icons-material'
import { format } from 'date-fns'
import { ja } from 'date-fns/locale'
import { Meeting } from '@/types/meeting'

interface MeetingListProps {
  meetings: Meeting[]
}

export default function MeetingList({ meetings }: MeetingListProps) {
  const [selectedMeetings, setSelectedMeetings] = useState<Set<string>>(
    new Set() // 初期状態では何も選択しない
  )

  const handleToggleMeeting = async (meetingId: string) => {
    const newSelected = new Set(selectedMeetings)
    if (newSelected.has(meetingId)) {
      newSelected.delete(meetingId)
    } else {
      newSelected.add(meetingId)
    }
    setSelectedMeetings(newSelected)

    // APIコールは削除 - チェックボックスの状態はローカルで管理
    // 将来的にバックエンドでの永続化が必要な場合は、適切なAPIエンドポイントを作成する
  }

  const formatTime = (startTime: string, endTime: string) => {
    const start = new Date(startTime)
    const end = new Date(endTime)
    return `${format(start, 'HH:mm')} - ${format(end, 'HH:mm')}`
  }

  const getExternalAttendees = (attendees?: Meeting['attendees']) => {
    if (!attendees) return []
    return attendees.filter(a => a.is_external)
  }

  return (
    <TableContainer>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell padding="checkbox" width={50}>有効</TableCell>
            <TableCell>時間</TableCell>
            <TableCell>会議タイトル</TableCell>
            <TableCell>場所</TableCell>
            <TableCell>参加企業</TableCell>
            <TableCell>ステータス</TableCell>
            <TableCell align="center">アクション</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {meetings.map((meeting) => {
            const externalAttendees = getExternalAttendees(meeting.attendees)
            const hasProposal = meeting.proposals && meeting.proposals.length > 0

            return (
              <TableRow
                key={meeting.id}
                sx={{
                  opacity: selectedMeetings.has(meeting.id) ? 1 : 0.6,
                  '&:hover': { backgroundColor: 'action.hover' }
                }}
              >
                <TableCell padding="checkbox">
                  <Checkbox
                    checked={selectedMeetings.has(meeting.id)}
                    onChange={() => handleToggleMeeting(meeting.id)}
                    color="primary"
                  />
                </TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <AccessTime fontSize="small" color="action" />
                    <Typography variant="body2">
                      {formatTime(meeting.start_time, meeting.end_time)}
                    </Typography>
                  </Box>
                </TableCell>
                <TableCell>
                  <Box>
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                      {meeting.title}
                    </Typography>
                    {meeting.description && (
                      <Typography variant="caption" color="text.secondary" sx={{
                        display: 'block',
                        mt: 0.5,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        maxWidth: '300px'
                      }}>
                        {meeting.description}
                      </Typography>
                    )}
                  </Box>
                </TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <LocationOn fontSize="small" color="action" />
                    <Typography variant="body2">
                      {meeting.location || meeting.meeting_url || 'オンライン'}
                    </Typography>
                  </Box>
                </TableCell>
                <TableCell>
                  {externalAttendees.length > 0 ? (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <AvatarGroup max={3} sx={{ '& .MuiAvatar-root': { width: 24, height: 24, fontSize: '0.75rem' } }}>
                        {externalAttendees.map((attendee, idx) => (
                          <Avatar key={idx} sx={{ bgcolor: 'primary.main' }}>
                            {attendee.name?.[0] || attendee.email[0].toUpperCase()}
                          </Avatar>
                        ))}
                      </AvatarGroup>
                      <Typography variant="caption" color="text.secondary">
                        {externalAttendees.length}社
                      </Typography>
                    </Box>
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      社内のみ
                    </Typography>
                  )}
                </TableCell>
                <TableCell>
                  {hasProposal ? (
                    <Chip
                      label="提案済み"
                      color="success"
                      size="small"
                      variant="filled"
                    />
                  ) : (
                    <Chip
                      label="未生成"
                      color="default"
                      size="small"
                      variant="outlined"
                    />
                  )}
                </TableCell>
                <TableCell align="center">
                  <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1 }}>
                    <Tooltip title="詳細を見る">
                      <IconButton size="small" color="primary">
                        <Visibility fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="編集">
                      <IconButton size="small">
                        <Edit fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    {hasProposal && (
                      <Tooltip title="提案資料を開く">
                        <IconButton
                          size="small"
                          color="secondary"
                          onClick={() => window.open(meeting.proposals![0].presentation_url, '_blank')}
                        >
                          <PictureAsPdf fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}
                  </Box>
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </TableContainer>
  )
}