# 📘 Facebook OAuth Setup Guide for GoLong

This guide will help you set up Facebook OAuth authentication for your GoLong streak tracking application.

## 📋 Prerequisites

- Facebook account
- Access to Facebook Developers Console
- Supabase project with your GoLong app

## 🔧 Step 1: Facebook Developer Console Setup

### 1.1 Create Facebook App

1. **Go to Facebook Developers**: https://developers.facebook.com/
2. **Click "Get Started"** or **"My Apps"** → **"Create App"**
3. **Choose "Consumer"** as the app type
4. **Fill in app details**:
   - **App Name**: `GoLong Streak Tracker`
   - **App Contact Email**: Your email address
   - **Business Account**: (Optional, you can skip this)
5. **Click "Create App"**

### 1.2 Add Facebook Login Product

1. **In your app dashboard**, click **"Add Product"**
2. **Find "Facebook Login"** and click **"Set Up"**
3. **Choose "Web"** as the platform
4. **Enter your site URL**: `https://golong-bba8fi1rr-yuvrajs-projects-683cce99.vercel.app`

### 1.3 Configure Facebook Login

1. **Go to Facebook Login** → **Settings**
2. **Add Valid OAuth Redirect URIs**:
   - `https://golong-bba8fi1rr-yuvrajs-projects-683cce99.vercel.app/auth/callback`
   - `http://localhost:3000/auth/callback`
   - `http://localhost:3002/auth/callback`
3. **Click "Save Changes"**

### 1.4 Get App Credentials

1. **Go to Settings** → **Basic**
2. **Copy your App ID** (you'll need this for Supabase)
3. **Copy your App Secret** (you'll need this for Supabase)
4. **Note your App Domain**: `golong-bba8fi1rr-yuvrajs-projects-683cce99.vercel.app`

## 🔧 Step 2: Supabase Configuration

### 2.1 Enable Facebook Provider

1. **Go to your Supabase Dashboard**: https://supabase.com/dashboard/project/YOUR-PROJECT-REF
2. **Navigate to**: Authentication → Providers
3. **Find Facebook** and click "Enable"
4. **Fill in the configuration**:
   - **Client ID**: Your Facebook App ID
   - **Client Secret**: Your Facebook App Secret
   - **Redirect URL**: `https://golong-bba8fi1rr-yuvrajs-projects-683cce99.vercel.app/auth/callback`

### 2.2 Configure Site URL and Redirect URLs

1. **Go to**: Authentication → URL Configuration
2. **Set Site URL**: `https://golong-bba8fi1rr-yuvrajs-projects-683cce99.vercel.app`
3. **Add Redirect URLs**:
   - `https://golong-bba8fi1rr-yuvrajs-projects-683cce99.vercel.app/auth/callback`
   - `http://localhost:3000/auth/callback`
   - `http://localhost:3002/auth/callback`

## 🔧 Step 3: Test Facebook OAuth

### 3.1 Test Locally

1. **Start your development server**:
   ```bash
   npm run dev
   ```

2. **Go to**: `http://localhost:3002/auth`
3. **Click "Continue with Facebook"**
4. **Complete the OAuth flow**

### 3.2 Test Production

1. **Deploy your changes** to Vercel
2. **Go to**: `https://golong-bba8fi1rr-yuvrajs-projects-683cce99.vercel.app/auth`
3. **Test the Facebook login**

## 🔧 Step 4: Troubleshooting

### Common Issues

1. **"Invalid OAuth redirect URI"**
   - Check that your redirect URIs match exactly in Facebook app settings
   - Ensure no trailing slashes

2. **"App not live"**
   - Your Facebook app needs to be in "Live" mode for production
   - Go to App Review → Permissions and Features → Make your app live

3. **"Invalid client"**
   - Verify your App ID and App Secret are correct
   - Check that Facebook Login is enabled

4. **"CORS error"**
   - Ensure your domain is added to Facebook app settings
   - Check that HTTPS is used in production

### Debug Steps

1. **Check browser console** for error messages
2. **Verify Supabase logs** in the dashboard
3. **Test with different browsers**
4. **Clear browser cache and cookies**

## 📝 Important Notes

- **Facebook OAuth requires HTTPS** in production
- **App must be in "Live" mode** for production use
- **Redirect URIs must match exactly** (including protocol and trailing slashes)
- **Facebook app review** may be required for certain permissions

## 🎉 Success Indicators

- ✅ Facebook login button appears on auth page
- ✅ Clicking redirects to Facebook OAuth page
- ✅ Successful authentication with Facebook
- ✅ Redirect back to your app
- ✅ User profile created automatically

## 📞 Support

If you encounter issues:
1. Check the Facebook Developer Console for any errors
2. Verify Supabase configuration
3. Test with different browsers
4. Check browser console for detailed error messages

---

**Your GoLong App URLs**:
- **Production**: `https://golong-bba8fi1rr-yuvrajs-projects-683cce99.vercel.app`
- **Auth Page**: `https://golong-bba8fi1rr-yuvrajs-projects-683cce99.vercel.app/auth`
- **Supabase Project**: `https://supabase.com/dashboard/project/YOUR-PROJECT-REF`
- **Facebook Developers**: `https://developers.facebook.com/apps/`
