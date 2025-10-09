import { useQuery } from '@tanstack/react-query'
import axios from 'axios'
import { Meeting } from '@/types/meeting'
import { logger } from '@/lib/logger'

// ヘルパー関数: 会議の長さを計算（分単位）
const calculateDuration = (start: string, end: string): number => {
  return (new Date(end).getTime() - new Date(start).getTime()) / (1000 * 60)
}

// ヘルパー関数: 有効なタイトルかチェック
const hasValidTitle = (title?: string): boolean => {
  if (!title?.trim()) return false
  const invalidTitles = ['タイトルなし', '移動']
  return !invalidTitles.some(invalid => title.includes(invalid))
}

// ヘルパー関数: 重要な会議かチェック
const isImportantMeeting = (meeting: Meeting): boolean => {
  const keywords = ['打ち合わせ', '株式会社', '会議', 'ミーティング']
  const content = `${meeting.title || ''} ${meeting.description || ''}`
  return keywords.some(keyword => content.includes(keyword))
}

const fetchMeetings = async (): Promise<Meeting[]> => {
  try {
    // calendar/events-v2エンドポイントを使用（改良版）
    const { data } = await axios.get('/api/calendar/events-v2')
    logger.debug('Fetched meetings from events-v2', { context: 'useMeetings', data: { count: data?.length } })

    if (!Array.isArray(data)) return []

    // フィルタリング: 15分以下の会議とタイトルなしの会議を除外
    const filteredMeetings = data.filter((meeting: Meeting) => {
      const duration = calculateDuration(meeting.start_time, meeting.end_time)
      return (duration > 15 && hasValidTitle(meeting.title)) || isImportantMeeting(meeting)
    })

    return filteredMeetings
  } catch (error) {
    logger.error('Error fetching meetings', error, { context: 'useMeetings' })
    return []
  }
}

export function useMeetings() {
  const { data: meetings, isLoading, error, refetch } = useQuery({
    queryKey: ['meetings'],
    queryFn: fetchMeetings,
    refetchInterval: 5 * 60 * 1000, // 5分ごとに更新（カレンダーイベントは頻繁に変更されない）
    refetchOnWindowFocus: true,
    staleTime: 2 * 60 * 1000, // 2分でstaleに
  })

  return {
    meetings: meetings || [],
    isLoading,
    error,
    refetch
  }
}