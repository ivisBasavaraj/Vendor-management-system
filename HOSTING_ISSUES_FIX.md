# Hosting Issues Fix Guide

## Issues Identified

1. **Image Loading Error**: Images trying to load from `https://vendors.biec.in/uploads/...` instead of `https://api.vendors.biec.in/uploads/...`
2. **WebSocket Connection Error**: WebSocket trying to connect to wrong URL or server not properly configured

## Fixes Applied

### 1. Image Loading Fix ✅

**File**: `client/src/utils/imageUtils.ts`

**Problem**: The `getFullImageUrl` function was using the wrong base URL for constructing image URLs.

**Solution**: Updated the function to properly use the API base URL from environment variables.

```typescript
export const getFullImageUrl = (imageUrl: string | null | undefined): string => {
  if (!imageUrl) return '';
  
  // If the URL is already absolute, return as is
  if (imageUrl.startsWith('http') || imageUrl.startsWith('https')) {
    return imageUrl;
  }
  
  // If it's a relative URL, prepend the API server URL (not client URL)
  const serverUrl = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000';
  
  // Ensure the imageUrl starts with a slash
  const normalizedImageUrl = imageUrl.startsWith('/') ? imageUrl : `/${imageUrl}`;
  
  return `${serverUrl}${normalizedImageUrl}`;
};
```

### 2. WebSocket Connection Fix ✅

**File**: `client/src/contexts/WebSocketContext.tsx`

**Problem**: WebSocket connection was failing and not handling reconnection properly.

**Solution**: Added better error handling, reconnection logic, and exponential backoff.

**Key improvements**:
- Added reconnection attempts with exponential backoff
- Better error logging and handling
- Proper cleanup on component unmount
- Connection state management

### 3. Enhanced Error Handling ✅

**File**: `client/src/components/admin/UserForm.tsx`

**Problem**: Image errors were not handled gracefully.

**Solution**: Added better error handling for image loading failures.

## Verification Steps

### Step 1: Test the Fixes

Run the test script to verify your server endpoints:

```bash
node test-server-endpoints.js
```

This will test:
- API health check
- Static file serving
- WebSocket connectivity
- CORS headers

### Step 2: Check Environment Variables

Ensure your client `.env` file has the correct API URL:

```env
REACT_APP_API_BASE_URL=https://api.vendors.biec.in
```

### Step 3: Verify Server Configuration

Check that your server is properly configured to:
1. Serve static files from `/uploads/` directory
2. Handle WebSocket connections on `/ws` path
3. Have proper CORS configuration

## Common Server Configuration Issues

### Nginx Configuration (if using Nginx)

Add these configurations to your Nginx server block:

```nginx
# Static files
location /uploads/ {
    alias /path/to/your/server/uploads/;
    expires 1y;
    add_header Cache-Control "public, immutable";
}

# WebSocket support
location /ws {
    proxy_pass http://localhost:5000;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```

### Apache Configuration (if using Apache)

Add these to your Apache virtual host:

```apache
# Static files
Alias /uploads /path/to/your/server/uploads
<Directory "/path/to/your/server/uploads">
    Options Indexes FollowSymLinks
    AllowOverride None
    Require all granted
</Directory>

# WebSocket support (requires mod_proxy_wstunnel)
ProxyPass /ws ws://localhost:5000/ws
ProxyPassReverse /ws ws://localhost:5000/ws
```

## Testing After Deployment

1. **Test Image Loading**:
   - Open browser dev tools
   - Navigate to user management
   - Check if profile images load correctly
   - URLs should show `https://api.vendors.biec.in/uploads/...`

2. **Test WebSocket Connection**:
   - Open browser dev tools → Network tab → WS filter
   - Should see successful WebSocket connection to `wss://api.vendors.biec.in/ws`
   - Connection should show as "101 Switching Protocols"

3. **Test Functionality**:
   - Upload a new profile image
   - Check if it displays correctly
   - Verify real-time notifications work

## Troubleshooting

### If Images Still Don't Load:

1. Check server logs for 404 errors
2. Verify file permissions on uploads directory
3. Test direct URL access: `https://api.vendors.biec.in/uploads/profile-images/`
4. Check if reverse proxy is properly configured

### If WebSocket Still Fails:

1. Check if WebSocket is enabled in your reverse proxy
2. Verify firewall allows WebSocket connections
3. Check server logs for WebSocket errors
4. Test WebSocket connection directly using browser dev tools

### If CORS Issues Persist:

1. Verify `CLIENT_URL` in server environment variables
2. Check CORS configuration in `server.js`
3. Ensure your domain is in the allowed origins list

## Expected Results After Fix

✅ **Images should load from**: `https://api.vendors.biec.in/uploads/profile-images/...`
✅ **WebSocket should connect to**: `wss://api.vendors.biec.in/ws`
✅ **No more console errors** for image loading or WebSocket connections
✅ **Real-time notifications** should work properly
✅ **Profile image uploads** should work and display correctly

## Need Help?

If issues persist after applying these fixes:

1. Run the test script and share the output
2. Check browser console for any remaining errors
3. Check server logs for error messages
4. Verify your reverse proxy configuration
5. Test direct API endpoints using curl or Postman