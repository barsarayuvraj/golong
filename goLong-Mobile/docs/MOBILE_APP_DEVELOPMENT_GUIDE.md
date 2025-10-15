# GoLong Mobile App Development Guide

## Table of Contents
1. [Overview](#overview)
2. [Technology Stack Recommendations](#technology-stack-recommendations)
3. [Project Setup](#project-setup)
4. [Architecture Design](#architecture-design)
5. [Core Features Implementation](#core-features-implementation)
6. [UI/UX Design](#uiux-design)
7. [State Management](#state-management)
8. [API Integration](#api-integration)
9. [Authentication](#authentication)
10. [Push Notifications](#push-notifications)
11. [Offline Support](#offline-support)
12. [Performance Optimization](#performance-optimization)
13. [Testing Strategy](#testing-strategy)
14. [Deployment](#deployment)
15. [Platform-Specific Considerations](#platform-specific-considerations)

---

## Overview

This guide provides comprehensive instructions for building a mobile application for GoLong, a community-driven streak tracking app. The mobile app should maintain feature parity with the web application while providing an optimized mobile experience.

### Key Requirements
- **Cross-platform**: Support both iOS and Android
- **Real-time**: Live updates for social features
- **Offline**: Basic functionality without internet
- **Performance**: Smooth 60fps animations
- **Accessibility**: Screen reader support
- **Security**: Secure authentication and data storage

---

## Technology Stack Recommendations

### Primary Recommendation: React Native with Expo

#### Why Expo?
- **Rapid Development**: Fast iteration and testing
- **Built-in Features**: Camera, notifications, file system
- **Easy Deployment**: Over-the-air updates
- **Comprehensive SDK**: Rich native functionality
- **Community**: Large ecosystem and support

#### Alternative: Flutter
- **Single Codebase**: True cross-platform development
- **Performance**: Excellent native performance
- **UI Consistency**: Material Design and Cupertino widgets
- **Growing Ecosystem**: Rapidly expanding package ecosystem

### Recommended Stack

#### Core Framework
```json
{
  "expo": "~50.0.0",
  "react": "18.2.0",
  "react-native": "0.73.0",
  "typescript": "^5.0.0"
}
```

#### Navigation
```json
{
  "@react-navigation/native": "^6.1.0",
  "@react-navigation/bottom-tabs": "^6.5.0",
  "@react-navigation/stack": "^6.3.0",
  "@react-navigation/drawer": "^6.6.0"
}
```

#### State Management
```json
{
  "@reduxjs/toolkit": "^2.0.0",
  "react-redux": "^9.0.0",
  "@tanstack/react-query": "^5.0.0"
}
```

#### UI Components
```json
{
  "react-native-elements": "^3.4.0",
  "react-native-vector-icons": "^10.0.0",
  "react-native-paper": "^5.11.0",
  "react-native-animatable": "^1.3.0"
}
```

#### Networking & Storage
```json
{
  "axios": "^1.6.0",
  "@react-native-async-storage/async-storage": "^1.21.0",
  "react-native-keychain": "^8.1.0"
}
```

#### Native Features
```json
{
  "expo-camera": "~14.0.0",
  "expo-notifications": "~0.27.0",
  "expo-location": "~16.0.0",
  "expo-image-picker": "~14.0.0",
  "expo-device": "~5.9.0"
}
```

---

## Project Setup

### 1. Initialize Expo Project

```bash
# Install Expo CLI
npm install -g @expo/cli

# Create new project
expo init GoLongMobile --template blank-typescript

# Navigate to project
cd GoLongMobile

# Install dependencies
npm install
```

### 2. Project Structure

```
GoLongMobile/
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── common/         # Generic components
│   │   ├── forms/          # Form components
│   │   └── streak/         # Streak-specific components
│   ├── screens/            # Screen components
│   │   ├── auth/           # Authentication screens
│   │   ├── home/           # Home dashboard
│   │   ├── streaks/        # Streak management
│   │   ├── profile/        # User profile
│   │   └── social/         # Social features
│   ├── navigation/         # Navigation configuration
│   ├── services/           # API and external services
│   │   ├── api/            # API client
│   │   ├── auth/           # Authentication service
│   │   ├── storage/         # Local storage
│   │   └── notifications/   # Push notifications
│   ├── store/              # Redux store
│   │   ├── slices/         # Redux slices
│   │   └── middleware/      # Custom middleware
│   ├── hooks/              # Custom React hooks
│   ├── utils/              # Utility functions
│   ├── types/              # TypeScript types
│   └── constants/          # App constants
├── assets/                 # Images, fonts, etc.
├── app.json               # Expo configuration
├── package.json           # Dependencies
└── tsconfig.json          # TypeScript config
```

### 3. Configuration Files

#### app.json
```json
{
  "expo": {
    "name": "GoLong",
    "slug": "golong-mobile",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "userInterfaceStyle": "automatic",
    "splash": {
      "image": "./assets/splash.png",
      "resizeMode": "contain",
      "backgroundColor": "#ffffff"
    },
    "assetBundlePatterns": [
      "**/*"
    ],
    "ios": {
      "supportsTablet": true,
      "bundleIdentifier": "com.golong.mobile"
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#ffffff"
      },
      "package": "com.golong.mobile"
    },
    "web": {
      "favicon": "./assets/favicon.png"
    },
    "plugins": [
      "expo-camera",
      "expo-notifications",
      "expo-location"
    ]
  }
}
```

#### tsconfig.json
```json
{
  "extends": "expo/tsconfig.base",
  "compilerOptions": {
    "strict": true,
    "baseUrl": "./src",
    "paths": {
      "@/*": ["*"],
      "@/components/*": ["components/*"],
      "@/screens/*": ["screens/*"],
      "@/services/*": ["services/*"],
      "@/store/*": ["store/*"],
      "@/types/*": ["types/*"],
      "@/utils/*": ["utils/*"]
    }
  }
}
```

---

## Architecture Design

### 1. Component Architecture

#### Screen Components
```typescript
// src/screens/home/HomeScreen.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useAppSelector } from '@/store/hooks';
import { StreakList } from '@/components/streak/StreakList';
import { QuickActions } from '@/components/home/QuickActions';

export const HomeScreen: React.FC = () => {
  const { user, streaks } = useAppSelector(state => ({
    user: state.auth.user,
    streaks: state.streaks.activeStreaks
  }));

  return (
    <View style={styles.container}>
      <Text style={styles.welcome}>
        Welcome back, {user?.display_name || user?.username}!
      </Text>
      <QuickActions />
      <StreakList streaks={streaks} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f5f5f5'
  },
  welcome: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16
  }
});
```

#### Reusable Components
```typescript
// src/components/streak/StreakCard.tsx
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Streak } from '@/types/streak';
import { CheckInButton } from './CheckInButton';

interface StreakCardProps {
  streak: Streak;
  onPress: () => void;
  onCheckIn: () => void;
}

export const StreakCard: React.FC<StreakCardProps> = ({
  streak,
  onPress,
  onCheckIn
}) => {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress}>
      <View style={styles.header}>
        <Text style={styles.title}>{streak.title}</Text>
        <Text style={styles.days}>{streak.current_streak_days} days</Text>
      </View>
      <Text style={styles.description}>{streak.description}</Text>
      <View style={styles.tags}>
        {streak.tags.map(tag => (
          <Text key={tag} style={styles.tag}>#{tag}</Text>
        ))}
      </View>
      <CheckInButton 
        streak={streak}
        onPress={onCheckIn}
      />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1
  },
  days: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4CAF50'
  },
  description: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12
  },
  tag: {
    fontSize: 12,
    color: '#2196F3',
    marginRight: 8,
    marginBottom: 4
  }
});
```

### 2. Navigation Structure

#### Navigation Types
```typescript
// src/types/navigation.ts
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
```

#### Navigation Setup
```typescript
// src/navigation/AppNavigator.tsx
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useAppSelector } from '@/store/hooks';
import { AuthStack } from './AuthStack';
import { MainTabs } from './MainTabs';

const Stack = createStackNavigator();

export const AppNavigator: React.FC = () => {
  const { isAuthenticated } = useAppSelector(state => state.auth);

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {isAuthenticated ? (
          <Stack.Screen name="Main" component={MainTabs} />
        ) : (
          <Stack.Screen name="Auth" component={AuthStack} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};
```

#### Tab Navigation
```typescript
// src/navigation/MainTabs.tsx
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { HomeScreen } from '@/screens/home/HomeScreen';
import { MyStreaksScreen } from '@/screens/streaks/MyStreaksScreen';
import { ExploreScreen } from '@/screens/explore/ExploreScreen';
import { ProfileScreen } from '@/screens/profile/ProfileScreen';

const Tab = createBottomTabNavigator();

export const MainTabs: React.FC = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap;

          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'MyStreaks') {
            iconName = focused ? 'flame' : 'flame-outline';
          } else if (route.name === 'Explore') {
            iconName = focused ? 'search' : 'search-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#2196F3',
        tabBarInactiveTintColor: 'gray',
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="MyStreaks" component={MyStreaksScreen} />
      <Tab.Screen name="Explore" component={ExploreScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
};
```

---

## Core Features Implementation

### 1. Streak Management

#### Streak List Component
```typescript
// src/components/streak/StreakList.tsx
import React, { useEffect } from 'react';
import { FlatList, RefreshControl } from 'react-native';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchStreaks } from '@/store/slices/streaksSlice';
import { StreakCard } from './StreakCard';

interface StreakListProps {
  streaks: Streak[];
  onStreakPress: (streakId: string) => void;
  onCheckIn: (streakId: string) => void;
}

export const StreakList: React.FC<StreakListProps> = ({
  streaks,
  onStreakPress,
  onCheckIn
}) => {
  const dispatch = useAppDispatch();
  const { loading, refreshing } = useAppSelector(state => state.streaks);

  useEffect(() => {
    dispatch(fetchStreaks());
  }, [dispatch]);

  const handleRefresh = () => {
    dispatch(fetchStreaks());
  };

  const renderStreak = ({ item }: { item: Streak }) => (
    <StreakCard
      streak={item}
      onPress={() => onStreakPress(item.id)}
      onCheckIn={() => onCheckIn(item.id)}
    />
  );

  return (
    <FlatList
      data={streaks}
      renderItem={renderStreak}
      keyExtractor={item => item.id}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
      }
      showsVerticalScrollIndicator={false}
    />
  );
};
```

#### Check-in Functionality
```typescript
// src/components/streak/CheckInButton.tsx
import React, { useState } from 'react';
import { TouchableOpacity, Text, StyleSheet, Alert } from 'react-native';
import { useAppDispatch } from '@/store/hooks';
import { createCheckIn } from '@/store/slices/checkinsSlice';
import { Streak } from '@/types/streak';

interface CheckInButtonProps {
  streak: Streak;
  onPress: () => void;
}

export const CheckInButton: React.FC<CheckInButtonProps> = ({
  streak,
  onPress
}) => {
  const dispatch = useAppDispatch();
  const [loading, setLoading] = useState(false);

  const handleCheckIn = async () => {
    try {
      setLoading(true);
      await dispatch(createCheckIn({
        user_streak_id: streak.user_streak_id,
        checkin_date: new Date().toISOString().split('T')[0]
      })).unwrap();
      
      Alert.alert('Success', 'Check-in recorded!');
      onPress();
    } catch (error) {
      Alert.alert('Error', 'Failed to record check-in');
    } finally {
      setLoading(false);
    }
  };

  const isCheckedInToday = streak.last_checkin_date === 
    new Date().toISOString().split('T')[0];

  return (
    <TouchableOpacity
      style={[
        styles.button,
        isCheckedInToday && styles.checkedInButton
      ]}
      onPress={handleCheckIn}
      disabled={loading || isCheckedInToday}
    >
      <Text style={[
        styles.buttonText,
        isCheckedInToday && styles.checkedInText
      ]}>
        {isCheckedInToday ? '✓ Checked In' : 'Check In'}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    backgroundColor: '#2196F3',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center'
  },
  checkedInButton: {
    backgroundColor: '#4CAF50'
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16
  },
  checkedInText: {
    color: 'white'
  }
});
```

### 2. Social Features

#### Comments Section
```typescript
// src/components/social/CommentsSection.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet } from 'react-native';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchComments, createComment } from '@/store/slices/commentsSlice';
import { Comment } from '@/types/comment';

interface CommentsSectionProps {
  streakId: string;
}

export const CommentsSection: React.FC<CommentsSectionProps> = ({ streakId }) => {
  const dispatch = useAppDispatch();
  const { comments, loading } = useAppSelector(state => state.comments);
  const [newComment, setNewComment] = useState('');

  useEffect(() => {
    dispatch(fetchComments(streakId));
  }, [dispatch, streakId]);

  const handleSubmitComment = async () => {
    if (newComment.trim()) {
      try {
        await dispatch(createComment({
          streak_id: streakId,
          content: newComment.trim()
        })).unwrap();
        setNewComment('');
      } catch (error) {
        console.error('Failed to create comment:', error);
      }
    }
  };

  const renderComment = ({ item }: { item: Comment }) => (
    <View style={styles.comment}>
      <Text style={styles.commentAuthor}>{item.user?.display_name || item.user?.username}</Text>
      <Text style={styles.commentContent}>{item.content}</Text>
      <Text style={styles.commentDate}>
        {new Date(item.created_at).toLocaleDateString()}
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Comments</Text>
      
      <FlatList
        data={comments}
        renderItem={renderComment}
        keyExtractor={item => item.id}
        showsVerticalScrollIndicator={false}
      />

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Add a comment..."
          value={newComment}
          onChangeText={setNewComment}
          multiline
        />
        <TouchableOpacity
          style={styles.submitButton}
          onPress={handleSubmitComment}
        >
          <Text style={styles.submitText}>Post</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16
  },
  comment: {
    backgroundColor: '#f5f5f5',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8
  },
  commentAuthor: {
    fontWeight: 'bold',
    marginBottom: 4
  },
  commentContent: {
    marginBottom: 4
  },
  commentDate: {
    fontSize: 12,
    color: '#666'
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginTop: 16
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginRight: 8,
    maxHeight: 100
  },
  submitButton: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8
  },
  submitText: {
    color: 'white',
    fontWeight: 'bold'
  }
});
```

### 3. Real-time Updates

#### WebSocket Service
```typescript
// src/services/realtime/WebSocketService.ts
import { io, Socket } from 'socket.io-client';
import { store } from '@/store';
import { addNotification } from '@/store/slices/notificationsSlice';
import { updateStreak } from '@/store/slices/streaksSlice';

class WebSocketService {
  private socket: Socket | null = null;
  private token: string | null = null;

  connect(token: string) {
    this.token = token;
    this.socket = io('wss://your-api-domain.com', {
      auth: { token },
      transports: ['websocket']
    });

    this.setupEventListeners();
  }

  private setupEventListeners() {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('Connected to WebSocket');
    });

    this.socket.on('disconnect', () => {
      console.log('Disconnected from WebSocket');
    });

    this.socket.on('streak_updated', (data) => {
      store.dispatch(updateStreak(data));
    });

    this.socket.on('new_notification', (notification) => {
      store.dispatch(addNotification(notification));
    });

    this.socket.on('new_comment', (comment) => {
      // Handle new comment
    });

    this.socket.on('new_like', (like) => {
      // Handle new like
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  joinStreakRoom(streakId: string) {
    if (this.socket) {
      this.socket.emit('join_streak', streakId);
    }
  }

  leaveStreakRoom(streakId: string) {
    if (this.socket) {
      this.socket.emit('leave_streak', streakId);
    }
  }
}

export const webSocketService = new WebSocketService();
```

---

## UI/UX Design

### 1. Design System

#### Color Palette
```typescript
// src/constants/colors.ts
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
```

#### Typography
```typescript
// src/constants/typography.ts
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
```

#### Spacing
```typescript
// src/constants/spacing.ts
export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48
};
```

### 2. Component Library

#### Button Component
```typescript
// src/components/common/Button.tsx
import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { colors, typography, spacing } from '@/constants';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  loading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false
}) => {
  const buttonStyle = [
    styles.button,
    styles[variant],
    styles[size],
    disabled && styles.disabled
  ];

  const textStyle = [
    styles.text,
    styles[`${variant}Text`],
    styles[`${size}Text`],
    disabled && styles.disabledText
  ];

  return (
    <TouchableOpacity
      style={buttonStyle}
      onPress={onPress}
      disabled={disabled || loading}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'primary' ? 'white' : colors.primary.main} />
      ) : (
        <Text style={textStyle}>{title}</Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center'
  },
  primary: {
    backgroundColor: colors.primary.main
  },
  secondary: {
    backgroundColor: colors.secondary.main
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.primary.main
  },
  small: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md
  },
  medium: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg
  },
  large: {
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xl
  },
  disabled: {
    opacity: 0.6
  },
  text: {
    ...typography.button
  },
  primaryText: {
    color: colors.primary.contrast
  },
  secondaryText: {
    color: colors.secondary.contrast
  },
  outlineText: {
    color: colors.primary.main
  },
  smallText: {
    fontSize: 14
  },
  mediumText: {
    fontSize: 16
  },
  largeText: {
    fontSize: 18
  },
  disabledText: {
    opacity: 0.6
  }
});
```

#### Input Component
```typescript
// src/components/common/Input.tsx
import React, { useState } from 'react';
import { View, TextInput, Text, StyleSheet } from 'react-native';
import { colors, typography, spacing } from '@/constants';

interface InputProps {
  label?: string;
  placeholder?: string;
  value: string;
  onChangeText: (text: string) => void;
  error?: string;
  multiline?: boolean;
  secureTextEntry?: boolean;
}

export const Input: React.FC<InputProps> = ({
  label,
  placeholder,
  value,
  onChangeText,
  error,
  multiline = false,
  secureTextEntry = false
}) => {
  const [focused, setFocused] = useState(false);

  const inputStyle = [
    styles.input,
    focused && styles.focused,
    error && styles.error,
    multiline && styles.multiline
  ];

  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      <TextInput
        style={inputStyle}
        placeholder={placeholder}
        value={value}
        onChangeText={onChangeText}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        multiline={multiline}
        secureTextEntry={secureTextEntry}
        placeholderTextColor={colors.neutral.grey500}
      />
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.md
  },
  label: {
    ...typography.body2,
    color: colors.neutral.grey700,
    marginBottom: spacing.sm
  },
  input: {
    borderWidth: 1,
    borderColor: colors.neutral.grey300,
    borderRadius: 8,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    ...typography.body1,
    backgroundColor: colors.neutral.white
  },
  focused: {
    borderColor: colors.primary.main
  },
  error: {
    borderColor: colors.error.main
  },
  multiline: {
    minHeight: 80,
    textAlignVertical: 'top'
  },
  errorText: {
    ...typography.caption,
    color: colors.error.main,
    marginTop: spacing.xs
  }
});
```

### 3. Animation System

#### Fade Animation
```typescript
// src/components/common/FadeView.tsx
import React, { useEffect, useRef } from 'react';
import { Animated, View, StyleSheet } from 'react-native';

interface FadeViewProps {
  children: React.ReactNode;
  visible: boolean;
  duration?: number;
}

export const FadeView: React.FC<FadeViewProps> = ({
  children,
  visible,
  duration = 300
}) => {
  const fadeAnim = useRef(new Animated.Value(visible ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: visible ? 1 : 0,
      duration,
      useNativeDriver: true
    }).start();
  }, [visible, duration, fadeAnim]);

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      {children}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1
  }
});
```

#### Slide Animation
```typescript
// src/components/common/SlideView.tsx
import React, { useEffect, useRef } from 'react';
import { Animated, View, StyleSheet } from 'react-native';

interface SlideViewProps {
  children: React.ReactNode;
  visible: boolean;
  direction?: 'up' | 'down' | 'left' | 'right';
  duration?: number;
}

export const SlideView: React.FC<SlideViewProps> = ({
  children,
  visible,
  direction = 'up',
  duration = 300
}) => {
  const slideAnim = useRef(new Animated.Value(visible ? 0 : 100)).current;

  useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: visible ? 0 : 100,
      duration,
      useNativeDriver: true
    }).start();
  }, [visible, duration, slideAnim]);

  const getTransform = () => {
    switch (direction) {
      case 'up':
        return { translateY: slideAnim };
      case 'down':
        return { translateY: slideAnim.interpolate({ inputRange: [0, 100], outputRange: [0, -100] }) };
      case 'left':
        return { translateX: slideAnim };
      case 'right':
        return { translateX: slideAnim.interpolate({ inputRange: [0, 100], outputRange: [0, -100] }) };
      default:
        return { translateY: slideAnim };
    }
  };

  return (
    <Animated.View style={[styles.container, { transform: [getTransform()] }]}>
      {children}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1
  }
});
```

---

## State Management

### 1. Redux Store Setup

#### Store Configuration
```typescript
// src/store/index.ts
import { configureStore } from '@reduxjs/toolkit';
import { authSlice } from './slices/authSlice';
import { streaksSlice } from './slices/streaksSlice';
import { checkinsSlice } from './slices/checkinsSlice';
import { commentsSlice } from './slices/commentsSlice';
import { notificationsSlice } from './slices/notificationsSlice';

export const store = configureStore({
  reducer: {
    auth: authSlice.reducer,
    streaks: streaksSlice.reducer,
    checkins: checkinsSlice.reducer,
    comments: commentsSlice.reducer,
    notifications: notificationsSlice.reducer
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST']
      }
    })
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
```

#### Auth Slice
```typescript
// src/store/slices/authSlice.ts
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { authService } from '@/services/auth/authService';
import { User } from '@/types/user';

interface AuthState {
  user: User | null;
  token: string | null;
  loading: boolean;
  error: string | null;
}

const initialState: AuthState = {
  user: null,
  token: null,
  loading: false,
  error: null
};

export const login = createAsyncThunk(
  'auth/login',
  async (credentials: { email: string; password: string }) => {
    const response = await authService.login(credentials);
    return response;
  }
);

export const register = createAsyncThunk(
  'auth/register',
  async (userData: { email: string; password: string; username: string }) => {
    const response = await authService.register(userData);
    return response;
  }
);

export const logout = createAsyncThunk(
  'auth/logout',
  async () => {
    await authService.logout();
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setToken: (state, action: PayloadAction<string>) => {
      state.token = action.payload;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(login.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.error = null;
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Login failed';
      })
      .addCase(register.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(register.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.error = null;
      })
      .addCase(register.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Registration failed';
      })
      .addCase(logout.fulfilled, (state) => {
        state.user = null;
        state.token = null;
        state.error = null;
      });
  }
});

export const { clearError, setToken } = authSlice.actions;
export { authSlice };
```

#### Streaks Slice
```typescript
// src/store/slices/streaksSlice.ts
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { streaksService } from '@/services/api/streaksService';
import { Streak } from '@/types/streak';

interface StreaksState {
  streaks: Streak[];
  activeStreaks: Streak[];
  loading: boolean;
  refreshing: boolean;
  error: string | null;
}

const initialState: StreaksState = {
  streaks: [],
  activeStreaks: [],
  loading: false,
  refreshing: false,
  error: null
};

export const fetchStreaks = createAsyncThunk(
  'streaks/fetchStreaks',
  async (params?: { limit?: number; offset?: number; category?: string }) => {
    const response = await streaksService.getStreaks(params);
    return response;
  }
);

export const createStreak = createAsyncThunk(
  'streaks/createStreak',
  async (streakData: {
    title: string;
    description?: string;
    category?: string;
    is_public?: boolean;
    tags?: string[];
  }) => {
    const response = await streaksService.createStreak(streakData);
    return response;
  }
);

export const joinStreak = createAsyncThunk(
  'streaks/joinStreak',
  async (streakId: string) => {
    const response = await streaksService.joinStreak(streakId);
    return response;
  }
);

const streaksSlice = createSlice({
  name: 'streaks',
  initialState,
  reducers: {
    updateStreak: (state, action: PayloadAction<Streak>) => {
      const index = state.streaks.findIndex(streak => streak.id === action.payload.id);
      if (index !== -1) {
        state.streaks[index] = action.payload;
      }
      const activeIndex = state.activeStreaks.findIndex(streak => streak.id === action.payload.id);
      if (activeIndex !== -1) {
        state.activeStreaks[activeIndex] = action.payload;
      }
    },
    clearError: (state) => {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchStreaks.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchStreaks.fulfilled, (state, action) => {
        state.loading = false;
        state.streaks = action.payload.streaks;
        state.activeStreaks = action.payload.streaks.filter(streak => streak.is_active);
        state.error = null;
      })
      .addCase(fetchStreaks.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch streaks';
      })
      .addCase(createStreak.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createStreak.fulfilled, (state, action) => {
        state.loading = false;
        // Refresh streaks after creating new one
      })
      .addCase(createStreak.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to create streak';
      });
  }
});

export const { updateStreak, clearError } = streaksSlice.actions;
export { streaksSlice };
```

### 2. React Query Integration

#### Query Client Setup
```typescript
// src/services/api/queryClient.ts
import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
      retry: 3,
      retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000)
    },
    mutations: {
      retry: 1
    }
  }
});
```

#### Custom Hooks
```typescript
// src/hooks/useStreaks.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { streaksService } from '@/services/api/streaksService';

export const useStreaks = (params?: { limit?: number; offset?: number; category?: string }) => {
  return useQuery({
    queryKey: ['streaks', params],
    queryFn: () => streaksService.getStreaks(params)
  });
};

export const useCreateStreak = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: streaksService.createStreak,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['streaks'] });
    }
  });
};

export const useJoinStreak = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: streaksService.joinStreak,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['streaks'] });
    }
  });
};
```

---

## API Integration

### 1. API Client Setup

#### Base API Client
```typescript
// src/services/api/apiClient.ts
import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { storageService } from '@/services/storage/storageService';

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: process.env.EXPO_PUBLIC_API_URL || 'https://your-api-domain.com/api',
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor to add auth token
    this.client.interceptors.request.use(
      async (config) => {
        const token = await storageService.getToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor to handle errors
    this.client.interceptors.response.use(
      (response: AxiosResponse) => {
        return response;
      },
      async (error) => {
        if (error.response?.status === 401) {
          // Handle unauthorized - redirect to login
          await storageService.removeToken();
          // Navigate to login screen
        }
        return Promise.reject(error);
      }
    );
  }

  async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.get<T>(url, config);
    return response.data;
  }

  async post<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.post<T>(url, data, config);
    return response.data;
  }

  async put<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.put<T>(url, data, config);
    return response.data;
  }

  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.delete<T>(url, config);
    return response.data;
  }
}

export const apiClient = new ApiClient();
```

#### Service Classes
```typescript
// src/services/api/streaksService.ts
import { apiClient } from './apiClient';
import { Streak, CreateStreakData, JoinStreakData } from '@/types/streak';

export class StreaksService {
  async getStreaks(params?: {
    limit?: number;
    offset?: number;
    category?: string;
    is_public?: boolean;
  }) {
    const queryParams = new URLSearchParams();
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.offset) queryParams.append('offset', params.offset.toString());
    if (params?.category) queryParams.append('category', params.category);
    if (params?.is_public !== undefined) queryParams.append('is_public', params.is_public.toString());

    const queryString = queryParams.toString();
    return apiClient.get<{ streaks: Streak[]; total: number }>(
      `/streaks${queryString ? `?${queryString}` : ''}`
    );
  }

  async getStreak(id: string) {
    return apiClient.get<{ streak: Streak }>(`/streaks/${id}`);
  }

  async createStreak(data: CreateStreakData) {
    return apiClient.post<{ id: string; user_streak_id: string; message: string }>(
      '/streaks',
      data
    );
  }

  async updateStreak(id: string, data: Partial<CreateStreakData>) {
    return apiClient.put<{ streak: Streak; message: string }>(`/streaks/${id}`, data);
  }

  async deleteStreak(id: string) {
    return apiClient.delete<{ message: string }>(`/streaks/${id}`);
  }

  async joinStreak(streakId: string) {
    return apiClient.post<{ user_streak_id: string; message: string }>(
      '/streaks/join',
      { streak_id: streakId }
    );
  }

  async getPopularStreaks(params?: { limit?: number; period?: string }) {
    const queryParams = new URLSearchParams();
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.period) queryParams.append('period', params.period);

    const queryString = queryParams.toString();
    return apiClient.get<{ streaks: Streak[] }>(
      `/streaks/popular${queryString ? `?${queryString}` : ''}`
    );
  }
}

export const streaksService = new StreaksService();
```

### 2. Error Handling

#### Error Types
```typescript
// src/types/error.ts
export interface ApiError {
  message: string;
  code?: string;
  details?: any;
}

export class ApiException extends Error {
  public status: number;
  public code?: string;
  public details?: any;

  constructor(message: string, status: number, code?: string, details?: any) {
    super(message);
    this.name = 'ApiException';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}
```

#### Error Handler
```typescript
// src/utils/errorHandler.ts
import { Alert } from 'react-native';
import { ApiException } from '@/types/error';

export const handleApiError = (error: any) => {
  if (error instanceof ApiException) {
    switch (error.status) {
      case 400:
        Alert.alert('Invalid Request', error.message);
        break;
      case 401:
        Alert.alert('Unauthorized', 'Please log in again');
        break;
      case 403:
        Alert.alert('Forbidden', 'You don\'t have permission to perform this action');
        break;
      case 404:
        Alert.alert('Not Found', 'The requested resource was not found');
        break;
      case 409:
        Alert.alert('Conflict', error.message);
        break;
      case 500:
        Alert.alert('Server Error', 'Something went wrong. Please try again later');
        break;
      default:
        Alert.alert('Error', error.message);
    }
  } else {
    Alert.alert('Error', 'An unexpected error occurred');
  }
};
```

---

## Authentication

### 1. Authentication Service

#### Auth Service Implementation
```typescript
// src/services/auth/authService.ts
import { apiClient } from '@/services/api/apiClient';
import { storageService } from '@/services/storage/storageService';
import { User } from '@/types/user';

interface LoginCredentials {
  email: string;
  password: string;
}

interface RegisterData {
  email: string;
  password: string;
  username: string;
}

interface AuthResponse {
  user: User;
  token: string;
}

export class AuthService {
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      const response = await apiClient.post<AuthResponse>('/auth/login', credentials);
      await storageService.setToken(response.token);
      return response;
    } catch (error) {
      throw new Error('Login failed');
    }
  }

  async register(userData: RegisterData): Promise<AuthResponse> {
    try {
      const response = await apiClient.post<AuthResponse>('/auth/register', userData);
      await storageService.setToken(response.token);
      return response;
    } catch (error) {
      throw new Error('Registration failed');
    }
  }

  async logout(): Promise<void> {
    try {
      await apiClient.post('/auth/logout');
    } catch (error) {
      // Continue with logout even if API call fails
    } finally {
      await storageService.removeToken();
    }
  }

  async getCurrentUser(): Promise<User | null> {
    try {
      const token = await storageService.getToken();
      if (!token) return null;

      const response = await apiClient.get<{ user: User }>('/auth/me');
      return response.user;
    } catch (error) {
      return null;
    }
  }

  async refreshToken(): Promise<string | null> {
    try {
      const response = await apiClient.post<{ token: string }>('/auth/refresh');
      await storageService.setToken(response.token);
      return response.token;
    } catch (error) {
      return null;
    }
  }
}

export const authService = new AuthService();
```

### 2. OAuth Integration

#### Google OAuth
```typescript
// src/services/auth/googleAuth.ts
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { authService } from './authService';

WebBrowser.maybeCompleteAuthSession();

export const useGoogleAuth = () => {
  const [request, response, promptAsync] = Google.useAuthRequest({
    clientId: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID!,
    scopes: ['profile', 'email']
  });

  const handleGoogleAuth = async () => {
    try {
      const result = await promptAsync();
      
      if (result.type === 'success') {
        const { idToken } = result.params;
        
        // Exchange Google token for app token
        const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/auth/google`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ token: idToken })
        });

        if (response.ok) {
          const data = await response.json();
          await authService.setToken(data.token);
          return data;
        }
      }
    } catch (error) {
      console.error('Google auth error:', error);
      throw error;
    }
  };

  return { handleGoogleAuth, request };
};
```

#### Apple OAuth
```typescript
// src/services/auth/appleAuth.ts
import * as AppleAuthentication from 'expo-apple-authentication';
import { authService } from './authService';

export const useAppleAuth = () => {
  const handleAppleAuth = async () => {
    try {
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL
        ]
      });

      if (credential.identityToken) {
        // Exchange Apple token for app token
        const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/auth/apple`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ token: credential.identityToken })
        });

        if (response.ok) {
          const data = await response.json();
          await authService.setToken(data.token);
          return data;
        }
      }
    } catch (error) {
      console.error('Apple auth error:', error);
      throw error;
    }
  };

  return { handleAppleAuth };
};
```

### 3. Biometric Authentication

#### Biometric Setup
```typescript
// src/services/auth/biometricAuth.ts
import * as LocalAuthentication from 'expo-local-authentication';
import { storageService } from '@/services/storage/storageService';

export class BiometricAuthService {
  async isAvailable(): Promise<boolean> {
    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    const isEnrolled = await LocalAuthentication.isEnrolledAsync();
    return hasHardware && isEnrolled;
  }

  async authenticate(): Promise<boolean> {
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Authenticate to access GoLong',
        fallbackLabel: 'Use Passcode'
      });
      return result.success;
    } catch (error) {
      console.error('Biometric authentication error:', error);
      return false;
    }
  }

  async enableBiometric(): Promise<void> {
    const isAvailable = await this.isAvailable();
    if (!isAvailable) {
      throw new Error('Biometric authentication is not available');
    }

    const authenticated = await this.authenticate();
    if (authenticated) {
      await storageService.setBiometricEnabled(true);
    } else {
      throw new Error('Biometric authentication failed');
    }
  }

  async disableBiometric(): Promise<void> {
    await storageService.setBiometricEnabled(false);
  }

  async isBiometricEnabled(): Promise<boolean> {
    return await storageService.getBiometricEnabled();
  }
}

export const biometricAuthService = new BiometricAuthService();
```

---

## Push Notifications

### 1. Notification Setup

#### Notification Service
```typescript
// src/services/notifications/notificationService.ts
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { apiClient } from '@/services/api/apiClient';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false
  })
});

export class NotificationService {
  async registerForPushNotifications(): Promise<string | null> {
    if (!Device.isDevice) {
      console.log('Must use physical device for Push Notifications');
      return null;
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('Failed to get push token for push notification!');
      return null;
    }

    const token = (await Notifications.getExpoPushTokenAsync()).data;
    
    // Send token to server
    await this.sendTokenToServer(token);

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C'
      });
    }

    return token;
  }

  private async sendTokenToServer(token: string): Promise<void> {
    try {
      await apiClient.post('/notifications/register', { token });
    } catch (error) {
      console.error('Failed to send token to server:', error);
    }
  }

  async scheduleStreakReminder(streakId: string, time: string, days: number[]): Promise<void> {
    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Streak Reminder',
        body: 'Time to check in to your streak!',
        data: { streakId }
      },
      trigger: {
        hour: parseInt(time.split(':')[0]),
        minute: parseInt(time.split(':')[1]),
        repeats: true
      }
    });

    // Store notification ID for later cancellation
    await this.storeNotificationId(streakId, notificationId);
  }

  async cancelStreakReminder(streakId: string): Promise<void> {
    const notificationId = await this.getNotificationId(streakId);
    if (notificationId) {
      await Notifications.cancelScheduledNotificationAsync(notificationId);
      await this.removeNotificationId(streakId);
    }
  }

  private async storeNotificationId(streakId: string, notificationId: string): Promise<void> {
    // Store in AsyncStorage or local database
  }

  private async getNotificationId(streakId: string): Promise<string | null> {
    // Retrieve from AsyncStorage or local database
    return null;
  }

  private async removeNotificationId(streakId: string): Promise<void> {
    // Remove from AsyncStorage or local database
  }
}

export const notificationService = new NotificationService();
```

### 2. Notification Components

#### Notification Handler
```typescript
// src/components/notifications/NotificationHandler.tsx
import React, { useEffect, useRef } from 'react';
import { useNavigation } from '@react-navigation/native';
import * as Notifications from 'expo-notifications';

export const NotificationHandler: React.FC = () => {
  const navigation = useNavigation();
  const notificationListener = useRef<Notifications.Subscription>();
  const responseListener = useRef<Notifications.Subscription>();

  useEffect(() => {
    // Handle notifications received while app is foregrounded
    notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
      console.log('Notification received:', notification);
    });

    // Handle notification taps
    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      const data = response.notification.request.content.data;
      
      if (data?.streakId) {
        navigation.navigate('StreakDetail', { streakId: data.streakId });
      }
    });

    return () => {
      if (notificationListener.current) {
        Notifications.removeNotificationSubscription(notificationListener.current);
      }
      if (responseListener.current) {
        Notifications.removeNotificationSubscription(responseListener.current);
      }
    };
  }, [navigation]);

  return null;
};
```

---

## Offline Support

### 1. Offline Storage

#### Storage Service
```typescript
// src/services/storage/storageService.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';

export class StorageService {
  // Secure storage for sensitive data
  async setToken(token: string): Promise<void> {
    await SecureStore.setItemAsync('auth_token', token);
  }

  async getToken(): Promise<string | null> {
    return await SecureStore.getItemAsync('auth_token');
  }

  async removeToken(): Promise<void> {
    await SecureStore.deleteItemAsync('auth_token');
  }

  async setBiometricEnabled(enabled: boolean): Promise<void> {
    await SecureStore.setItemAsync('biometric_enabled', enabled.toString());
  }

  async getBiometricEnabled(): Promise<boolean> {
    const value = await SecureStore.getItemAsync('biometric_enabled');
    return value === 'true';
  }

  // Regular storage for non-sensitive data
  async setUser(user: any): Promise<void> {
    await AsyncStorage.setItem('user', JSON.stringify(user));
  }

  async getUser(): Promise<any | null> {
    const user = await AsyncStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  }

  async setStreaks(streaks: any[]): Promise<void> {
    await AsyncStorage.setItem('streaks', JSON.stringify(streaks));
  }

  async getStreaks(): Promise<any[]> {
    const streaks = await AsyncStorage.getItem('streaks');
    return streaks ? JSON.parse(streaks) : [];
  }

  async setOfflineCheckins(checkins: any[]): Promise<void> {
    await AsyncStorage.setItem('offline_checkins', JSON.stringify(checkins));
  }

  async getOfflineCheckins(): Promise<any[]> {
    const checkins = await AsyncStorage.getItem('offline_checkins');
    return checkins ? JSON.parse(checkins) : [];
  }

  async addOfflineCheckin(checkin: any): Promise<void> {
    const checkins = await this.getOfflineCheckins();
    checkins.push(checkin);
    await this.setOfflineCheckins(checkins);
  }

  async clearOfflineCheckins(): Promise<void> {
    await AsyncStorage.removeItem('offline_checkins');
  }

  async clearAll(): Promise<void> {
    await AsyncStorage.clear();
    await SecureStore.deleteItemAsync('auth_token');
    await SecureStore.deleteItemAsync('biometric_enabled');
  }
}

export const storageService = new StorageService();
```

### 2. Offline Sync

#### Sync Service
```typescript
// src/services/sync/syncService.ts
import NetInfo from '@react-native-community/netinfo';
import { storageService } from '@/services/storage/storageService';
import { checkinsService } from '@/services/api/checkinsService';

export class SyncService {
  private isOnline: boolean = true;
  private syncQueue: any[] = [];

  constructor() {
    this.setupNetworkListener();
  }

  private setupNetworkListener(): void {
    NetInfo.addEventListener(state => {
      this.isOnline = state.isConnected ?? false;
      
      if (this.isOnline) {
        this.syncOfflineData();
      }
    });
  }

  async syncOfflineData(): Promise<void> {
    if (!this.isOnline) return;

    try {
      // Sync offline check-ins
      await this.syncOfflineCheckins();
      
      // Sync other offline data
      await this.syncOtherData();
    } catch (error) {
      console.error('Sync failed:', error);
    }
  }

  private async syncOfflineCheckins(): Promise<void> {
    const offlineCheckins = await storageService.getOfflineCheckins();
    
    for (const checkin of offlineCheckins) {
      try {
        await checkinsService.createCheckin(checkin);
      } catch (error) {
        console.error('Failed to sync checkin:', error);
        // Keep in queue for next sync
        this.syncQueue.push(checkin);
      }
    }

    // Clear successfully synced check-ins
    await storageService.clearOfflineCheckins();
  }

  private async syncOtherData(): Promise<void> {
    // Sync other offline data like comments, likes, etc.
  }

  async queueForSync(data: any): Promise<void> {
    this.syncQueue.push(data);
    
    if (this.isOnline) {
      await this.syncOfflineData();
    }
  }
}

export const syncService = new SyncService();
```

### 3. Offline UI

#### Offline Indicator
```typescript
// src/components/common/OfflineIndicator.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { colors, typography, spacing } from '@/constants';

export const OfflineIndicator: React.FC = () => {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsOnline(state.isConnected ?? false);
    });

    return unsubscribe;
  }, []);

  if (isOnline) return null;

  return (
    <View style={styles.container}>
      <Text style={styles.text}>You're offline. Some features may be limited.</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.warning.main,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    alignItems: 'center'
  },
  text: {
    ...typography.caption,
    color: colors.warning.contrast
  }
});
```

---

## Performance Optimization

### 1. Image Optimization

#### Optimized Image Component
```typescript
// src/components/common/OptimizedImage.tsx
import React, { useState } from 'react';
import { Image, View, ActivityIndicator, StyleSheet } from 'react-native';
import { colors } from '@/constants';

interface OptimizedImageProps {
  source: { uri: string };
  style?: any;
  placeholder?: any;
}

export const OptimizedImage: React.FC<OptimizedImageProps> = ({
  source,
  style,
  placeholder
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const handleLoad = () => {
    setLoading(false);
  };

  const handleError = () => {
    setLoading(false);
    setError(true);
  };

  return (
    <View style={[styles.container, style]}>
      {loading && (
        <View style={styles.placeholder}>
          <ActivityIndicator color={colors.primary.main} />
        </View>
      )}
      <Image
        source={source}
        style={[styles.image, style]}
        onLoad={handleLoad}
        onError={handleError}
        resizeMode="cover"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative'
  },
  image: {
    width: '100%',
    height: '100%'
  },
  placeholder: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.neutral.grey100
  }
});
```

### 2. List Optimization

#### Virtualized List
```typescript
// src/components/common/VirtualizedList.tsx
import React, { useMemo } from 'react';
import { FlatList, ListRenderItem, ViewStyle } from 'react-native';

interface VirtualizedListProps<T> {
  data: T[];
  renderItem: ListRenderItem<T>;
  keyExtractor: (item: T, index: number) => string;
  style?: ViewStyle;
  onEndReached?: () => void;
  onRefresh?: () => void;
  refreshing?: boolean;
}

export const VirtualizedList = <T,>({
  data,
  renderItem,
  keyExtractor,
  style,
  onEndReached,
  onRefresh,
  refreshing
}: VirtualizedListProps<T>) => {
  const memoizedRenderItem = useMemo(() => renderItem, [renderItem]);
  const memoizedKeyExtractor = useMemo(() => keyExtractor, [keyExtractor]);

  return (
    <FlatList
      data={data}
      renderItem={memoizedRenderItem}
      keyExtractor={memoizedKeyExtractor}
      style={style}
      onEndReached={onEndReached}
      onEndReachedThreshold={0.5}
      onRefresh={onRefresh}
      refreshing={refreshing}
      removeClippedSubviews={true}
      maxToRenderPerBatch={10}
      windowSize={10}
      initialNumToRender={5}
      getItemLayout={(data, index) => ({
        length: 100, // Adjust based on your item height
        offset: 100 * index,
        index
      })}
    />
  );
};
```

### 3. Memory Management

#### Memory Monitor
```typescript
// src/utils/memoryMonitor.ts
import { Alert } from 'react-native';

export class MemoryMonitor {
  private static instance: MemoryMonitor;
  private memoryWarningCount: number = 0;

  static getInstance(): MemoryMonitor {
    if (!MemoryMonitor.instance) {
      MemoryMonitor.instance = new MemoryMonitor();
    }
    return MemoryMonitor.instance;
  }

  startMonitoring(): void {
    // Monitor memory usage
    setInterval(() => {
      this.checkMemoryUsage();
    }, 30000); // Check every 30 seconds
  }

  private checkMemoryUsage(): void {
    // Check memory usage and warn if high
    const memoryInfo = (performance as any).memory;
    if (memoryInfo) {
      const usedMB = memoryInfo.usedJSHeapSize / 1024 / 1024;
      const totalMB = memoryInfo.totalJSHeapSize / 1024 / 1024;
      
      if (usedMB / totalMB > 0.8) {
        this.memoryWarningCount++;
        if (this.memoryWarningCount > 3) {
          Alert.alert(
            'Memory Warning',
            'The app is using a lot of memory. Consider restarting the app.',
            [{ text: 'OK' }]
          );
        }
      }
    }
  }
}

export const memoryMonitor = MemoryMonitor.getInstance();
```

---

## Testing Strategy

### 1. Unit Testing

#### Test Setup
```typescript
// __tests__/setup.ts
import 'react-native-gesture-handler/jestSetup';

jest.mock('react-native-reanimated', () => {
  const Reanimated = require('react-native-reanimated/mock');
  Reanimated.default.call = () => {};
  return Reanimated;
});

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);
```

#### Component Tests
```typescript
// __tests__/components/StreakCard.test.tsx
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { StreakCard } from '@/components/streak/StreakCard';
import { Streak } from '@/types/streak';

const mockStreak: Streak = {
  id: '1',
  title: 'Daily Exercise',
  description: 'Exercise for 30 minutes daily',
  category: 'Health',
  is_public: true,
  created_by: 'user1',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  tags: ['fitness', 'health'],
  is_active: true,
  current_streak_days: 5,
  longest_streak_days: 10,
  last_checkin_date: '2024-01-05',
  joined_at: '2024-01-01T00:00:00Z',
  user_streak_id: 'us1'
};

describe('StreakCard', () => {
  it('renders streak information correctly', () => {
    const { getByText } = render(
      <StreakCard
        streak={mockStreak}
        onPress={jest.fn()}
        onCheckIn={jest.fn()}
      />
    );

    expect(getByText('Daily Exercise')).toBeTruthy();
    expect(getByText('Exercise for 30 minutes daily')).toBeTruthy();
    expect(getByText('5 days')).toBeTruthy();
  });

  it('calls onPress when card is pressed', () => {
    const mockOnPress = jest.fn();
    const { getByText } = render(
      <StreakCard
        streak={mockStreak}
        onPress={mockOnPress}
        onCheckIn={jest.fn()}
      />
    );

    fireEvent.press(getByText('Daily Exercise'));
    expect(mockOnPress).toHaveBeenCalled();
  });

  it('calls onCheckIn when check-in button is pressed', () => {
    const mockOnCheckIn = jest.fn();
    const { getByText } = render(
      <StreakCard
        streak={mockStreak}
        onPress={jest.fn()}
        onCheckIn={mockOnCheckIn}
      />
    );

    fireEvent.press(getByText('Check In'));
    expect(mockOnCheckIn).toHaveBeenCalled();
  });
});
```

### 2. Integration Testing

#### API Service Tests
```typescript
// __tests__/services/streaksService.test.ts
import { streaksService } from '@/services/api/streaksService';
import { apiClient } from '@/services/api/apiClient';

jest.mock('@/services/api/apiClient');

describe('StreaksService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('fetches streaks successfully', async () => {
    const mockResponse = {
      streaks: [
        {
          id: '1',
          title: 'Daily Exercise',
          description: 'Exercise for 30 minutes daily',
          category: 'Health',
          is_public: true,
          created_by: 'user1',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
          tags: ['fitness', 'health'],
          is_active: true
        }
      ],
      total: 1
    };

    (apiClient.get as jest.Mock).mockResolvedValue(mockResponse);

    const result = await streaksService.getStreaks();

    expect(apiClient.get).toHaveBeenCalledWith('/streaks');
    expect(result).toEqual(mockResponse);
  });

  it('creates streak successfully', async () => {
    const mockStreakData = {
      title: 'Daily Exercise',
      description: 'Exercise for 30 minutes daily',
      category: 'Health',
      is_public: true,
      tags: ['fitness', 'health']
    };

    const mockResponse = {
      id: '1',
      user_streak_id: 'us1',
      message: 'Streak created successfully'
    };

    (apiClient.post as jest.Mock).mockResolvedValue(mockResponse);

    const result = await streaksService.createStreak(mockStreakData);

    expect(apiClient.post).toHaveBeenCalledWith('/streaks', mockStreakData);
    expect(result).toEqual(mockResponse);
  });
});
```

### 3. E2E Testing

#### E2E Test Setup
```typescript
// e2e/setup.ts
import { beforeAll, afterAll } from '@jest/globals';
import { cleanup, init } from 'detox';

beforeAll(async () => {
  await init();
});

afterAll(async () => {
  await cleanup();
});
```

#### E2E Test Example
```typescript
// e2e/auth.e2e.ts
import { device, expect, element, by } from 'detox';

describe('Authentication Flow', () => {
  beforeAll(async () => {
    await device.launchApp();
  });

  beforeEach(async () => {
    await device.reloadReactNative();
  });

  it('should show login screen on app launch', async () => {
    await expect(element(by.id('login-screen'))).toBeVisible();
  });

  it('should login successfully with valid credentials', async () => {
    await element(by.id('email-input')).typeText('test@example.com');
    await element(by.id('password-input')).typeText('password123');
    await element(by.id('login-button')).tap();
    
    await expect(element(by.id('home-screen'))).toBeVisible();
  });

  it('should show error for invalid credentials', async () => {
    await element(by.id('email-input')).typeText('invalid@example.com');
    await element(by.id('password-input')).typeText('wrongpassword');
    await element(by.id('login-button')).tap();
    
    await expect(element(by.id('error-message'))).toBeVisible();
  });
});
```

---

## Deployment

### 1. Build Configuration

#### EAS Build Configuration
```json
// eas.json
{
  "cli": {
    "version": ">= 5.0.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal",
      "ios": {
        "simulator": true
      }
    },
    "production": {
      "ios": {
        "autoIncrement": true
      },
      "android": {
        "autoIncrement": true
      }
    }
  },
  "submit": {
    "production": {
      "ios": {
        "appleId": "your-apple-id@example.com",
        "ascAppId": "1234567890",
        "appleTeamId": "ABCD123456"
      },
      "android": {
        "serviceAccountKeyPath": "./google-service-account.json",
        "track": "production"
      }
    }
  }
}
```

### 2. App Store Preparation

#### iOS App Store
```bash
# Build for iOS
eas build --platform ios --profile production

# Submit to App Store
eas submit --platform ios --profile production
```

#### Google Play Store
```bash
# Build for Android
eas build --platform android --profile production

# Submit to Google Play
eas submit --platform android --profile production
```

### 3. Over-the-Air Updates

#### Update Configuration
```typescript
// src/services/updates/updateService.ts
import * as Updates from 'expo-updates';

export class UpdateService {
  async checkForUpdates(): Promise<boolean> {
    try {
      const update = await Updates.checkForUpdateAsync();
      return update.isAvailable;
    } catch (error) {
      console.error('Error checking for updates:', error);
      return false;
    }
  }

  async downloadAndInstallUpdate(): Promise<void> {
    try {
      const update = await Updates.fetchUpdateAsync();
      if (update.isNew) {
        await Updates.reloadAsync();
      }
    } catch (error) {
      console.error('Error downloading update:', error);
    }
  }

  async installUpdate(): Promise<void> {
    try {
      await Updates.reloadAsync();
    } catch (error) {
      console.error('Error installing update:', error);
    }
  }
}

export const updateService = new UpdateService();
```

---

## Platform-Specific Considerations

### 1. iOS Specific

#### iOS Permissions
```typescript
// src/utils/iosPermissions.ts
import { Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as Camera from 'expo-camera';

export const requestIOSPermissions = async () => {
  if (Platform.OS === 'ios') {
    // Request camera permission
    const cameraStatus = await Camera.requestCameraPermissionsAsync();
    
    // Request photo library permission
    const photoStatus = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    return {
      camera: cameraStatus.status === 'granted',
      photoLibrary: photoStatus.status === 'granted'
    };
  }
  return { camera: true, photoLibrary: true };
};
```

#### iOS Navigation
```typescript
// src/navigation/iosNavigation.ts
import { Platform } from 'react-native';
import { createStackNavigator } from '@react-navigation/stack';

export const createIOSStackNavigator = () => {
  const Stack = createStackNavigator();

  return Stack;
};
```

### 2. Android Specific

#### Android Permissions
```typescript
// src/utils/androidPermissions.ts
import { Platform, PermissionsAndroid } from 'react-native';

export const requestAndroidPermissions = async () => {
  if (Platform.OS === 'android') {
    const permissions = [
      PermissionsAndroid.PERMISSIONS.CAMERA,
      PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
      PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE
    ];

    const granted = await PermissionsAndroid.requestMultiple(permissions);
    
    return Object.values(granted).every(status => status === 'granted');
  }
  return true;
};
```

#### Android Navigation
```typescript
// src/navigation/androidNavigation.ts
import { Platform } from 'react-native';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';

export const createAndroidTabNavigator = () => {
  const Tab = createMaterialTopTabNavigator();

  return Tab;
};
```

### 3. Platform-Specific Components

#### Platform-Specific Button
```typescript
// src/components/common/PlatformButton.tsx
import React from 'react';
import { Platform } from 'react-native';
import { Button as IOSButton } from './ios/Button';
import { Button as AndroidButton } from './android/Button';

interface PlatformButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary';
}

export const PlatformButton: React.FC<PlatformButtonProps> = (props) => {
  if (Platform.OS === 'ios') {
    return <IOSButton {...props} />;
  }
  return <AndroidButton {...props} />;
};
```

---

## Conclusion

This comprehensive mobile app development guide provides everything needed to build a production-ready mobile application for GoLong. The guide covers:

1. **Complete technology stack** with React Native and Expo
2. **Detailed architecture** with Redux and React Query
3. **Comprehensive feature implementation** for all core functionality
4. **Professional UI/UX design** with custom components
5. **Robust state management** with Redux Toolkit
6. **Secure authentication** with OAuth and biometric support
7. **Real-time features** with WebSocket integration
8. **Offline support** with local storage and sync
9. **Performance optimization** for smooth user experience
10. **Comprehensive testing** strategy
11. **Production deployment** for both iOS and Android

The mobile app will maintain feature parity with the web application while providing an optimized mobile experience with native features like push notifications, camera integration, and offline support.

For questions or clarifications, refer to the individual service files and component implementations in the codebase.
