# 🍎 Apple OAuth Setup Guide for GoLong

This guide will help you set up Apple OAuth authentication for your GoLong streak tracking application.

## 📋 Prerequisites

- Apple Developer Account (paid membership required)
- Access to Apple Developer Console
- Supabase project with your GoLong app

## 🔧 Step 1: Apple Developer Console Setup

### 1.1 Create App ID

1. **Go to Apple Developer Console**: https://developer.apple.com/account/
2. **Sign in** with your Apple ID
3. **Navigate to**: Certificates, Identifiers & Profiles → Identifiers
4. **Create a new App ID**:
   - Click the "+" button
   - Select "App IDs" → Continue
   - Choose "App" → Continue
   - Fill in:
     - **Description**: GoLong Streak Tracker
     - **Bundle ID**: `com.golong.app` (or your preferred bundle ID)
   - **Enable Sign In with Apple** capability
   - Click "Continue" → "Register"

### 1.2 Create Service ID for Web Authentication

1. **Go to Identifiers** → Click "+" → "Services IDs" → Continue
2. **Fill in**:
   - **Description**: GoLong Web Authentication
   - **Identifier**: `com.golong.web` (or your preferred service ID)
3. **Enable Sign In with Apple**
4. **Configure** → Add your domains:
   - **Primary App ID**: Select the App ID you created above
   - **Website URLs**:
     - `https://golong-bba8fi1rr-yuvrajs-projects-683cce99.vercel.app`
     - `http://localhost:3000` (for development)
   - **Return URLs**:
     - `https://golong-bba8fi1rr-yuvrajs-projects-683cce99.vercel.app/auth/callback`
     - `http://localhost:3000/auth/callback`
5. **Click "Continue" → "Register"**

### 1.3 Create Key for Sign in with Apple

1. **Go to Keys** → Click "+"
2. **Key Name**: GoLong Sign In Key
3. **Enable Sign In with Apple**
4. **Configure** → Select your App ID
5. **Click "Continue" → "Register"**
6. **Download the key file** (.p8 file) - **IMPORTANT**: Save this file securely

## 🔧 Step 2: Supabase Configuration

### 2.1 Enable Apple Provider

1. **Go to your Supabase Dashboard**: https://supabase.com/dashboard/project/YOUR-PROJECT-REF
2. **Navigate to**: Authentication → Providers
3. **Find Apple** and click "Enable"
4. **Fill in the configuration**:
   - **Client ID**: Your Service ID (e.g., `com.golong.web`)
   - **Client Secret**: You'll generate this using the key file
   - **Redirect URL**: `https://golong-bba8fi1rr-yuvrajs-projects-683cce99.vercel.app/auth/callback`

### 2.2 Generate Client Secret

You need to generate a JWT token using the key file you downloaded. Here's how:

1. **Install the required tools**:
   ```bash
   npm install -g @supabase/cli
   ```

2. **Generate the client secret**:
   ```bash
   # Replace with your actual values
   supabase auth generate-jwt \
     --key-id=YOUR_KEY_ID \
     --team-id=YOUR_TEAM_ID \
     --private-key=@path/to/your/key.p8 \
     --audience=https://appleid.apple.com \
     --subject=YOUR_SERVICE_ID
   ```

   **Where to find these values**:
   - **Key ID**: Found in the Keys section of Apple Developer Console
   - **Team ID**: Found in Membership section of Apple Developer Console
   - **Private Key**: The .p8 file you downloaded
   - **Service ID**: The Service ID you created (e.g., `com.golong.web`)

3. **Copy the generated JWT token** and paste it as the Client Secret in Supabase

### 2.3 Configure Site URL and Redirect URLs

1. **Go to**: Authentication → URL Configuration
2. **Set Site URL**: `https://golong-bba8fi1rr-yuvrajs-projects-683cce99.vercel.app`
3. **Add Redirect URLs**:
   - `https://golong-bba8fi1rr-yuvrajs-projects-683cce99.vercel.app/auth/callback`
   - `http://localhost:3000/auth/callback`

## 🔧 Step 3: Test Apple OAuth

### 3.1 Test Locally

1. **Start your development server**:
   ```bash
   npm run dev
   ```

2. **Go to**: `http://localhost:3000/auth`
3. **Click "Continue with Apple"**
4. **Complete the OAuth flow**

### 3.2 Test Production

1. **Deploy your changes** to Vercel
2. **Go to**: `https://golong-bba8fi1rr-yuvrajs-projects-683cce99.vercel.app/auth`
3. **Test the Apple login**

## 🔧 Step 4: Troubleshooting

### Common Issues

1. **"Invalid redirect URI"**
   - Check that your Service ID return URLs match exactly
   - Ensure no trailing slashes

2. **"App not verified"**
   - This is normal for development
   - Click "Advanced" → "Go to GoLong" to proceed

3. **"Invalid client"**
   - Verify your Service ID is correct
   - Check that Sign In with Apple is enabled

4. **"Invalid client secret"**
   - Regenerate the JWT token
   - Ensure the key file is correct

### Debug Steps

1. **Check browser console** for error messages
2. **Verify Supabase logs** in the dashboard
3. **Test with different browsers**
4. **Clear browser cache and cookies**

## 📝 Important Notes

- **Apple OAuth requires HTTPS** in production
- **The .p8 key file is sensitive** - keep it secure
- **Service ID must be unique** across all Apple Developer accounts
- **Return URLs must match exactly** (including protocol and trailing slashes)

## 🎉 Success Indicators

- ✅ Apple login button appears on auth page
- ✅ Clicking redirects to Apple OAuth page
- ✅ Successful authentication with Apple
- ✅ Redirect back to your app
- ✅ User profile created automatically

## 📞 Support

If you encounter issues:
1. Check the Apple Developer Console for any errors
2. Verify Supabase configuration
3. Test with different browsers
4. Check browser console for detailed error messages

---

**Your GoLong App URLs**:
- **Production**: `https://golong-bba8fi1rr-yuvrajs-projects-683cce99.vercel.app`
- **Auth Page**: `https://golong-bba8fi1rr-yuvrajs-projects-683cce99.vercel.app/auth`
- **Supabase Project**: `https://supabase.com/dashboard/project/YOUR-PROJECT-REF`
