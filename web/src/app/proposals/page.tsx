'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
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
  const { data: session } = useSession();
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
    // 初回ロード時に自動同期してからイベントを取得
    autoSyncAndFetch();
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

  // 自動同期してからイベントを取得
  const autoSyncAndFetch = async () => {
    try {
      setLoading(true);

      // 最後の同期時刻をチェック
      const lastSync = localStorage.getItem('lastCalendarSync');
      const now = Date.now();
      const SYNC_INTERVAL = 2 * 24 * 60 * 60 * 1000; // 2日

      // 2日以内に同期済みの場合はスキップ
      if (lastSync && now - parseInt(lastSync) < SYNC_INTERVAL) {
        const lastSyncDate = new Date(parseInt(lastSync)).toLocaleString('ja-JP');
        console.log(`📅 最近同期済み（2日以内: ${lastSyncDate}）- スキップ`);
        await fetchEvents();
        return;
      }

      // カレンダーを自動同期
      console.log('🔄 カレンダーを自動同期中...');
      const syncResponse = await fetch('/api/calendar/auto-sync', {
        method: 'POST',
      });

      if (syncResponse.ok) {
        localStorage.setItem('lastCalendarSync', now.toString());
        console.log('✅ カレンダー同期完了 - 次回同期: 2日後');
      }

      // イベントを取得
      await fetchEvents();
    } catch (err: any) {
      console.error('自動同期エラー:', err);
      // エラーが発生してもイベントは取得
      await fetchEvents();
    }
  };

  const fetchEvents = async () => {
    try {
      // 今日から7日間のデータを取得
      const today = new Date().toISOString().split('T')[0];
      const response = await fetch(`/api/meetings?startDate=${today}&days=7`);
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
          user_email: session?.user?.email || undefined,
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
      const results: any[] = [];

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
            generate_slides: true, // スライド生成を有効化
            user_email: session?.user?.email || undefined
          })
        });

        if (!response.ok) {
          throw new Error(`Failed to generate proposal for ${event.title}`);
        }

        const result = await response.json();
        results.push(result);
      }

      // 成功メッセージとスライドURLを表示
      const slideUrls = results
        .filter(r => r.slide_url)
        .map(r => r.slide_url);

      if (slideUrls.length > 0) {
        setSuccess(`${selectedEvents.size}件の提案資料を生成しました。`);
        // 最初のスライドURLを開く（オプション）
        if (slideUrls.length === 1) {
          window.open(slideUrls[0], '_blank');
        }
      } else {
        setSuccess(`${selectedEvents.size}件の提案資料を処理しました。`);
      }

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
        <DialogTitle>
          提案資料プレビュー
          {previewContent?.company_name && (
            <Typography variant="body2" color="text.secondary">
              {previewContent.company_name}
            </Typography>
          )}
        </DialogTitle>
        <DialogContent>
          {previewContent ? (
            <Box>
              {/* 企業分析 */}
              {previewContent.company_analysis && (
                <Box sx={{ mb: 3, p: 2, bgcolor: 'primary.50', borderRadius: 1, borderLeft: 4, borderColor: 'primary.main' }}>
                  <Typography variant="subtitle2" color="primary.main" gutterBottom>
                    企業分析
                  </Typography>
                  <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                    {previewContent.company_analysis}
                  </Typography>
                </Box>
              )}

              {/* 提案内容（Markdown形式で表示） */}
              {previewContent.proposal_content && (
                <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                  <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 'bold' }}>
                    DX推進提案資料
                  </Typography>
                  <Box sx={{
                    mt: 2,
                    '& h2': { fontSize: '1.5rem', fontWeight: 'bold', mt: 2, mb: 1 },
                    '& h3': { fontSize: '1.25rem', fontWeight: 'bold', mt: 2, mb: 1, color: 'primary.main' },
                    '& ul': { pl: 3, mt: 1, mb: 1 },
                    '& li': { mb: 0.5 }
                  }}>
                    <Typography
                      variant="body2"
                      component="div"
                      sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.8 }}
                      dangerouslySetInnerHTML={{
                        __html: (() => {
                          const lines = previewContent.proposal_content.split('\n');
                          let html = '';
                          let inList = false;

                          lines.forEach((line: string, index: number) => {
                            if (line.startsWith('## ')) {
                              if (inList) {
                                html += '</ul>';
                                inList = false;
                              }
                              html += `<h2>${line.substring(3)}</h2>`;
                            } else if (line.startsWith('### ')) {
                              if (inList) {
                                html += '</ul>';
                                inList = false;
                              }
                              html += `<h3>${line.substring(4)}</h3>`;
                            } else if (line.startsWith('- ')) {
                              if (!inList) {
                                html += '<ul>';
                                inList = true;
                              }
                              html += `<li>${line.substring(2)}</li>`;
                            } else {
                              if (inList) {
                                html += '</ul>';
                                inList = false;
                              }
                              if (line.trim()) {
                                html += line + '\n';
                              }
                            }
                          });

                          if (inList) {
                            html += '</ul>';
                          }

                          return html;
                        })()
                      }}
                    />
                  </Box>
                </Box>
              )}

              {/* スライドリンク */}
              {previewContent.slide_url && (
                <Box sx={{ mt: 3, p: 2, bgcolor: 'success.50', borderRadius: 1, borderLeft: 4, borderColor: 'success.main' }}>
                  <Typography variant="subtitle2" color="success.main" gutterBottom>
                    プレゼンテーションスライド
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 2 }}>
                    Googleスライドが生成されました（{previewContent.slide_count || 0}枚）
                  </Typography>
                  <Button
                    variant="contained"
                    color="success"
                    href={previewContent.slide_url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Googleスライドを開く
                  </Button>
                </Box>
              )}

              {/* メタ情報 */}
              {previewContent.generated_at && (
                <Box sx={{ mt: 2, textAlign: 'right' }}>
                  <Typography variant="caption" color="text.secondary">
                    生成日時: {new Date(previewContent.generated_at).toLocaleString('ja-JP')}
                  </Typography>
                </Box>
              )}

              {/* デバッグ用：Raw JSON（開発時のみ表示） */}
              {process.env.NODE_ENV === 'development' && (
                <Box sx={{ mt: 3 }}>
                  <Typography variant="caption" color="text.secondary" gutterBottom>
                    デバッグ情報（開発環境のみ）:
                  </Typography>
                  <Box sx={{ p: 2, bgcolor: 'grey.100', borderRadius: 1, maxHeight: '200px', overflow: 'auto' }}>
                    <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', margin: 0, fontSize: '0.75rem' }}>
                      {JSON.stringify(previewContent, null, 2)}
                    </pre>
                  </Box>
                </Box>
              )}
            </Box>
          ) : (
            <Typography>プレビューデータがありません</Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPreviewDialogOpen(false)} variant="contained">閉じる</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
