// GoLong Mobile App Types

export interface User {
  id: string;
  username: string;
  display_name?: string;
  avatar_url?: string;
  bio?: string;
  created_at: string;
  updated_at: string;
}

export interface Streak {
  id: string;
  title: string;
  description?: string;
  category?: string;
  is_public: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
  tags: string[];
  is_active: boolean;
  current_streak_days: number;
  longest_streak_days: number;
  last_checkin_date?: string;
  joined_at: string;
  user_streak_id: string;
  profiles?: User;
}

export interface Checkin {
  id: string;
  user_streak_id: string;
  checkin_date: string;
  created_at: string;
}

export interface Comment {
  id: string;
  streak_id: string;
  user_id: string;
  content: string;
  created_at: string;
  updated_at: string;
  user?: User;
}

export interface Like {
  id: string;
  streak_id: string;
  user_id: string;
  created_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  type: 'streak_reminder' | 'milestone' | 'comment' | 'like' | 'follow' | 'challenge' | 'group_invite';
  title: string;
  message: string;
  data?: any;
  read: boolean;
  created_at: string;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon?: string;
  criteria: any;
  created_at: string;
}

export interface Group {
  id: string;
  name: string;
  description?: string;
  category?: string;
  max_members: number;
  is_private: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
  profiles?: User;
}

export interface Challenge {
  id: string;
  name: string;
  description: string;
  category: string;
  duration_days: number;
  start_date: string;
  end_date: string;
  max_participants?: number;
  prize_description?: string;
  rules?: string;
  created_by: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  profiles?: User;
}

// API Response Types
export interface ApiResponse<T> {
  data: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  has_more: boolean;
}

// Navigation Types
export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
};

export type MainTabParamList = {
  Home: undefined;
  MyStreaks: undefined;
  Explore: undefined;
  Profile: undefined;
};

export type StreakStackParamList = {
  StreakList: undefined;
  StreakDetail: { streakId: string };
  CreateStreak: undefined;
  EditStreak: { streakId: string };
};

// Form Types
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  username: string;
}

export interface CreateStreakData {
  title: string;
  description?: string;
  category?: string;
  is_public?: boolean;
  tags?: string[];
}

export interface CreateCheckinData {
  user_streak_id: string;
  checkin_date: string;
}

export interface CreateCommentData {
  streak_id: string;
  content: string;
}

// State Types
export interface AuthState {
  user: User | null;
  token: string | null;
  loading: boolean;
  error: string | null;
}

export interface StreaksState {
  streaks: Streak[];
  activeStreaks: Streak[];
  loading: boolean;
  refreshing: boolean;
  error: string | null;
}

export interface CheckinsState {
  checkins: Checkin[];
  loading: boolean;
  error: string | null;
}

export interface CommentsState {
  comments: Comment[];
  loading: boolean;
  error: string | null;
}

export interface NotificationsState {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  error: string | null;
}



