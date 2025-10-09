// Database table types

export type MeetingStatus = 'scheduled' | 'completed' | 'cancelled' | 'rescheduled'

export interface DatabaseMeeting {
  google_event_id: string
  title: string
  description: string
  start_time: string | null | undefined
  end_time: string | null | undefined
  location: string
  meeting_url: string
  organizer_email: string
  is_enabled: boolean
  status: MeetingStatus
  attendees: unknown[]
  created_at: string
  updated_at: string
}

export interface SyncResult {
  success: boolean
  eventsCount?: number
  savedCount?: number
  error?: string
  lastSync: string
}
