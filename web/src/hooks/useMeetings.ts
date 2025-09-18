import { useQuery } from '@tanstack/react-query'
import axios from 'axios'

interface Meeting {
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
  attendees?: Array<{
    email: string
    name?: string
    company_id?: string
    is_external: boolean
  }>
  proposals?: Array<{
    id: string
    status: string
    presentation_url?: string
  }>
}

const fetchMeetings = async (): Promise<Meeting[]> => {
  const { data } = await axios.get('/api/meetings')
  return data
}

export function useMeetings() {
  const { data: meetings, isLoading, error, refetch } = useQuery({
    queryKey: ['meetings'],
    queryFn: fetchMeetings,
    refetchInterval: 60000,
    refetchOnWindowFocus: true,
  })

  return {
    meetings: meetings || [],
    isLoading,
    error,
    refetch
  }
}