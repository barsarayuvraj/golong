# GoLong - Comprehensive Application Documentation

## Table of Contents
1. [Application Overview](#application-overview)
2. [Technical Architecture](#technical-architecture)
3. [Database Schema](#database-schema)
4. [API Documentation](#api-documentation)
5. [Authentication & Authorization](#authentication--authorization)
6. [UI Components](#ui-components)
7. [Frontend Pages](#frontend-pages)
8. [Mobile App Development Guide](#mobile-app-development-guide)
9. [Deployment Guide](#deployment-guide)
10. [Development Setup](#development-setup)

---

## Application Overview

### What is GoLong?
GoLong is a community-driven streak tracking application where users can create, join, and track any kind of streak with public leaderboards and social features. The tagline "Where Streaks Become Stories" reflects the app's focus on turning personal habits into community experiences.

### Core Features
- **Streak Creation**: Users can create custom streaks with categories, tags, and privacy settings
- **Community Features**: Public streaks with leaderboards, comments, likes, and social interactions
- **Progress Tracking**: Daily check-ins with streak counters and statistics
- **Social Features**: Follow other users, join groups, participate in challenges
- **Gamification**: Achievements, badges, and milestone celebrations
- **Analytics**: Personal analytics dashboard with progress visualization
- **Notifications**: Push notifications and email reminders for streak maintenance

### Target Audience
- Individuals looking to build and maintain habits
- Communities wanting to track group goals
- Gamification enthusiasts
- Social media users interested in productivity

---

## Technical Architecture

### Frontend Stack
- **Framework**: Next.js 15.5.4 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui (Radix UI primitives)
- **Forms**: React Hook Form + Zod validation
- **Icons**: Lucide React
- **Animations**: Framer Motion
- **Charts**: Recharts
- **Notifications**: Sonner

### Backend Stack
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **API**: Next.js API Routes
- **Real-time**: Supabase Realtime
- **File Storage**: Supabase Storage
- **Push Notifications**: Web Push API

### Development Tools
- **Package Manager**: npm
- **Linting**: ESLint
- **Type Checking**: TypeScript
- **Hot Reload**: Turbopack
- **Testing**: Playwright

### Project Structure
```
golong/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── auth/              # Authentication pages
│   │   ├── api/               # API endpoints
│   │   ├── create/            # Create streak page
│   │   ├── explore/           # Browse streaks page
│   │   ├── profile/           # User profile page
│   │   ├── streaks/[id]/      # Individual streak pages
│   │   └── layout.tsx         # Root layout
│   ├── components/            # React components
│   │   ├── ui/                # shadcn/ui components
│   │   ├── auth-form.tsx      # OAuth + email auth
│   │   ├── navbar.tsx         # Navigation
│   │   ├── create-streak-form.tsx
│   │   ├── explore-streaks.tsx
│   │   ├── streak-detail.tsx
│   │   └── profile-page.tsx
│   ├── lib/                   # Utilities
│   │   ├── supabase.ts        # Supabase client
│   │   ├── supabase-client.ts # Browser client
│   │   ├── supabase-server.ts # Server client
│   │   └── utils.ts           # Helper functions
│   └── types/                 # TypeScript types
│       └── database.ts        # Database types
├── supabase-schema.sql       # Database schema
├── OAUTH_SETUP.md            # OAuth configuration guide
└── package.json              # Dependencies
```

---

## Database Schema

### Core Tables

#### 1. Profiles
Extends Supabase auth.users with additional profile information.
```sql
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  display_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin', 'moderator')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### 2. Streaks
Main streak definitions with metadata.
```sql
CREATE TABLE public.streaks (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT,
  is_public BOOLEAN DEFAULT true,
  created_by UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  tags TEXT[] DEFAULT '{}',
  is_active BOOLEAN DEFAULT true
);
```

#### 3. User Streaks
Junction table for user participation in streaks.
```sql
CREATE TABLE public.user_streaks (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  streak_id UUID REFERENCES public.streaks(id) ON DELETE CASCADE NOT NULL,
  current_streak_days INTEGER DEFAULT 0,
  longest_streak_days INTEGER DEFAULT 0,
  last_checkin_date DATE,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true,
  UNIQUE(user_id, streak_id)
);
```

#### 4. Checkins
Daily check-in records for streak tracking.
```sql
CREATE TABLE public.checkins (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_streak_id UUID REFERENCES public.user_streaks(id) ON DELETE CASCADE NOT NULL,
  checkin_date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_streak_id, checkin_date)
);
```

### Social Features Tables

#### 5. Comments
User comments on streaks.
```sql
CREATE TABLE public.comments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  streak_id UUID REFERENCES public.streaks(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### 6. Likes
User likes on streaks.
```sql
CREATE TABLE public.likes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  streak_id UUID REFERENCES public.streaks(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(streak_id, user_id)
);
```

#### 7. Follow System
User following relationships.
```sql
CREATE TABLE public.follows (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  follower_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  following_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(follower_id, following_id)
);
```

### Advanced Features Tables

#### 8. Notifications
User notification system.
```sql
CREATE TABLE public.notifications (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('streak_reminder', 'milestone', 'comment', 'like', 'follow', 'challenge', 'group_invite')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  data JSONB,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### 9. Achievements
Gamification system with badges and achievements.
```sql
CREATE TABLE public.achievements (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT,
  criteria JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### 10. Groups
Group streaks and communities.
```sql
CREATE TABLE public.groups (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT,
  max_members INTEGER DEFAULT 50,
  is_private BOOLEAN DEFAULT false,
  created_by UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Database Functions and Triggers

#### Streak Count Update Function
Automatically updates streak counts when check-ins are added:
```sql
CREATE OR REPLACE FUNCTION update_streak_count()
RETURNS TRIGGER AS $$
DECLARE
  user_streak_record RECORD;
  current_streak INTEGER := 0;
  longest_streak INTEGER := 0;
BEGIN
  -- Calculate current streak
  SELECT COUNT(*) INTO current_streak
  FROM public.checkins c
  WHERE c.user_streak_id = NEW.user_streak_id
    AND c.checkin_date >= (
      SELECT COALESCE(MAX(checkin_date), '1900-01-01'::date)
      FROM public.checkins c2
      WHERE c2.user_streak_id = NEW.user_streak_id
        AND c2.checkin_date < NEW.checkin_date
    );
  
  -- Update user_streaks with new counts
  UPDATE public.user_streaks
  SET 
    current_streak_days = current_streak,
    longest_streak_days = GREATEST(longest_streak, current_streak),
    last_checkin_date = NEW.checkin_date
  WHERE id = NEW.user_streak_id;
  
  RETURN NEW;
END;
$$ language 'plpgsql';
```

#### Notification Triggers
Automatically create notifications for social interactions:
- Like notifications
- Comment notifications
- Follow notifications

---

## API Documentation

### Authentication
All API endpoints require authentication via Supabase Auth. Include the JWT token in the Authorization header:
```
Authorization: Bearer <jwt_token>
```

### Base URL
```
/api
```

### Core Streak Endpoints

#### GET /api/streaks
Get list of streaks with optional filtering.

**Query Parameters:**
- `limit` (number): Number of streaks to return (default: 20)
- `offset` (number): Pagination offset (default: 0)
- `category` (string): Filter by category
- `is_public` (boolean): Filter by public/private status

**Response:**
```json
{
  "streaks": [
    {
      "streak": {
        "id": "uuid",
        "title": "Daily Exercise",
        "description": "Exercise for 30 minutes daily",
        "category": "Health",
        "is_public": true,
        "created_by": "uuid",
        "created_at": "2024-01-01T00:00:00Z",
        "updated_at": "2024-01-01T00:00:00Z",
        "tags": ["fitness", "health"],
        "is_active": true,
        "profiles": {
          "id": "uuid",
          "username": "user123",
          "display_name": "John Doe",
          "avatar_url": "https://..."
        }
      },
      "user_streak": {
        "id": "uuid",
        "current_streak_days": 15,
        "longest_streak_days": 30,
        "last_checkin_date": "2024-01-15",
        "joined_at": "2024-01-01T00:00:00Z",
        "is_active": true
      }
    }
  ],
  "total": 1
}
```

#### POST /api/streaks
Create a new streak.

**Request Body:**
```json
{
  "title": "Daily Exercise",
  "description": "Exercise for 30 minutes daily",
  "category": "Health",
  "is_public": true,
  "tags": ["fitness", "health"]
}
```

**Response:**
```json
{
  "id": "uuid",
  "user_streak_id": "uuid",
  "message": "Streak created successfully"
}
```

#### GET /api/streaks/[id]
Get specific streak details.

#### PUT /api/streaks/[id]
Update streak (only by creator).

#### DELETE /api/streaks/[id]
Delete streak (only by creator).

### Check-in Endpoints

#### GET /api/checkins
Get check-ins with optional filtering.

**Query Parameters:**
- `user_streak_id` (uuid): Filter by user streak
- `streak_id` (uuid): Filter by streak
- `user_id` (uuid): Filter by user
- `limit` (number): Number of check-ins to return
- `offset` (number): Pagination offset

#### POST /api/checkins
Create a new check-in.

**Request Body:**
```json
{
  "user_streak_id": "uuid",
  "checkin_date": "2024-01-15"
}
```

#### PUT /api/checkins?id=[checkin_id]
Update a check-in.

#### DELETE /api/checkins?id=[checkin_id]
Delete a check-in.

### Social Features Endpoints

#### GET /api/comments
Get comments for a streak.

**Query Parameters:**
- `streak_id` (uuid): Required - streak to get comments for
- `limit` (number): Number of comments to return
- `offset` (number): Pagination offset

#### POST /api/comments
Create a new comment.

**Request Body:**
```json
{
  "streak_id": "uuid",
  "content": "Great job on your streak!"
}
```

#### GET /api/likes
Get likes for a streak.

#### POST /api/likes
Like/unlike a streak.

**Request Body:**
```json
{
  "streak_id": "uuid"
}
```

### User Management Endpoints

#### GET /api/users/search
Search for users by username or display name.

**Query Parameters:**
- `q` (string): Search query (minimum 2 characters)
- `limit` (number): Number of results to return

#### GET /api/users/[username]
Get user profile by username.

### Advanced Features Endpoints

#### GET /api/analytics
Get user analytics data.

**Query Parameters:**
- `start_date` (date): Start date for analytics
- `end_date` (date): End date for analytics
- `period` (string): Period grouping (day, week, month, year)
- `metric` (string): Metric type (streaks, checkins, achievements, social, overview)

#### GET /api/achievements
Get available achievements and user's earned achievements.

#### GET /api/groups
Get groups with optional filtering.

#### POST /api/groups
Create a new group.

#### GET /api/challenges
Get challenges with optional filtering.

#### POST /api/challenges
Create a new challenge.

#### GET /api/reminders
Get user's reminders.

#### POST /api/reminders
Create a new reminder.

#### GET /api/notifications
Get user's notifications.

#### PUT /api/notifications/[id]/read
Mark notification as read.

### Export Endpoints

#### GET /api/export
Get export jobs status.

#### POST /api/export
Create a new export job.

**Request Body:**
```json
{
  "export_type": "streaks",
  "format": "json",
  "start_date": "2024-01-01",
  "end_date": "2024-01-31"
}
```

---

## Authentication & Authorization

### Authentication Methods

#### 1. Email/Password Authentication
Standard email and password authentication through Supabase Auth.

#### 2. OAuth Providers
- **Google OAuth**: Google Sign-In integration
- **Apple OAuth**: Apple Sign-In integration
- **Facebook OAuth**: Facebook Login integration
- **Twitter OAuth**: Twitter Login integration

### Authorization System

#### Row Level Security (RLS)
All database tables use Supabase's Row Level Security for authorization:

1. **Public Data**: Anyone can view public streaks, comments, and likes
2. **User Data**: Users can only modify their own data
3. **Admin Access**: Admins and moderators have elevated permissions

#### Permission Levels
- **User**: Standard user permissions
- **Moderator**: Can moderate content and users
- **Admin**: Full system access

### Authentication Flow

1. **Sign Up**: User creates account via email/password or OAuth
2. **Profile Creation**: System creates profile record linked to auth user
3. **Session Management**: JWT tokens managed by Supabase Auth
4. **API Access**: All API calls require valid JWT token

### Security Features

- **JWT Token Validation**: All API endpoints validate JWT tokens
- **CSRF Protection**: Built-in CSRF protection via Supabase
- **Rate Limiting**: Implemented at API level
- **Input Validation**: Zod schemas for all API inputs
- **SQL Injection Prevention**: Supabase client prevents SQL injection

---

## UI Components

### Core Components

#### 1. Navbar (`navbar.tsx`)
Responsive navigation bar with:
- Logo and branding
- User authentication state
- Mobile menu
- User dropdown with profile options
- Notification bell
- Primary navigation links

#### 2. AuthForm (`auth-form.tsx`)
Authentication form supporting:
- Email/password login
- OAuth provider buttons
- Form validation with Zod
- Error handling and loading states

#### 3. CreateStreakForm (`create-streak-form.tsx`)
Streak creation form with:
- Title and description inputs
- Category selection
- Tag management
- Privacy settings
- Form validation

#### 4. ExploreStreaks (`explore-streaks.tsx`)
Streak discovery interface with:
- Search functionality
- Category filtering
- Sort options
- Pagination
- Join streak functionality

#### 5. StreakDetail (`streak-detail.tsx`)
Individual streak view with:
- Streak information display
- Leaderboard
- Comments section
- Like functionality
- Check-in interface

#### 6. ProfilePage (`profile-page.tsx`)
User profile with:
- Profile information
- Streak statistics
- Achievement display
- Activity feed
- Settings access

### UI Component Library (shadcn/ui)

#### Form Components
- `Button`: Various button styles and sizes
- `Input`: Text input fields
- `Textarea`: Multi-line text input
- `Select`: Dropdown selection
- `Checkbox`: Checkbox input
- `Switch`: Toggle switch
- `Slider`: Range slider input

#### Layout Components
- `Card`: Content containers
- `Separator`: Visual separators
- `Tabs`: Tabbed interface
- `Dialog`: Modal dialogs
- `DropdownMenu`: Dropdown menus
- `ScrollArea`: Scrollable areas

#### Display Components
- `Avatar`: User avatars
- `Badge`: Status badges
- `Progress`: Progress bars
- `Label`: Form labels

### Styling System

#### Tailwind CSS Classes
- **Colors**: Custom color palette with gradients
- **Spacing**: Consistent spacing scale
- **Typography**: Font sizes and weights
- **Responsive**: Mobile-first responsive design
- **Animations**: Smooth transitions and hover effects

#### Design System
- **Primary Colors**: Blue and purple gradients
- **Secondary Colors**: Green, orange, red for different features
- **Typography**: Inter font family
- **Shadows**: Subtle shadows for depth
- **Border Radius**: Consistent rounded corners

---

## Frontend Pages

### Public Pages

#### 1. Landing Page (`/`)
- Hero section with app introduction
- Feature highlights
- Popular streaks preview
- Call-to-action buttons
- Responsive design

#### 2. Authentication (`/auth`)
- Login/signup form
- OAuth provider buttons
- Password reset functionality
- Form validation

### Authenticated Pages

#### 1. Explore (`/explore`)
- Browse all public streaks
- Search and filter functionality
- Category-based filtering
- Join streak functionality

#### 2. Create Streak (`/create`)
- Streak creation form
- Category and tag selection
- Privacy settings
- Form validation

#### 3. My Streaks (`/my-streaks`)
- User's active streaks
- Streak statistics
- Quick check-in interface
- Streak management

#### 4. Profile (`/profile`)
- User profile information
- Streak statistics
- Achievement display
- Activity history

#### 5. Streak Detail (`/streaks/[id]`)
- Individual streak view
- Leaderboard
- Comments and likes
- Check-in interface

### Advanced Pages

#### 1. Analytics (`/analytics`)
- Personal analytics dashboard
- Progress charts
- Streak statistics
- Goal tracking

#### 2. Achievements (`/achievements`)
- Available achievements
- Earned badges
- Progress tracking
- Achievement details

#### 3. Groups (`/groups`)
- Group management
- Group creation
- Member management
- Group streaks

#### 4. Challenges (`/challenges`)
- Challenge participation
- Challenge creation
- Leaderboards
- Progress tracking

#### 5. Messages (`/messages`)
- Direct messaging
- Group conversations
- Message history
- Real-time updates

#### 6. Settings (`/settings`)
- Profile settings
- Notification preferences
- Privacy settings
- Account management

---

## Mobile App Development Guide

### Recommended Technology Stack

#### 1. React Native with Expo
**Why Expo?**
- Rapid development and testing
- Built-in navigation and UI components
- Easy deployment to app stores
- Over-the-air updates
- Comprehensive SDK for native features

#### 2. Alternative: Flutter
**Why Flutter?**
- Single codebase for iOS and Android
- Excellent performance
- Rich UI components
- Strong community support

### Mobile App Architecture

#### 1. State Management
**Recommended: Redux Toolkit + RTK Query**
```typescript
// Store structure
interface RootState {
  auth: AuthState;
  streaks: StreaksState;
  user: UserState;
  notifications: NotificationsState;
  ui: UIState;
}
```

#### 2. Navigation
**React Navigation v6**
```typescript
// Navigation structure
const AppNavigator = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen name="Auth" component={AuthScreen} />
        <Stack.Screen name="Main" component={MainTabNavigator} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};
```

#### 3. API Integration
**Axios + React Query**
```typescript
// API client setup
const apiClient = axios.create({
  baseURL: 'https://your-api-domain.com/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// React Query hooks
const useStreaks = () => {
  return useQuery('streaks', () => apiClient.get('/streaks'));
};
```

### Mobile-Specific Features

#### 1. Push Notifications
```typescript
// Expo Notifications setup
import * as Notifications from 'expo-notifications';

const registerForPushNotifications = async () => {
  const { status } = await Notifications.requestPermissionsAsync();
  if (status !== 'granted') {
    alert('Failed to get push token for push notification!');
    return;
  }
  
  const token = (await Notifications.getExpoPushTokenAsync()).data;
  return token;
};
```

#### 2. Offline Support
```typescript
// AsyncStorage for offline data
import AsyncStorage from '@react-native-async-storage/async-storage';

const storeStreaksOffline = async (streaks: Streak[]) => {
  try {
    await AsyncStorage.setItem('offline_streaks', JSON.stringify(streaks));
  } catch (error) {
    console.error('Error storing streaks offline:', error);
  }
};
```

#### 3. Camera Integration
```typescript
// Expo Camera for streak verification
import { Camera } from 'expo-camera';

const StreakVerification = () => {
  const [hasPermission, setHasPermission] = useState(null);
  const [cameraRef, setCameraRef] = useState(null);

  const takePicture = async () => {
    if (cameraRef) {
      const photo = await cameraRef.takePictureAsync();
      // Upload photo for streak verification
    }
  };
};
```

### Mobile UI Components

#### 1. Custom Components
```typescript
// StreakCard component
interface StreakCardProps {
  streak: Streak;
  onJoin: (streakId: string) => void;
  onCheckIn: (streakId: string) => void;
}

const StreakCard: React.FC<StreakCardProps> = ({ streak, onJoin, onCheckIn }) => {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>{streak.title}</Text>
      <Text style={styles.description}>{streak.description}</Text>
      <View style={styles.actions}>
        <Button title="Join" onPress={() => onJoin(streak.id)} />
        <Button title="Check In" onPress={() => onCheckIn(streak.id)} />
      </View>
    </View>
  );
};
```

#### 2. Navigation Components
```typescript
// Bottom Tab Navigator
const MainTabNavigator = () => {
  return (
    <Tab.Navigator>
      <Tab.Screen 
        name="Home" 
        component={HomeScreen}
        options={{
          tabBarIcon: ({ color }) => <HomeIcon color={color} />
        }}
      />
      <Tab.Screen 
        name="My Streaks" 
        component={MyStreaksScreen}
        options={{
          tabBarIcon: ({ color }) => <StreakIcon color={color} />
        }}
      />
      <Tab.Screen 
        name="Explore" 
        component={ExploreScreen}
        options={{
          tabBarIcon: ({ color }) => <ExploreIcon color={color} />
        }}
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileScreen}
        options={{
          tabBarIcon: ({ color }) => <ProfileIcon color={color} />
        }}
      />
    </Tab.Navigator>
  );
};
```

### Mobile App Features

#### 1. Core Features
- **Streak Management**: Create, join, and track streaks
- **Check-ins**: Daily check-in with photo verification
- **Social Features**: Follow users, like streaks, comment
- **Notifications**: Push notifications for reminders
- **Offline Support**: Basic offline functionality

#### 2. Advanced Features
- **Camera Integration**: Photo verification for streaks
- **Location Services**: Location-based streak discovery
- **Biometric Authentication**: Fingerprint/Face ID login
- **Widget Support**: iOS/Android home screen widgets
- **Apple Watch/Android Wear**: Quick check-in from watch

#### 3. Performance Optimizations
- **Image Optimization**: Compress and cache images
- **Lazy Loading**: Load content as needed
- **Memory Management**: Proper cleanup of resources
- **Network Optimization**: Request batching and caching

### Development Workflow

#### 1. Setup
```bash
# Install Expo CLI
npm install -g @expo/cli

# Create new project
expo init GoLongMobile

# Install dependencies
cd GoLongMobile
npm install @react-navigation/native @react-navigation/bottom-tabs
npm install react-native-screens react-native-safe-area-context
npm install @reduxjs/toolkit react-redux
npm install axios @tanstack/react-query
```

#### 2. Development
```bash
# Start development server
expo start

# Run on iOS simulator
expo start --ios

# Run on Android emulator
expo start --android

# Run on physical device
expo start --tunnel
```

#### 3. Testing
```bash
# Run tests
npm test

# Run E2E tests
npm run test:e2e

# Test on multiple devices
expo start --dev-client
```

### Deployment

#### 1. App Store Preparation
```bash
# Build for production
expo build:ios
expo build:android

# Submit to stores
expo submit:ios
expo submit:android
```

#### 2. Over-the-Air Updates
```bash
# Publish update
expo publish

# Update specific platforms
expo publish --platform ios
expo publish --platform android
```

### API Integration for Mobile

#### 1. Authentication
```typescript
// Mobile auth service
class AuthService {
  async login(email: string, password: string) {
    const response = await apiClient.post('/auth/login', {
      email,
      password,
    });
    
    // Store token securely
    await SecureStore.setItemAsync('auth_token', response.data.token);
    return response.data;
  }

  async loginWithGoogle() {
    const result = await Google.logInAsync({
      androidClientId: GOOGLE_CLIENT_ID,
      iosClientId: GOOGLE_CLIENT_ID,
      scopes: ['profile', 'email'],
    });

    if (result.type === 'success') {
      // Exchange Google token for app token
      const response = await apiClient.post('/auth/google', {
        token: result.idToken,
      });
      
      await SecureStore.setItemAsync('auth_token', response.data.token);
      return response.data;
    }
  }
}
```

#### 2. Real-time Updates
```typescript
// WebSocket connection for real-time updates
import { io } from 'socket.io-client';

class RealtimeService {
  private socket: any;

  connect(token: string) {
    this.socket = io('wss://your-api-domain.com', {
      auth: { token },
    });

    this.socket.on('streak_updated', (data) => {
      // Update streak in local state
    });

    this.socket.on('new_notification', (notification) => {
      // Show notification
    });
  }

  disconnect() {
    this.socket?.disconnect();
  }
}
```

### Mobile App Screens

#### 1. Authentication Screens
- **Login Screen**: Email/password and OAuth options
- **Signup Screen**: Account creation
- **Forgot Password**: Password reset

#### 2. Main Screens
- **Home Screen**: Dashboard with active streaks
- **My Streaks**: User's streak management
- **Explore**: Discover public streaks
- **Profile**: User profile and settings

#### 3. Feature Screens
- **Streak Detail**: Individual streak view
- **Create Streak**: Streak creation form
- **Check-in**: Daily check-in interface
- **Leaderboard**: Streak rankings
- **Achievements**: Badge collection
- **Messages**: Direct messaging
- **Notifications**: Notification center

### Mobile-Specific Considerations

#### 1. Performance
- **Image Optimization**: Use WebP format, implement lazy loading
- **Memory Management**: Proper cleanup of components
- **Network Efficiency**: Implement request caching and batching

#### 2. User Experience
- **Touch Interactions**: Optimize for touch interfaces
- **Gesture Support**: Swipe gestures for navigation
- **Accessibility**: Screen reader support and accessibility features

#### 3. Platform Differences
- **iOS**: Follow Apple Human Interface Guidelines
- **Android**: Follow Material Design principles
- **Platform-specific Features**: Use platform-specific APIs when needed

---

## Deployment Guide

### Production Environment Setup

#### 1. Supabase Configuration
```bash
# Create production Supabase project
supabase init
supabase link --project-ref your-project-ref

# Deploy database schema
supabase db push

# Deploy edge functions
supabase functions deploy
```

#### 2. Environment Variables
```env
# Production environment variables
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NEXT_PUBLIC_APP_URL=https://your-domain.com

# OAuth provider credentials
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
APPLE_CLIENT_ID=your-apple-client-id
APPLE_CLIENT_SECRET=your-apple-client-secret
FACEBOOK_CLIENT_ID=your-facebook-client-id
FACEBOOK_CLIENT_SECRET=your-facebook-client-secret
```

#### 3. Vercel Deployment
```bash
# Install Vercel CLI
npm install -g vercel

# Deploy to Vercel
vercel --prod

# Set environment variables
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
vercel env add SUPABASE_SERVICE_ROLE_KEY
```

### Database Migration

#### 1. Schema Deployment
```sql
-- Run complete schema
\i complete-database-schema.sql

-- Verify tables
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public';

-- Check RLS policies
SELECT schemaname, tablename, policyname 
FROM pg_policies 
WHERE schemaname = 'public';
```

#### 2. Data Migration
```bash
# Export from old database
pg_dump old_database > old_data.sql

# Import to new database
psql new_database < old_data.sql
```

### Performance Optimization

#### 1. Database Optimization
- **Indexes**: Ensure all foreign keys and search columns are indexed
- **Query Optimization**: Use EXPLAIN ANALYZE for slow queries
- **Connection Pooling**: Configure Supabase connection limits

#### 2. Frontend Optimization
- **Code Splitting**: Implement dynamic imports
- **Image Optimization**: Use Next.js Image component
- **Caching**: Implement proper caching strategies

#### 3. CDN Configuration
- **Static Assets**: Serve static assets from CDN
- **API Caching**: Cache API responses where appropriate
- **Image CDN**: Use Supabase Storage CDN for images

### Monitoring and Analytics

#### 1. Error Tracking
```typescript
// Sentry integration
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
});
```

#### 2. Performance Monitoring
```typescript
// Web Vitals tracking
import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals';

function sendToAnalytics(metric) {
  // Send to analytics service
}

getCLS(sendToAnalytics);
getFID(sendToAnalytics);
getFCP(sendToAnalytics);
getLCP(sendToAnalytics);
getTTFB(sendToAnalytics);
```

#### 3. User Analytics
- **Google Analytics**: Track user behavior
- **Supabase Analytics**: Monitor database performance
- **Custom Metrics**: Track streak-specific metrics

---

## Development Setup

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Git
- Supabase account
- Code editor (VS Code recommended)

### Local Development Setup

#### 1. Clone Repository
```bash
git clone https://github.com/your-username/golong.git
cd golong
```

#### 2. Install Dependencies
```bash
npm install
```

#### 3. Environment Setup
```bash
# Copy environment template
cp .env.example .env.local

# Edit environment variables
nano .env.local
```

#### 4. Database Setup
```bash
# Initialize Supabase
supabase init

# Start local Supabase
supabase start

# Apply schema
supabase db reset
```

#### 5. Start Development Server
```bash
npm run dev
```

### Development Tools

#### 1. VS Code Extensions
- **ESLint**: Code linting
- **Prettier**: Code formatting
- **Tailwind CSS IntelliSense**: Tailwind autocomplete
- **TypeScript Importer**: Auto import types
- **Supabase**: Supabase integration

#### 2. Browser Extensions
- **React Developer Tools**: React debugging
- **Redux DevTools**: State management debugging
- **Supabase DevTools**: Database debugging

#### 3. Testing Setup
```bash
# Install Playwright
npm install -D @playwright/test

# Install test dependencies
npm install -D @testing-library/react @testing-library/jest-dom

# Run tests
npm test
```

### Code Quality

#### 1. Linting and Formatting
```bash
# Run ESLint
npm run lint

# Fix ESLint issues
npm run lint:fix

# Format code with Prettier
npm run format
```

#### 2. Type Checking
```bash
# Run TypeScript compiler
npm run type-check

# Watch mode for development
npm run type-check:watch
```

#### 3. Pre-commit Hooks
```json
// package.json
{
  "husky": {
    "hooks": {
      "pre-commit": "lint-staged"
    }
  },
  "lint-staged": {
    "*.{js,jsx,ts,tsx}": [
      "eslint --fix",
      "prettier --write"
    ]
  }
}
```

### Debugging

#### 1. Frontend Debugging
```typescript
// React DevTools
import { Profiler } from 'react';

// Performance profiling
<Profiler id="StreakList" onRender={onRenderCallback}>
  <StreakList />
</Profiler>
```

#### 2. API Debugging
```typescript
// API route debugging
export async function GET(request: NextRequest) {
  console.log('API Request:', {
    url: request.url,
    method: request.method,
    headers: Object.fromEntries(request.headers.entries()),
  });
  
  // Your API logic here
}
```

#### 3. Database Debugging
```sql
-- Enable query logging
SET log_statement = 'all';
SET log_min_duration_statement = 0;

-- Monitor slow queries
SELECT query, mean_time, calls 
FROM pg_stat_statements 
ORDER BY mean_time DESC 
LIMIT 10;
```

### Contributing Guidelines

#### 1. Code Style
- Use TypeScript for all new code
- Follow ESLint configuration
- Use Prettier for formatting
- Write meaningful commit messages

#### 2. Pull Request Process
1. Create feature branch
2. Make changes with tests
3. Run linting and tests
4. Submit pull request
5. Code review process
6. Merge to main

#### 3. Testing Requirements
- Unit tests for utility functions
- Integration tests for API endpoints
- E2E tests for critical user flows
- Performance tests for database queries

---

## Conclusion

This comprehensive documentation provides everything needed to understand, develop, and deploy the GoLong application. The documentation covers:

1. **Complete technical architecture** with frontend and backend details
2. **Detailed database schema** with all tables, relationships, and functions
3. **Comprehensive API documentation** with all endpoints and examples
4. **Authentication and authorization** system details
5. **UI component library** and styling system
6. **Mobile app development guide** with recommended technologies and architecture
7. **Deployment guide** for production environments
8. **Development setup** and best practices

This documentation serves as the foundation for building a mobile application that maintains feature parity with the web application while providing an optimized mobile experience.

For questions or clarifications, refer to the individual component files and API implementations in the codebase.
