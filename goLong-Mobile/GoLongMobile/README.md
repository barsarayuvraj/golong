# GoLong Mobile App

A React Native mobile application for GoLong - the community-driven streak tracking platform.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn
- Expo CLI
- iOS Simulator (for iOS development)
- Android Studio/Emulator (for Android development)

### Installation

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment variables:**
   ```bash
   cp .env.example .env
   # Edit .env with your actual API URLs and keys
   ```

3. **Start the development server:**
   ```bash
   npm start
   ```

4. **Run on device/simulator:**
   ```bash
   # iOS
   npm run ios
   
   # Android
   npm run android
   
   # Web
   npm run web
   ```

## 📁 Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── common/         # Generic components (Button, Input, etc.)
│   ├── forms/          # Form components
│   └── streak/         # Streak-specific components
├── screens/            # Screen components
│   ├── auth/           # Authentication screens
│   ├── home/           # Home dashboard
│   ├── streaks/        # Streak management
│   └── profile/        # User profile
├── navigation/         # Navigation configuration
├── services/           # API and external services
│   ├── api/            # API client
│   ├── auth/           # Authentication service
│   ├── storage/        # Local storage
│   └── notifications/  # Push notifications
├── store/              # Redux store
│   ├── slices/         # Redux slices
│   └── middleware/     # Custom middleware
├── hooks/              # Custom React hooks
├── utils/              # Utility functions
├── types/              # TypeScript types
└── constants/          # App constants
```

## 🛠️ Development

### Available Scripts

- `npm start` - Start Expo development server
- `npm run ios` - Run on iOS simulator
- `npm run android` - Run on Android emulator
- `npm run web` - Run on web browser
- `npm test` - Run tests
- `npm run lint` - Run ESLint
- `npm run type-check` - Run TypeScript type checking

### Code Style

- Use TypeScript for all new code
- Follow ESLint configuration
- Use Prettier for formatting
- Write meaningful commit messages

### Testing

- Unit tests with Jest
- Component tests with React Native Testing Library
- E2E tests with Detox (coming soon)

## 📱 Features

### Implemented
- ✅ Project setup and configuration
- ✅ Basic app structure
- ✅ TypeScript types
- ✅ API client setup
- ✅ Storage service
- ✅ Constants and styling

### In Development
- [ ] Authentication system
- [ ] Streak management
- [ ] Daily check-ins
- [ ] Social features
- [ ] Push notifications
- [ ] Offline support

## 🔧 Configuration

### Environment Variables

Create a `.env` file with the following variables:

```env
EXPO_PUBLIC_API_URL=https://your-api-domain.com/api
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
EXPO_PUBLIC_GOOGLE_CLIENT_ID=your-google-client-id
EXPO_PUBLIC_APPLE_CLIENT_ID=your-apple-client-id
EXPO_PUBLIC_FACEBOOK_CLIENT_ID=your-facebook-client-id
```

### API Integration

The app connects to the GoLong web API. Make sure your API is running and accessible.

## 📚 Documentation

- **[Comprehensive Documentation](../docs/COMPREHENSIVE_DOCUMENTATION.md)** - Complete application overview
- **[API Reference](../docs/API_REFERENCE.md)** - Detailed API documentation
- **[Mobile Development Guide](../docs/MOBILE_APP_DEVELOPMENT_GUIDE.md)** - Step-by-step development guide

## 🐛 Troubleshooting

### Common Issues

1. **Metro bundler issues:**
   ```bash
   npx expo start --clear
   ```

2. **iOS simulator not starting:**
   ```bash
   npx expo run:ios --device
   ```

3. **Android emulator issues:**
   ```bash
   npx expo run:android --device
   ```

### Getting Help

- Check the documentation in the `docs/` folder
- Review the API reference for endpoint details
- Follow the mobile development guide for implementation steps

## 🚀 Deployment

### Development Build
```bash
eas build --profile development --platform ios
eas build --profile development --platform android
```

### Production Build
```bash
eas build --profile production --platform ios
eas build --profile production --platform android
```

### App Store Submission
```bash
eas submit --platform ios --profile production
eas submit --platform android --profile production
```

## 📄 License

This project is part of the GoLong application suite.

---

**Status**: 🚧 In Development  
**Version**: 1.0.0  
**Last Updated**: January 2024



