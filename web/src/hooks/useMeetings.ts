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
  try {
    // calendar/events-v2エンドポイントを使用（改良版）
    const { data } = await axios.get('/api/calendar/events-v2')
    console.log('Fetched meetings from events-v2:', data)
    // データが配列でない場合は空配列を返す
    return Array.isArray(data) ? data : []
  } catch (error) {
    console.error('Error fetching meetings:', error)
    // エラー時は空配列を返す
    return []
  }
}

export function useMeetings() {
  const { data: meetings, isLoading, error, refetch } = useQuery({
    queryKey: ['meetings'],
    queryFn: fetchMeetings,
    refetchInterval: 3 * 60 * 60 * 1000, // 3時間ごと
    refetchOnWindowFocus: true,
  })

  return {
    meetings: meetings || [],
    isLoading,
    error,
    refetch
  }
}