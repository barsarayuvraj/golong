// GoLong Mobile App Constants

export const colors = {
  primary: {
    main: '#2196F3',
    light: '#64B5F6',
    dark: '#1976D2',
    contrast: '#FFFFFF'
  },
  secondary: {
    main: '#FF9800',
    light: '#FFB74D',
    dark: '#F57C00',
    contrast: '#FFFFFF'
  },
  success: {
    main: '#4CAF50',
    light: '#81C784',
    dark: '#388E3C',
    contrast: '#FFFFFF'
  },
  error: {
    main: '#F44336',
    light: '#E57373',
    dark: '#D32F2F',
    contrast: '#FFFFFF'
  },
  warning: {
    main: '#FF9800',
    light: '#FFB74D',
    dark: '#F57C00',
    contrast: '#FFFFFF'
  },
  info: {
    main: '#2196F3',
    light: '#64B5F6',
    dark: '#1976D2',
    contrast: '#FFFFFF'
  },
  neutral: {
    white: '#FFFFFF',
    black: '#000000',
    grey50: '#FAFAFA',
    grey100: '#F5F5F5',
    grey200: '#EEEEEE',
    grey300: '#E0E0E0',
    grey400: '#BDBDBD',
    grey500: '#9E9E9E',
    grey600: '#757575',
    grey700: '#616161',
    grey800: '#424242',
    grey900: '#212121'
  }
};

export const typography = {
  h1: {
    fontSize: 32,
    fontWeight: 'bold' as const,
    lineHeight: 40
  },
  h2: {
    fontSize: 28,
    fontWeight: 'bold' as const,
    lineHeight: 36
  },
  h3: {
    fontSize: 24,
    fontWeight: 'bold' as const,
    lineHeight: 32
  },
  h4: {
    fontSize: 20,
    fontWeight: '600' as const,
    lineHeight: 28
  },
  h5: {
    fontSize: 18,
    fontWeight: '600' as const,
    lineHeight: 24
  },
  h6: {
    fontSize: 16,
    fontWeight: '600' as const,
    lineHeight: 22
  },
  body1: {
    fontSize: 16,
    fontWeight: 'normal' as const,
    lineHeight: 24
  },
  body2: {
    fontSize: 14,
    fontWeight: 'normal' as const,
    lineHeight: 20
  },
  caption: {
    fontSize: 12,
    fontWeight: 'normal' as const,
    lineHeight: 16
  },
  button: {
    fontSize: 16,
    fontWeight: '600' as const,
    lineHeight: 24
  }
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48
};

export const API_CONFIG = {
  BASE_URL: process.env.EXPO_PUBLIC_API_URL || 'https://your-api-domain.com/api',
  TIMEOUT: 10000,
  RETRY_ATTEMPTS: 3
};

export const STORAGE_KEYS = {
  AUTH_TOKEN: 'auth_token',
  USER_DATA: 'user_data',
  BIOMETRIC_ENABLED: 'biometric_enabled',
  OFFLINE_CHECKINS: 'offline_checkins',
  NOTIFICATION_SETTINGS: 'notification_settings'
};

export const NOTIFICATION_TYPES = {
  STREAK_REMINDER: 'streak_reminder',
  MILESTONE: 'milestone',
  COMMENT: 'comment',
  LIKE: 'like',
  FOLLOW: 'follow',
  CHALLENGE: 'challenge',
  GROUP_INVITE: 'group_invite'
} as const;

export const STREAK_CATEGORIES = [
  'Health',
  'Fitness',
  'Learning',
  'Productivity',
  'Wellness',
  'Social',
  'Creative',
  'Financial',
  'Other'
] as const;

export const APP_CONFIG = {
  NAME: process.env.EXPO_PUBLIC_APP_NAME || 'GoLong',
  VERSION: process.env.EXPO_PUBLIC_APP_VERSION || '1.0.0',
  SUPPORTED_LANGUAGES: ['en'],
  DEFAULT_LANGUAGE: 'en'
};



