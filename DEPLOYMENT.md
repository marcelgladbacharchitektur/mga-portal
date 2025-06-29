# Deployment Guide for MGA Portal

## Netlify Deployment

### 1. Environment Variables

Add these environment variables in Netlify Dashboard → Site Settings → Environment Variables:

```bash
# Required
PUBLIC_SUPABASE_URL=your-supabase-url
PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_KEY=your-supabase-service-key
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_REDIRECT_URI=https://mga-portal.netlify.app/auth/callback
API_TOKEN=generate-a-secure-token

# Optional but recommended
PUBLIC_APP_URL=https://mga-portal.netlify.app
```

### 2. Google Cloud Console Setup

1. Go to https://console.cloud.google.com
2. Select your project
3. Navigate to "APIs & Services" → "Credentials"
4. Click on your OAuth 2.0 Client ID
5. Under "Authorized redirect URIs" add:
   ```
   https://mga-portal.netlify.app/auth/callback
   http://localhost:5173/auth/callback
   ```
6. Under "Authorized JavaScript origins" add:
   ```
   https://mga-portal.netlify.app
   http://localhost:5173
   ```
7. Save changes

### 3. Build Settings in Netlify

- Build command: `npm run build`
- Publish directory: `build`
- Node version: 18.x or higher

### 4. Important Notes

- The `GOOGLE_REDIRECT_URI` must match EXACTLY what's in Google Cloud Console
- Changes in Google Cloud Console can take 5-10 minutes to propagate
- Make sure all environment variables are set before deploying
- The `API_TOKEN` should be a secure random string (use a password generator)

### 5. Testing the Deployment

After deployment, test these endpoints:
- https://mga-portal.netlify.app/api/auth/google/check (verify redirect URI)
- https://mga-portal.netlify.app/auth/debug (check OAuth status)

### 6. Troubleshooting

If you get "redirect_uri_mismatch":
1. Check https://mga-portal.netlify.app/api/auth/google/check
2. Copy the exact `computedRedirectUri` value
3. Add it to Google Cloud Console
4. Wait 5-10 minutes and try again