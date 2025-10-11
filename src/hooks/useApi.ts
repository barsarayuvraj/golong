import { useState, useEffect, useCallback } from 'react'
import { ApiService, Streak, Comment, Like, Notification, Achievement, Analytics } from '@/lib/api'

// Generic hook for API calls with loading and error states
function useApiCall<T>(
  apiCall: () => Promise<T>,
  dependencies: any[] = []
) {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const execute = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const result = await apiCall()
      setData(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }, dependencies)

  useEffect(() => {
    execute()
  }, [execute])

  return { data, loading, error, refetch: execute }
}

// Streaks hooks
export function useStreaks(params?: {
  limit?: number
  offset?: number
  category?: string
  is_public?: boolean
}) {
  return useApiCall(
    () => ApiService.getStreaks(params),
    [params?.limit, params?.offset, params?.category, params?.is_public]
  )
}

export function useStreak(id: string) {
  return useApiCall(
    () => ApiService.getStreak(id),
    [id]
  )
}

export function useLeaderboard(streakId: string) {
  return useApiCall(
    () => ApiService.getLeaderboard(streakId),
    [streakId]
  )
}

export function useStreakStats(streakId: string) {
  return useApiCall(
    () => ApiService.getStreakStats(streakId),
    [streakId]
  )
}

export function usePopularStreaks(params?: {
  limit?: number
  offset?: number
}) {
  return useApiCall(
    () => ApiService.getPopularStreaks(params),
    [params?.limit, params?.offset]
  )
}

export function useInfinitePopularStreaks(limit: number = 12) {
  const [streaks, setStreaks] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState(true)
  const [offset, setOffset] = useState(0)

  const loadInitialData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const result = await ApiService.getPopularStreaks({ limit, offset: 0 })
      setStreaks(result.streaks || [])
      setHasMore(result.hasMore || false)
      setOffset(limit)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }, [limit])

  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore) return

    try {
      setLoadingMore(true)
      const result = await ApiService.getPopularStreaks({ limit, offset })
      setStreaks(prev => [...prev, ...(result.streaks || [])])
      setHasMore(result.hasMore || false)
      setOffset(prev => prev + limit)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load more streaks')
    } finally {
      setLoadingMore(false)
    }
  }, [limit, offset, loadingMore, hasMore])

  useEffect(() => {
    loadInitialData()
  }, [loadInitialData])

  return { 
    streaks, 
    loading, 
    loadingMore,
    error, 
    hasMore,
    loadMore,
    refetch: loadInitialData
  }
}

export function useCreateStreak() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const createStreak = useCallback(async (data: {
    title: string
    description: string
    category: string
    is_public: boolean
    tags?: string[]
  }) => {
    try {
      setLoading(true)
      setError(null)
      const result = await ApiService.createStreak(data)
      return result
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create streak')
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  return { createStreak, loading, error }
}

export function useJoinStreak() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const joinStreak = useCallback(async (streakId: string) => {
    try {
      setLoading(true)
      setError(null)
      const result = await ApiService.joinStreak(streakId)
      return result
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to join streak')
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  return { joinStreak, loading, error }
}

// Check-ins hooks
export function useCheckins(params?: {
  user_streak_id?: string
  streak_id?: string
  limit?: number
  offset?: number
}) {
  return useApiCall(
    () => ApiService.getCheckins(params),
    [params?.user_streak_id, params?.streak_id, params?.limit, params?.offset]
  )
}

export function useCreateCheckin() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const createCheckin = useCallback(async (data: {
    user_streak_id: string
    checkin_date: string
  }) => {
    try {
      setLoading(true)
      setError(null)
      const result = await ApiService.createCheckin(data)
      return result
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create check-in')
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  return { createCheckin, loading, error }
}

// Comments hooks
export function useComments(streakId: string, params?: {
  limit?: number
  offset?: number
}) {
  return useApiCall(
    () => ApiService.getComments(streakId, params),
    [streakId, params?.limit, params?.offset]
  )
}

export function useCreateComment() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const createComment = useCallback(async (data: {
    streak_id: string
    content: string
  }) => {
    try {
      setLoading(true)
      setError(null)
      const result = await ApiService.createComment(data)
      return result
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create comment')
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  return { createComment, loading, error }
}

export function useUpdateComment() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const updateComment = useCallback(async (commentId: string, data: {
    content: string
  }) => {
    try {
      setLoading(true)
      setError(null)
      const result = await ApiService.updateComment(commentId, data)
      return result
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update comment')
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  return { updateComment, loading, error }
}

export function useRecentActivity(streakId: string) {
  return useApiCall(
    () => ApiService.getRecentActivity(streakId),
    [streakId]
  )
}

export function useNotes(streakId: string) {
  return useApiCall(
    () => ApiService.getNotes(streakId),
    [streakId]
  )
}

export function useCreateNote() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const createNote = useCallback(async (data: {
    streak_id: string
    content: string
  }) => {
    try {
      setLoading(true)
      setError(null)
      const result = await ApiService.createNote(data)
      return result
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create note')
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  return { createNote, loading, error }
}

export function useUpdateNote() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const updateNote = useCallback(async (noteId: string, data: { content: string }) => {
    try {
      setLoading(true)
      setError(null)
      const result = await ApiService.updateNote(noteId, data)
      return result
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update note')
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  return { updateNote, loading, error }
}

export function useDeleteNote() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const deleteNote = useCallback(async (noteId: string) => {
    try {
      setLoading(true)
      setError(null)
      const result = await ApiService.deleteNote(noteId)
      return result
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete note')
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  return { deleteNote, loading, error }
}

export function useDeleteComment() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const deleteComment = useCallback(async (commentId: string) => {
    try {
      setLoading(true)
      setError(null)
      await ApiService.deleteComment(commentId)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete comment')
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  return { deleteComment, loading, error }
}

// Likes hooks
export function useLikes(streakId: string, params?: {
  check_user_like?: boolean
}) {
  return useApiCall(
    () => ApiService.getLikes(streakId, params),
    [streakId, params?.check_user_like]
  )
}

export function useCreateLike() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const createLike = useCallback(async (data: {
    streak_id: string
  }) => {
    try {
      setLoading(true)
      setError(null)
      const result = await ApiService.createLike(data)
      return result
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to like streak')
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  return { createLike, loading, error }
}

export function useDeleteLike() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const deleteLike = useCallback(async (streakId: string) => {
    try {
      setLoading(true)
      setError(null)
      await ApiService.deleteLike(streakId)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to unlike streak')
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  return { deleteLike, loading, error }
}

// Notifications hooks
export function useNotifications(params?: {
  limit?: number
  offset?: number
  unread_only?: boolean
}) {
  return useApiCall(
    () => ApiService.getNotifications(params),
    [params?.limit, params?.offset, params?.unread_only]
  )
}

export function useMarkNotificationAsRead() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      setLoading(true)
      setError(null)
      await ApiService.markNotificationAsRead(notificationId)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to mark notification as read')
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  return { markAsRead, loading, error }
}

export function useMarkAllNotificationsAsRead() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const markAllAsRead = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      await ApiService.markAllNotificationsAsRead()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to mark all notifications as read')
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  return { markAllAsRead, loading, error }
}

// Achievements hooks
export function useAchievements(params?: {
  user_achievements?: boolean
}) {
  return useApiCall(
    () => ApiService.getAchievements(params),
    [params?.user_achievements]
  )
}

export function useCheckAchievements() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const checkAchievements = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const result = await ApiService.checkAchievements()
      return result
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to check achievements')
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  return { checkAchievements, loading, error }
}

// Analytics hooks
export function useAnalytics(params?: {
  metric?: 'streaks' | 'checkins' | 'achievements' | 'social' | 'overview'
  period?: 'day' | 'week' | 'month' | 'year'
  start_date?: string
  end_date?: string
}) {
  return useApiCall(
    () => ApiService.getAnalytics(params),
    [params?.metric, params?.period, params?.start_date, params?.end_date]
  )
}

// Challenges hooks
export function useChallenges(params?: {
  limit?: number
  offset?: number
  status?: 'active' | 'upcoming' | 'completed'
}) {
  return useApiCall(
    () => ApiService.getChallenges(params),
    [params?.limit, params?.offset, params?.status]
  )
}

export function useCreateChallenge() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const createChallenge = useCallback(async (data: {
    title: string
    description: string
    start_date: string
    end_date: string
    target_streaks?: number
    reward?: string
  }) => {
    try {
      setLoading(true)
      setError(null)
      const result = await ApiService.createChallenge(data)
      return result
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create challenge')
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  return { createChallenge, loading, error }
}

export function useJoinChallenge() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const joinChallenge = useCallback(async (challengeId: string) => {
    try {
      setLoading(true)
      setError(null)
      const result = await ApiService.joinChallenge(challengeId)
      return result
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to join challenge')
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  return { joinChallenge, loading, error }
}

// Groups hooks
export function useGroups(params?: {
  limit?: number
  offset?: number
  my_groups?: boolean
}) {
  return useApiCall(
    () => ApiService.getGroups(params),
    [params?.limit, params?.offset, params?.my_groups]
  )
}

export function useCreateGroup() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const createGroup = useCallback(async (data: {
    name: string
    description: string
    is_public: boolean
    max_members?: number
  }) => {
    try {
      setLoading(true)
      setError(null)
      const result = await ApiService.createGroup(data)
      return result
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create group')
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  return { createGroup, loading, error }
}

export function useJoinGroup() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const joinGroup = useCallback(async (groupId: string) => {
    try {
      setLoading(true)
      setError(null)
      const result = await ApiService.joinGroup(groupId)
      return result
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to join group')
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  return { joinGroup, loading, error }
}

// Reminders hooks
export function useReminders(params?: {
  limit?: number
  offset?: number
  active_only?: boolean
}) {
  return useApiCall(
    () => ApiService.getReminders(params),
    [params?.limit, params?.offset, params?.active_only]
  )
}

export function useCreateReminder() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const createReminder = useCallback(async (data: {
    user_streak_id: string
    reminder_time: string
    days_of_week: number[]
    is_active: boolean
  }) => {
    try {
      setLoading(true)
      setError(null)
      const result = await ApiService.createReminder(data)
      return result
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create reminder')
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  return { createReminder, loading, error }
}

// Export hooks
export function useExportJobs(params?: {
  limit?: number
  offset?: number
  status?: 'pending' | 'processing' | 'completed' | 'failed'
}) {
  return useApiCall(
    () => ApiService.getExportJobs(params),
    [params?.limit, params?.offset, params?.status]
  )
}

export function useCreateExportJob() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const createExportJob = useCallback(async (data: {
    format: 'json' | 'csv' | 'pdf'
    data_types: string[]
    date_range?: {
      start_date: string
      end_date: string
    }
  }) => {
    try {
      setLoading(true)
      setError(null)
      const result = await ApiService.createExportJob(data)
      return result
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create export job')
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  return { createExportJob, loading, error }
}
