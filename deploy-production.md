# Production Deployment Guide

## Issue Fixed
The profile images were not loading because the client application was configured to use `http://localhost:5000` for API calls, but your hosted API is at `https://api.vendors.biec.in`.

## Changes Made

### Client Configuration (.env and .env.production)
- Updated `REACT_APP_API_BASE_URL` from `http://localhost:5000` to `https://api.vendors.biec.in`
- Updated `REACT_APP_CLIENT_URL` from `http://localhost:3000` to `https://vendors.biec.in`
- Set `REACT_APP_NODE_ENV` to `production`

### Server Configuration (.env)
- Updated `NODE_ENV` from `development` to `production`
- Updated `FRONTEND_URL` from `http://localhost:3000` to `https://vendors.biec.in`
- Added `CLIENT_URL=https://vendors.biec.in` for CORS configuration

## Deployment Steps

### 1. Rebuild the Client Application
```bash
cd client
npm run build
```

### 2. Deploy the Built Files
Upload the contents of the `client/build` folder to your hosting service (where https://vendors.biec.in is hosted).

### 3. Restart the Server
If your API server is running, restart it to pick up the new environment variables:
```bash
cd server
npm start
```

## Verification Steps

1. **Check API Connection**: Open browser developer tools and verify that API calls are going to `https://api.vendors.biec.in`

2. **Check Image URLs**: Verify that profile image URLs are now generated as `https://api.vendors.biec.in/uploads/profile-images/...`

3. **Test Profile Images**: 
   - Upload a new profile image
   - Check if existing profile images now load correctly
   - Verify images appear in header, user management, and other components

## Troubleshooting

### If images still don't load:
1. Check browser console for CORS errors
2. Verify that your API server at `https://api.vendors.biec.in` is serving static files from `/uploads`
3. Check that the `uploads` folder exists and has proper permissions on your server

### If API calls fail:
1. Verify that `https://api.vendors.biec.in` is accessible
2. Check CORS configuration on the server
3. Ensure SSL certificates are properly configured

## Environment Variables Summary

### Client (.env.production)
```
REACT_APP_API_BASE_URL=https://api.vendors.biec.in
REACT_APP_CLIENT_URL=https://vendors.biec.in
REACT_APP_NODE_ENV=production
```

### Server (.env)
```
NODE_ENV=production
FRONTEND_URL=https://vendors.biec.in
CLIENT_URL=https://vendors.biec.in
```

The image loading issue should be resolved after rebuilding and deploying with these configurations.