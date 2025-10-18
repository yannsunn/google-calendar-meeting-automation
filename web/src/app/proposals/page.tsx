'use client';

import { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Button,
  TextField,
  Checkbox,
  FormControlLabel,
  Grid,
  Alert,
  CircularProgress,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import { BusinessCenter, CalendarToday, AccessTime, Send } from '@mui/icons-material';

interface CalendarEvent {
  event_id: string;
  summary: string;
  description?: string;
  company_name: string;
  start_time: string;
  end_time: string;
  location?: string;
  meeting_url?: string;
  organizer_email?: string;
  attendees?: string;
  has_external_attendees: boolean;
  external_count: number;
  duration_minutes?: number;
  proposal_status?: string;
}

export default function ProposalsPage() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [selectedEvents, setSelectedEvents] = useState<Set<string>>(new Set());
  const [companyUrls, setCompanyUrls] = useState<{ [key: string]: string }>({});
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [currentEventId, setCurrentEventId] = useState('');

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const response = await fetch('/api/meetings');
      if (!response.ok) throw new Error('Failed to fetch events');
      const data = await response.json();

      // 15分より長い会議のみ表示
      const filteredEvents = (data.meetings || []).filter((e: CalendarEvent) => {
        return !e.duration_minutes || e.duration_minutes > 15;
      });
      setEvents(filteredEvents);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectEvent = (eventId: string) => {
    const newSelected = new Set(selectedEvents);
    if (newSelected.has(eventId)) {
      newSelected.delete(eventId);
    } else {
      newSelected.add(eventId);
    }
    setSelectedEvents(newSelected);
  };

  const handleOpenUrlDialog = (eventId: string) => {
    setCurrentEventId(eventId);
    setDialogOpen(true);
  };

  const handleCloseUrlDialog = () => {
    setDialogOpen(false);
    setCurrentEventId('');
  };

  const handleSaveUrls = () => {
    setDialogOpen(false);
  };

  const handleGenerateProposals = async () => {
    if (selectedEvents.size === 0) {
      setError('会議を選択してください');
      return;
    }

    setGenerating(true);
    setError('');
    setSuccess('');

    try {
      for (const eventId of Array.from(selectedEvents)) {
        const event = events.find(e => e.event_id === eventId);
        if (!event) continue;

        // URLを配列に変換
        const urls = companyUrls[eventId]
          ? companyUrls[eventId].split('\n').filter(u => u.trim())
          : [];

        const response = await fetch('https://n8n.srv946785.hstgr.cloud/webhook/generate-proposal', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            event_id: eventId,
            company_name: event.company_name,
            company_urls: urls,
            summary: event.summary,
            start_time: event.start_time,
            user_email: 'yannsunn1116@gmail.com'
          })
        });

        if (!response.ok) {
          throw new Error(`Failed to generate proposal for ${event.summary}`);
        }
      }

      setSuccess(`${selectedEvents.size}件の提案資料を生成しました。3時間前にメール通知が届きます。`);
      setSelectedEvents(new Set());
      setCompanyUrls({});

      // イベントリストを再読み込み
      setTimeout(fetchEvents, 1000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setGenerating(false);
    }
  };

  if (loading) {
    return (
      <Container sx={{ py: 4, textAlign: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <BusinessCenter />
        提案資料生成
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

      <Box sx={{ mb: 3 }}>
        <Typography variant="body1" color="text.secondary" gutterBottom>
          提案資料を生成したい会議を選択してください。会議の3時間前にメールで通知されます。
        </Typography>
        <Typography variant="body2" color="text.secondary">
          必要に応じて、企業のURLを追加することでより詳細な提案が可能です。
        </Typography>
      </Box>

      {events.length === 0 ? (
        <Alert severity="info">
          今後7日間の会議がありません。
        </Alert>
      ) : (
        <>
          <Grid container spacing={2}>
            {events.map((event) => (
              <Grid item xs={12} key={event.event_id}>
                <Card
                  sx={{
                    border: selectedEvents.has(event.event_id) ? 2 : 1,
                    borderColor: selectedEvents.has(event.event_id) ? 'primary.main' : 'grey.300'
                  }}
                >
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={selectedEvents.has(event.event_id)}
                            onChange={() => handleSelectEvent(event.event_id)}
                          />
                        }
                        label=""
                      />
                      <Box sx={{ flexGrow: 1 }}>
                        <Typography variant="h6" gutterBottom sx={{ wordBreak: 'break-word', whiteSpace: 'pre-wrap' }}>
                          {event.summary}
                        </Typography>

                        <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
                          <Chip
                            icon={<BusinessCenter />}
                            label={event.company_name || '企業名なし'}
                            size="small"
                            color="primary"
                            variant="outlined"
                          />
                          <Chip
                            icon={<CalendarToday />}
                            label={new Date(event.start_time).toLocaleDateString('ja-JP')}
                            size="small"
                          />
                          <Chip
                            icon={<AccessTime />}
                            label={`${new Date(event.start_time).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })} - ${new Date(event.end_time).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })} (${event.duration_minutes || 0}分)`}
                            size="small"
                          />
                          {event.proposal_status === 'generated' && (
                            <Chip label="提案済み" size="small" color="success" />
                          )}
                        </Box>

                        {/* 説明文 */}
                        {event.description && (
                          <Box sx={{ mb: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                              詳細:
                            </Typography>
                            <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                              {event.description}
                            </Typography>
                          </Box>
                        )}

                        {/* 会議URL */}
                        {event.meeting_url && (
                          <Box sx={{ mb: 1 }}>
                            <Typography variant="body2" color="text.secondary">
                              <strong>会議室:</strong>{' '}
                              <a href={event.meeting_url} target="_blank" rel="noopener noreferrer">
                                {event.meeting_url}
                              </a>
                            </Typography>
                          </Box>
                        )}

                        {/* 場所 */}
                        {event.location && (
                          <Box sx={{ mb: 1 }}>
                            <Typography variant="body2" color="text.secondary">
                              <strong>場所:</strong> {event.location}
                            </Typography>
                          </Box>
                        )}

                        {/* ゲスト情報 */}
                        {event.attendees && (() => {
                          try {
                            const attendeesList = JSON.parse(event.attendees);
                            if (Array.isArray(attendeesList) && attendeesList.length > 0) {
                              return (
                                <Box sx={{ mb: 2 }}>
                                  <Typography variant="body2" color="text.secondary" gutterBottom>
                                    <strong>ゲスト ({attendeesList.length}名):</strong>
                                  </Typography>
                                  <Box sx={{ pl: 2 }}>
                                    {attendeesList.map((attendee: any, idx: number) => (
                                      <Typography key={idx} variant="body2" color="text.secondary">
                                        • {attendee.name || attendee.email} ({attendee.email})
                                        {attendee.response && ` - ${attendee.response}`}
                                      </Typography>
                                    ))}
                                  </Box>
                                </Box>
                              );
                            }
                          } catch (e) {
                            return null;
                          }
                          return null;
                        })()}

                        <Button
                          variant="outlined"
                          size="small"
                          onClick={() => handleOpenUrlDialog(event.event_id)}
                        >
                          企業URLを追加 ({companyUrls[event.event_id]?.split('\n').filter(u => u.trim()).length || 0}件)
                        </Button>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>

          <Box sx={{ mt: 3, display: 'flex', gap: 2, justifyContent: 'center' }}>
            <Button
              variant="contained"
              size="large"
              startIcon={generating ? <CircularProgress size={20} /> : <Send />}
              onClick={handleGenerateProposals}
              disabled={selectedEvents.size === 0 || generating}
            >
              {generating ? '生成中...' : `${selectedEvents.size}件の提案資料を生成`}
            </Button>
          </Box>
        </>
      )}

      {/* URL入力ダイアログ */}
      <Dialog open={dialogOpen} onClose={handleCloseUrlDialog} maxWidth="sm" fullWidth>
        <DialogTitle>企業URLを追加</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            企業のWebサイトURLを1行に1つずつ入力してください。
            より詳細な企業分析と提案が可能になります。
          </Typography>
          <TextField
            multiline
            rows={6}
            fullWidth
            placeholder="https://example.com&#10;https://example.com/about"
            value={companyUrls[currentEventId] || ''}
            onChange={(e) => setCompanyUrls({ ...companyUrls, [currentEventId]: e.target.value })}
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseUrlDialog}>キャンセル</Button>
          <Button onClick={handleSaveUrls} variant="contained">保存</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
