# Clear Browser Cache Fix

The 406 error you're seeing is likely caused by **cached old JavaScript** in your browser.

## Fix Steps:

### 1. Hard Refresh Your Browser
- **Windows/Linux**: Press `Ctrl + Shift + R` or `Ctrl + F5`
- **Mac**: Press `Cmd + Shift + R`

### 2. Clear Site Data (Recommended)
1. Open Chrome DevTools (F12)
2. Go to **Application** tab
3. Under "Storage" on the left, click **"Clear site data"**
4. Click **"Clear site data"** button
5. Close DevTools
6. Refresh the page

### 3. Clear Browser Cache Completely
1. Open Chrome Settings
2. Go to **Privacy and security** > **Clear browsing data**
3. Select:
   - ✅ Cached images and files
   - ✅ Site settings (optional)
4. Time range: **Last hour** or **Last 24 hours**
5. Click **Clear data**

### 4. Re-login and Test
1. Go to your site: funding-unseaf.org
2. Log in again
3. Try making a payment

## Why This Happens

When you deploy new code to Hostinger but your browser has cached the old JavaScript files, it tries to make API calls using outdated code patterns. This causes:
- 406 errors (Not Acceptable)
- Failed resource loads
- Unexpected behavior

The hard refresh forces your browser to download the latest JavaScript files from the server.

## If Still Not Working

If after clearing cache it still doesn't work, the issue might be:
1. The new code hasn't been deployed yet
2. Hostinger is caching the old files (wait 5-10 minutes)
3. The deployment.zip wasn't uploaded correctly

Let me know the result after trying the hard refresh!
