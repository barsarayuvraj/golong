import { createClient } from '@/lib/supabase-client'

// Base API configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000')

// Helper function to get auth headers
async function getAuthHeaders() {
  try {
    const supabase = createClient()
    const { data: { session }, error } = await supabase.auth.getSession()
    
    if (error) {
      console.error('Error getting session:', error)
      throw new Error('Failed to get authentication session')
    }
    
    if (!session?.access_token) {
      console.error('No access token found in session')
      throw new Error('No authentication token found')
    }
    
    console.log('Auth headers created successfully')
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`
    }
  } catch (error) {
    console.error('Error creating auth headers:', error)
    throw error
  }
}

// Generic API request function
async function apiRequest<T>(
  endpoint: string, 
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`
  const headers = await getAuthHeaders()
  
  const response = await fetch(url, {
    ...options,
    headers: {
      ...headers,
      ...options.headers,
    },
  })
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`)
  }
  
  return response.json()
}

// API Service Class
export class ApiService {
  // Streaks API
  static async getStreaks(params?: {
    limit?: number
    offset?: number
    category?: string
    is_public?: boolean
  }) {
    const searchParams = new URLSearchParams()
    if (params?.limit) searchParams.set('limit', params.limit.toString())
    if (params?.offset) searchParams.set('offset', params.offset.toString())
    if (params?.category) searchParams.set('category', params.category)
    if (params?.is_public !== undefined) searchParams.set('is_public', params.is_public.toString())
    
    const query = searchParams.toString()
    return apiRequest(`/api/streaks${query ? `?${query}` : ''}`)
  }

  static async getStreak(id: string) {
    console.log('Fetching streak with ID:', id)
    try {
      const result = await apiRequest(`/api/streaks/${id}`)
      console.log('Streak fetch result:', result)
      return result
    } catch (error) {
      console.error('Error fetching streak:', error)
      throw error
    }
  }

  static async getPopularStreaks(params?: {
    limit?: number
    offset?: number
  }) {
    const searchParams = new URLSearchParams()
    if (params?.limit) searchParams.set('limit', params.limit.toString())
    if (params?.offset) searchParams.set('offset', params.offset.toString())
    
    const query = searchParams.toString()
    return apiRequest(`/api/streaks/popular${query ? `?${query}` : ''}`)
  }

  static async createStreak(data: {
    title: string
    description: string
    category: string
    is_public: boolean
    tags?: string[]
  }) {
    return apiRequest('/api/streaks', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  static async joinStreak(streakId: string) {
    return apiRequest(`/api/streaks/${streakId}/join`, {
      method: 'POST',
    })
  }

  static async leaveStreak(streakId: string) {
    return apiRequest(`/api/streaks/${streakId}/leave`, {
      method: 'POST',
    })
  }

  // Check-ins API
  static async getCheckins(params?: {
    user_streak_id?: string
    streak_id?: string
    limit?: number
    offset?: number
  }) {
    const searchParams = new URLSearchParams()
    if (params?.user_streak_id) searchParams.set('user_streak_id', params.user_streak_id)
    if (params?.streak_id) searchParams.set('streak_id', params.streak_id)
    if (params?.limit) searchParams.set('limit', params.limit.toString())
    if (params?.offset) searchParams.set('offset', params.offset.toString())
    
    const query = searchParams.toString()
    return apiRequest(`/api/checkins${query ? `?${query}` : ''}`)
  }

  static async createCheckin(data: {
    user_streak_id: string
    checkin_date: string
  }) {
    return apiRequest('/api/checkins', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  // Comments API
  static async getComments(streakId: string, params?: {
    limit?: number
    offset?: number
  }) {
    const searchParams = new URLSearchParams()
    searchParams.set('streak_id', streakId)
    if (params?.limit) searchParams.set('limit', params.limit.toString())
    if (params?.offset) searchParams.set('offset', params.offset.toString())
    
    return apiRequest(`/api/comments?${searchParams.toString()}`)
  }

  static async createComment(data: {
    streak_id: string
    content: string
  }) {
    return apiRequest('/api/comments', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  static async updateComment(commentId: string, data: {
    content: string
  }) {
    return apiRequest(`/api/comments?id=${commentId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  static async deleteComment(commentId: string) {
    return apiRequest(`/api/comments?id=${commentId}`, {
      method: 'DELETE',
    })
  }

  // Likes API
  static async getLikes(streakId: string, params?: {
    check_user_like?: boolean
  }) {
    const searchParams = new URLSearchParams()
    searchParams.set('streak_id', streakId)
    if (params?.check_user_like) searchParams.set('check_user_like', 'true')
    
    return apiRequest(`/api/likes?${searchParams.toString()}`)
  }

  static async createLike(data: {
    streak_id: string
  }) {
    return apiRequest('/api/likes', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  static async deleteLike(streakId: string) {
    return apiRequest(`/api/likes?streak_id=${streakId}`, {
      method: 'DELETE',
    })
  }

  // Notifications API
  static async getNotifications(params?: {
    limit?: number
    offset?: number
    unread_only?: boolean
  }) {
    const searchParams = new URLSearchParams()
    if (params?.limit) searchParams.set('limit', params.limit.toString())
    if (params?.offset) searchParams.set('offset', params.offset.toString())
    if (params?.unread_only) searchParams.set('unread_only', 'true')
    
    const query = searchParams.toString()
    return apiRequest(`/api/notifications${query ? `?${query}` : ''}`)
  }

  static async markNotificationAsRead(notificationId: string) {
    return apiRequest(`/api/notifications?id=${notificationId}`, {
      method: 'PUT',
      body: JSON.stringify({ read: true }),
    })
  }

  static async markAllNotificationsAsRead() {
    return apiRequest('/api/notifications', {
      method: 'PUT',
      body: JSON.stringify({ mark_all_read: true }),
    })
  }

  // Achievements API
  static async getAchievements(params?: {
    user_achievements?: boolean
  }) {
    const searchParams = new URLSearchParams()
    if (params?.user_achievements) searchParams.set('user_achievements', 'true')
    
    const query = searchParams.toString()
    return apiRequest(`/api/achievements${query ? `?${query}` : ''}`)
  }

  static async checkAchievements() {
    return apiRequest('/api/achievements/check', {
      method: 'POST',
    })
  }

  // Analytics API
  static async getAnalytics(params?: {
    metric?: 'streaks' | 'checkins' | 'achievements' | 'social' | 'overview'
    period?: 'day' | 'week' | 'month' | 'year'
    start_date?: string
    end_date?: string
  }) {
    const searchParams = new URLSearchParams()
    if (params?.metric) searchParams.set('metric', params.metric)
    if (params?.period) searchParams.set('period', params.period)
    if (params?.start_date) searchParams.set('start_date', params.start_date)
    if (params?.end_date) searchParams.set('end_date', params.end_date)
    
    const query = searchParams.toString()
    return apiRequest(`/api/analytics${query ? `?${query}` : ''}`)
  }

  // Challenges API
  static async getChallenges(params?: {
    limit?: number
    offset?: number
    status?: 'active' | 'upcoming' | 'completed'
  }) {
    const searchParams = new URLSearchParams()
    if (params?.limit) searchParams.set('limit', params.limit.toString())
    if (params?.offset) searchParams.set('offset', params.offset.toString())
    if (params?.status) searchParams.set('status', params.status)
    
    const query = searchParams.toString()
    return apiRequest(`/api/challenges${query ? `?${query}` : ''}`)
  }

  static async createChallenge(data: {
    title: string
    description: string
    start_date: string
    end_date: string
    target_streaks?: number
    reward?: string
  }) {
    return apiRequest('/api/challenges', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  static async joinChallenge(challengeId: string) {
    return apiRequest(`/api/challenges/${challengeId}/join`, {
      method: 'POST',
    })
  }

  // Groups API
  static async getGroups(params?: {
    limit?: number
    offset?: number
    my_groups?: boolean
  }) {
    const searchParams = new URLSearchParams()
    if (params?.limit) searchParams.set('limit', params.limit.toString())
    if (params?.offset) searchParams.set('offset', params.offset.toString())
    if (params?.my_groups) searchParams.set('my_groups', 'true')
    
    const query = searchParams.toString()
    return apiRequest(`/api/groups${query ? `?${query}` : ''}`)
  }

  static async createGroup(data: {
    name: string
    description: string
    is_public: boolean
    max_members?: number
  }) {
    return apiRequest('/api/groups', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  static async joinGroup(groupId: string) {
    return apiRequest(`/api/groups/${groupId}/join`, {
      method: 'POST',
    })
  }

  // Reminders API
  static async getReminders(params?: {
    limit?: number
    offset?: number
    active_only?: boolean
  }) {
    const searchParams = new URLSearchParams()
    if (params?.limit) searchParams.set('limit', params.limit.toString())
    if (params?.offset) searchParams.set('offset', params.offset.toString())
    if (params?.active_only) searchParams.set('active_only', 'true')
    
    const query = searchParams.toString()
    return apiRequest(`/api/reminders${query ? `?${query}` : ''}`)
  }

  static async createReminder(data: {
    user_streak_id: string
    reminder_time: string
    days_of_week: number[]
    is_active: boolean
  }) {
    return apiRequest('/api/reminders', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  // Export API
  static async getExportJobs(params?: {
    limit?: number
    offset?: number
    status?: 'pending' | 'processing' | 'completed' | 'failed'
  }) {
    const searchParams = new URLSearchParams()
    if (params?.limit) searchParams.set('limit', params.limit.toString())
    if (params?.offset) searchParams.set('offset', params.offset.toString())
    if (params?.status) searchParams.set('status', params.status)
    
    const query = searchParams.toString()
    return apiRequest(`/api/export${query ? `?${query}` : ''}`)
  }

  static async createExportJob(data: {
    format: 'json' | 'csv' | 'pdf'
    data_types: string[]
    date_range?: {
      start_date: string
      end_date: string
    }
  }) {
    return apiRequest('/api/export', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }
}

// Export types for better TypeScript support
export interface Streak {
  id: string
  title: string
  description: string
  category: string
  is_public: boolean
  tags: string[]
  created_by: string
  created_at: string
  updated_at: string
  participant_count: number
}

export interface Comment {
  id: string
  streak_id: string
  user_id: string
  content: string
  created_at: string
  updated_at: string
  profiles?: {
    username: string
    display_name: string
    avatar_url: string
  }
}

export interface Like {
  id: string
  streak_id: string
  user_id: string
  created_at: string
}

export interface Notification {
  id: string
  user_id: string
  type: string
  title: string
  message: string
  read: boolean
  data: any
  created_at: string
}

export interface Achievement {
  id: string
  name: string
  description: string
  icon: string
  criteria: any
  points: number
}

export interface UserAchievement {
  id: string
  user_id: string
  achievement_id: string
  earned_at: string
  achievements: Achievement
}

export interface Analytics {
  period: string
  start_date: string
  end_date: string
  generated_at: string
  streaks?: {
    total: number
    active: number
    longest: number
    longest_streak_name: string
    current_streaks: Array<{
      days: number
      name: string
    }>
  }
  checkins?: {
    total: number
    in_period: number
    daily_data: Array<{
      date: string
      count: number
    }>
  }
  achievements?: {
    total: number
    recent: Array<{
      name: string
      description: string
      icon: string
      earned_at: string
    }>
  }
  social?: {
    comments_made: number
    likes_given: number
    likes_received: number
    groups_joined: number
  }
  consistency?: {
    current_total_days: number
    longest_total_days: number
    average_current_streak: number
    average_longest_streak: number
  }
}
