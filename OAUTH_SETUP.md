# OAuth Setup Guide for GoLong

This guide will help you set up OAuth providers (Google, Apple, Facebook, Twitter) for your GoLong app.

## Prerequisites

1. **Supabase Project**: You need a Supabase project set up
2. **Domain**: Your app domain (for production) or localhost (for development)

## 1. Google OAuth Setup

### Step 1: Google Cloud Console
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable the Google+ API

### Step 2: Create OAuth Credentials
1. Go to "Credentials" in the left sidebar
2. Click "Create Credentials" → "OAuth 2.0 Client IDs"
3. Choose "Web application"
4. Add these URIs:
   - **Authorized JavaScript origins**: 
     - `http://localhost:3000` (for development)
     - `https://yourdomain.com` (for production)
   - **Authorized redirect URIs**:
     - `https://your-project-ref.supabase.co/auth/v1/callback`

### Step 3: Configure in Supabase
1. Go to your Supabase dashboard
2. Navigate to Authentication → Providers
3. Enable Google provider
4. Add your Google Client ID and Client Secret

## 2. Apple OAuth Setup

### Step 1: Apple Developer Console
1. Go to [Apple Developer Console](https://developer.apple.com/)
2. Sign in with your Apple ID
3. Go to "Certificates, Identifiers & Profiles"

### Step 2: Create App ID
1. Go to "Identifiers" → "App IDs"
2. Click "+" to create new App ID
3. Choose "App" type
4. Enable "Sign In with Apple" capability

### Step 3: Create Service ID
1. Go to "Identifiers" → "Services IDs"
2. Click "+" to create new Service ID
3. Enable "Sign In with Apple"
4. Add redirect URL: `https://your-project-ref.supabase.co/auth/v1/callback`

### Step 4: Configure in Supabase
1. Go to your Supabase dashboard
2. Navigate to Authentication → Providers
3. Enable Apple provider
4. Add your Apple Client ID and Client Secret

## 3. Facebook OAuth Setup

### Step 1: Facebook Developers Console
1. Go to [Facebook Developers](https://developers.facebook.com/)
2. Create a new app
3. Choose "Consumer" app type

### Step 2: Configure Facebook Login
1. Add "Facebook Login" product
2. Go to Facebook Login → Settings
3. Add Valid OAuth Redirect URIs:
   - `https://your-project-ref.supabase.co/auth/v1/callback`

### Step 3: Configure in Supabase
1. Go to your Supabase dashboard
2. Navigate to Authentication → Providers
3. Enable Facebook provider
4. Add your Facebook App ID and App Secret

## 4. Twitter OAuth Setup

### Step 1: Twitter Developer Portal
1. Go to [Twitter Developer Portal](https://developer.twitter.com/)
2. Create a new app
3. Go to App Settings → Authentication settings

### Step 2: Configure OAuth
1. Enable "OAuth 2.0"
2. Add Callback URL: `https://your-project-ref.supabase.co/auth/v1/callback`
3. Add Website URL: `https://yourdomain.com`

### Step 3: Configure in Supabase
1. Go to your Supabase dashboard
2. Navigate to Authentication → Providers
3. Enable Twitter provider
4. Add your Twitter Client ID and Client Secret

## 5. Environment Variables

Update your `.env.local` file:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## 6. Testing OAuth

1. Start your development server: `npm run dev`
2. Go to `/auth` page
3. Click on any OAuth provider button
4. Complete the OAuth flow
5. You should be redirected back to your app

## 7. Production Deployment

When deploying to production:

1. Update all OAuth provider settings with your production domain
2. Update `NEXT_PUBLIC_APP_URL` to your production URL
3. Update Supabase redirect URLs in each provider
4. Test the OAuth flow in production

## Troubleshooting

### Common Issues:

1. **"Invalid redirect URI"**: Make sure the redirect URI in your OAuth provider matches exactly with Supabase
2. **"App not verified"**: Some providers require app verification for production use
3. **CORS errors**: Make sure your domain is added to authorized origins
4. **Profile creation fails**: Check that the profiles table exists and has proper RLS policies

### Debug Steps:

1. Check browser console for errors
2. Check Supabase logs in the dashboard
3. Verify environment variables are correct
4. Test with one provider at a time

## Security Notes

- Never commit OAuth secrets to version control
- Use environment variables for all sensitive data
- Regularly rotate OAuth credentials
- Monitor OAuth usage in provider dashboards
- Implement proper error handling for failed OAuth flows
