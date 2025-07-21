# Authentication Issues Fix Guide

## The Problem
Sign-in and sign-up are not working on the deployed site at https://jpjpkimjp.github.io/xbrush_movie_MVP1/

## Most Common Causes & Solutions

### 1. **Firebase Console Configuration** (MOST LIKELY)
You need to check these settings in Firebase Console:

1. **Enable Email/Password Authentication**:
   - Go to https://console.firebase.google.com/project/xbrush-moviemaker-mvp/authentication/providers
   - Enable "Email/Password" provider
   - Make sure it's turned ON

2. **Add Authorized Domains**:
   - Go to https://console.firebase.google.com/project/xbrush-moviemaker-mvp/authentication/settings
   - Add these domains to "Authorized domains":
     - `jpjpkimjp.github.io`
     - `localhost` (for local testing)

### 2. **Check Browser Console**
Open the site and press F12 to open developer console:

1. Try to sign up/sign in
2. Look for errors in the Console tab
3. Common errors:
   - `auth/operation-not-allowed` = Email/password auth not enabled
   - `auth/unauthorized-domain` = Domain not authorized
   - `Failed to load resource` = Network/CORS issues

### 3. **Debug Steps**
1. Open https://jpjpkimjp.github.io/xbrush_movie_MVP1/
2. Open browser console (F12)
3. Run these commands:

```javascript
// Check Firebase status
debugAuth()

// Check configuration
checkFirebaseConfig()

// Test authentication directly
testSignUp('test@example.com', 'password123')
```

### 4. **Quick Test Page**
Open this test page to verify authentication:
https://jpjpkimjp.github.io/xbrush_movie_MVP1/test-auth.html

## Firebase Console Checklist

- [ ] Email/Password authentication is enabled
- [ ] jpjpkimjp.github.io is in authorized domains
- [ ] localhost is in authorized domains
- [ ] Firebase project is active (not deleted/suspended)
- [ ] Quotas are not exceeded

## If Still Not Working

1. **Check Network Tab**:
   - Look for failed requests to `identitytoolkit.googleapis.com`
   - Check for CORS errors

2. **Verify Firebase Config**:
   - Make sure the Firebase configuration in `js/config.js` matches your Firebase project

3. **Test Locally**:
   ```bash
   # Start a local server
   python3 -m http.server 8000
   # Open http://localhost:8000
   ```

## Emergency Fix

If you need to bypass authentication temporarily:

1. In Firebase Console, enable Anonymous Authentication
2. Update `js/config.js`:
   ```javascript
   enableAnonymousAuth: true,
   requireEmailVerification: false,
   ```

## Contact Support

If none of these work, the issue might be:
- Firebase project suspended
- API key restrictions
- Billing/quota issues

Check Firebase Console for any warning messages.