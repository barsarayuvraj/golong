// Database types for GoLong app

export interface Profile {
  id: string
  username: string
  display_name?: string
  avatar_url?: string
  bio?: string
  created_at: string
  updated_at: string
}

export interface Streak {
  id: string
  title: string
  description?: string
  category?: string
  is_public: boolean
  created_by: string
  created_at: string
  updated_at: string
  tags: string[]
  is_active: boolean
  // Joined fields
  profiles?: Profile
  user_streaks?: UserStreak[]
  _count?: {
    user_streaks: number
  }
}

export interface UserStreak {
  id: string
  user_id: string
  streak_id: string
  current_streak_days: number
  longest_streak_days: number
  last_checkin_date?: string
  joined_at: string
  is_active: boolean
  // Joined fields
  profiles?: Profile
  streaks?: Streak
  checkins?: Checkin[]
}

export interface Checkin {
  id: string
  user_streak_id: string
  checkin_date: string
  created_at: string
}

export interface Report {
  id: string
  reporter_id: string
  streak_id: string
  reason: string
  description?: string
  created_at: string
  status: 'pending' | 'resolved' | 'dismissed'
}

export interface Comment {
  id: string
  streak_id: string
  user_id: string
  content: string
  created_at: string
  updated_at: string
  // Joined fields
  user?: Profile
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
  type: 'streak_reminder' | 'milestone' | 'comment' | 'like' | 'follow' | 'follow_request'
  title: string
  message: string
  data?: any
  read: boolean
  created_at: string
}

export interface NotificationPreferences {
  id: string
  user_id: string
  email_notifications: boolean
  push_notifications: boolean
  streak_reminders: boolean
  milestone_notifications: boolean
  social_notifications: boolean
  created_at: string
  updated_at: string
}

export interface Achievement {
  id: string
  name: string
  description: string
  icon?: string
  criteria: any
  created_at: string
}

export interface UserAchievement {
  id: string
  user_id: string
  achievement_id: string
  earned_at: string
  // Joined fields
  achievement?: Achievement
}

export interface StreakTemplate {
  id: string
  name: string
  description: string
  category: string
  suggested_duration?: number
  tags: string[]
  is_popular: boolean
  created_at: string
}

// API Response types
export interface CreateStreakData {
  title: string
  description?: string
  category?: string
  is_public?: boolean
  tags?: string[]
}

export interface JoinStreakData {
  streak_id: string
}

export interface CheckinData {
  user_streak_id: string
  checkin_date: string
}

export interface ReportData {
  streak_id: string
  reason: string
  description?: string
}

// Leaderboard types
export interface LeaderboardEntry {
  user_id: string
  username: string
  display_name?: string
  avatar_url?: string
  current_streak_days: number
  longest_streak_days: number
  last_checkin_date?: string
  joined_at: string
}

// Search and filter types
export interface StreakFilters {
  category?: string
  tags?: string[]
  is_public?: boolean
  search?: string
  sort_by?: 'created_at' | 'popularity' | 'title'
  sort_order?: 'asc' | 'desc'
}
