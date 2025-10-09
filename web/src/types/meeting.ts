export interface Attendee {
  email: string
  name?: string
  company_id?: string
  is_external: boolean
}

export interface Proposal {
  id: string
  status: string
  presentation_url?: string
}

export interface Meeting {
  id: string
  google_event_id: string
  title: string
  description?: string
  start_time: string
  end_time: string
  location?: string
  meeting_url?: string
  is_enabled: boolean
  status: string
  attendees?: Attendee[]
  proposals?: Proposal[]
}
