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
import { BusinessCenter, CalendarToday, AccessTime, Send, VisibilityOff, Visibility, Preview } from '@mui/icons-material';

interface CalendarEvent {
  id: string;
  title: string;
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
  const [hiddenEvents, setHiddenEvents] = useState<Set<string>>(new Set());
  const [showHidden, setShowHidden] = useState(false);
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [previewContent, setPreviewContent] = useState<any>(null);
  const [previewing, setPreviewing] = useState(false);

  useEffect(() => {
    fetchEvents();
    // localStorageから非表示リストを読み込む
    const stored = localStorage.getItem('hiddenEvents');
    if (stored) {
      try {
        setHiddenEvents(new Set(JSON.parse(stored)));
      } catch (e) {
        console.error('Failed to load hidden events:', e);
      }
    }
    // localStorageから企業URLを読み込む
    const storedUrls = localStorage.getItem('companyUrls');
    if (storedUrls) {
      try {
        setCompanyUrls(JSON.parse(storedUrls));
      } catch (e) {
        console.error('Failed to load company URLs:', e);
      }
    }
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
    // localStorageに保存
    localStorage.setItem('companyUrls', JSON.stringify(companyUrls));
    setDialogOpen(false);
  };

  const handleHideEvent = (eventId: string) => {
    const newHidden = new Set(hiddenEvents);
    newHidden.add(eventId);
    setHiddenEvents(newHidden);
    // localStorageに保存
    localStorage.setItem('hiddenEvents', JSON.stringify(Array.from(newHidden)));
  };

  const handleUnhideEvent = (eventId: string) => {
    const newHidden = new Set(hiddenEvents);
    newHidden.delete(eventId);
    setHiddenEvents(newHidden);
    // localStorageに保存
    localStorage.setItem('hiddenEvents', JSON.stringify(Array.from(newHidden)));
  };

  const handlePreviewProposal = async () => {
    if (selectedEvents.size === 0) {
      setError('会議を選択してください');
      return;
    }

    if (selectedEvents.size > 1) {
      setError('プレビューは1件ずつ確認してください');
      return;
    }

    setPreviewing(true);
    setError('');

    try {
      const eventId = Array.from(selectedEvents)[0];
      const event = events.find(e => e.id === eventId);
      if (!event) return;

      const urls = companyUrls[eventId]
        ? companyUrls[eventId].split('\n').filter(u => u.trim())
        : [];

      const response = await fetch('/api/generate-proposal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event_id: eventId,
          company_name: event.company_name,
          company_urls: urls,
          summary: event.title,
          start_time: event.start_time,
          user_email: 'yannsunn1116@gmail.com',
          preview_mode: true
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.details || 'Failed to generate preview');
      }

      setPreviewContent(result);
      setPreviewDialogOpen(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setPreviewing(false);
    }
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
        const event = events.find(e => e.id === eventId);
        if (!event) continue;

        // URLを配列に変換
        const urls = companyUrls[eventId]
          ? companyUrls[eventId].split('\n').filter(u => u.trim())
          : [];

        const response = await fetch('/api/generate-proposal', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            event_id: eventId,
            company_name: event.company_name,
            company_urls: urls,
            summary: event.title,
            start_time: event.start_time,
            user_email: 'yannsunn1116@gmail.com'
          })
        });

        if (!response.ok) {
          throw new Error(`Failed to generate proposal for ${event.title}`);
        }
      }

      setSuccess(`${selectedEvents.size}件の提案資料を生成しました。3時間前にメール通知が届きます。`);
      setSelectedEvents(new Set());
      // 企業URLは保持する（削除しない）

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

        {/* 非表示リスト表示トグル */}
        <Box sx={{ mt: 2, display: 'flex', gap: 2, alignItems: 'center' }}>
          <Button
            variant={showHidden ? "contained" : "outlined"}
            size="small"
            startIcon={showHidden ? <Visibility /> : <VisibilityOff />}
            onClick={() => setShowHidden(!showHidden)}
          >
            {showHidden ? '非表示リストを隠す' : `非表示リスト (${hiddenEvents.size}件)`}
          </Button>
        </Box>
      </Box>

      {events.length === 0 ? (
        <Alert severity="info">
          今後7日間の会議がありません。
        </Alert>
      ) : (
        <>
          <Grid container spacing={2}>
            {events
              .filter(event => showHidden ? hiddenEvents.has(event.id) : !hiddenEvents.has(event.id))
              .map((event) => {
                const isHidden = hiddenEvents.has(event.id);
                return (
              <Grid item xs={12} key={event.id}>
                <Card
                  sx={{
                    border: selectedEvents.has(event.id) ? 2 : 1,
                    borderColor: selectedEvents.has(event.id) ? 'primary.main' : 'grey.300'
                  }}
                >
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={selectedEvents.has(event.id)}
                            onChange={() => handleSelectEvent(event.id)}
                          />
                        }
                        label=""
                      />
                      <Box sx={{ flexGrow: 1 }}>
                        <Typography variant="h6" gutterBottom sx={{ wordBreak: 'break-word', whiteSpace: 'pre-wrap' }}>
                          {event.title}
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

                        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                          <Button
                            variant="outlined"
                            size="small"
                            onClick={() => handleOpenUrlDialog(event.id)}
                          >
                            企業URLを追加 ({companyUrls[event.id]?.split('\n').filter(u => u.trim()).length || 0}件)
                          </Button>
                          {isHidden ? (
                            <Button
                              variant="outlined"
                              size="small"
                              color="success"
                              startIcon={<Visibility />}
                              onClick={() => handleUnhideEvent(event.id)}
                            >
                              表示
                            </Button>
                          ) : (
                            <Button
                              variant="outlined"
                              size="small"
                              color="warning"
                              startIcon={<VisibilityOff />}
                              onClick={() => handleHideEvent(event.id)}
                            >
                              非表示
                            </Button>
                          )}
                        </Box>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            );
              })}
          </Grid>

          <Box sx={{ mt: 3, display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Button
              variant="outlined"
              size="large"
              color="primary"
              startIcon={previewing ? <CircularProgress size={20} /> : <Preview />}
              onClick={handlePreviewProposal}
              disabled={selectedEvents.size === 0 || selectedEvents.size > 1 || previewing}
            >
              {previewing ? 'プレビュー生成中...' : 'プレビュー生成（1件のみ）'}
            </Button>
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

      {/* プレビューダイアログ */}
      <Dialog open={previewDialogOpen} onClose={() => setPreviewDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>提案資料プレビュー</DialogTitle>
        <DialogContent>
          {previewContent ? (
            <Box>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                生成された提案資料の内容:
              </Typography>
              <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1, maxHeight: '60vh', overflow: 'auto' }}>
                <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', margin: 0, fontFamily: 'inherit' }}>
                  {JSON.stringify(previewContent, null, 2)}
                </pre>
              </Box>
            </Box>
          ) : (
            <Typography>プレビューデータがありません</Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPreviewDialogOpen(false)}>閉じる</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
