// イベントデータを整形 + 外部参加者判定
const items = $input.all();
const events = items[0].json.items || [];

const internalDomains = ['gmail.com', 'googlemail.com', 'yasuus-projects.vercel.app'];

return events.map(event => {
  const attendees = (event.attendees || []).map(a => ({
    email: a.email,
    name: a.displayName || a.email.split('@')[0],
    response: a.responseStatus || 'needsAction',
    is_organizer: a.organizer || false,
    domain: a.email.split('@')[1]
  }));

  // 外部参加者の抽出
  const externalAttendees = attendees.filter(a =>
    !internalDomains.includes(a.domain)
  );

  // 会議の期間計算
  const start = new Date(event.start?.dateTime || event.start?.date);
  const end = new Date(event.end?.dateTime || event.end?.date);
  const durationMinutes = (end - start) / 1000 / 60;

  return {
    json: {
      event_id: event.id,
      summary: event.summary || 'タイトルなし',
      description: event.description || '',
      start_time: event.start?.dateTime || event.start?.date,
      end_time: event.end?.dateTime || event.end?.date,
      location: event.location || '',
      meeting_url: event.hangoutLink || '',
      organizer_email: event.organizer?.email || '',
      attendees: attendees,
      external_attendees: externalAttendees,
      has_external_attendees: externalAttendees.length > 0,
      external_count: externalAttendees.length,
      duration_minutes: durationMinutes,
      is_important: durationMinutes >= 30 && externalAttendees.length > 0,
      status: event.status || 'confirmed',
      raw_data: event,
      synced_at: new Date().toISOString()
    }
  };
});
