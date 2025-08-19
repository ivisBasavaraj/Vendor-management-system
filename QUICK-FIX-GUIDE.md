# Quick Fix for Profile Images Issue

## What's Missing in Your Current Setup

Your server `.env` file is good, but it's missing one crucial variable for CORS configuration:

### Add This Line to Your Server .env File:
```bash
CLIENT_URL=https://vendors.biec.in
```

## Complete Updated Server .env File

Here's your complete server `.env` file with the missing variables:

```bash
# Server Configuration
PORT=5000
NODE_ENV=production

# MongoDB Connection
MONGO_URI=mongodb://127.0.0.1:27017/vms

# JWT Configuration
JWT_SECRET=your_secure_jwt_secret
JWT_EXPIRE=30d
JWT_COOKIE_EXPIRE=30

# Frontend URL for email links and CORS
FRONTEND_URL=https://vendors.biec.in
CLIENT_URL=https://vendors.biec.in

# Gmail SMTP Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASSWORD=your_app_password
EMAIL_FROM=your_email@gmail.com
EMAIL_FROM_NAME=IMTMA

# Resend API
RESEND_API_KEY=your_resend_api_key

# Email Rate Limiting and Retry Settings
EMAIL_MAX_RETRIES=3
MAX_EMAILS_PER_HOUR=50

# File Upload Settings
MAX_FILE_SIZE=10
MAX_REQUEST_SIZE=50
UPLOAD_PATH=./uploads

# Logging
LOG_LEVEL=info

# Security Settings for Production
TRUST_PROXY=true
SECURE_COOKIES=true
```

## Client .env File for Production Build

Create this `.env` file in your client directory before building:

```bash
# Production Client Environment Configuration

# API Configuration - Your VPS API URL
REACT_APP_API_BASE_URL=https://api.vendors.biec.in

# EmailJS Configuration
REACT_APP_EMAILJS_SERVICE_ID=service_5oxyeaa
REACT_APP_EMAILJS_TEMPLATE_ID=template_yajf9hf
REACT_APP_EMAILJS_USER_ID=o3dwpHGpHKdlNsieC

# Client Configuration
REACT_APP_CLIENT_URL=https://vendors.biec.in

# Environment
REACT_APP_NODE_ENV=production

# Build Configuration
GENERATE_SOURCEMAP=false
INLINE_RUNTIME_CHUNK=false
```

## Quick Deployment Steps

### 1. Update Server Environment
```bash
# On your VPS, add the missing CLIENT_URL to your server .env file
echo "CLIENT_URL=https://vendors.biec.in" >> /path/to/your/server/.env

# Restart your server
pm2 restart vendor-api
# OR if not using PM2:
# sudo systemctl restart your-app-service
```

### 2. Rebuild and Deploy Client
```bash
# On your local machine or build server
cd /path/to/client

# Create the production .env file with the content above
# Then build
npm run build

# Upload the build folder contents to your web server
```

## Why This Fixes the Profile Image Issue

1. **CLIENT_URL**: Ensures CORS allows requests from your frontend domain
2. **REACT_APP_API_BASE_URL**: Makes client request images from correct API URL
3. **Proper Environment**: Sets production mode for both client and server

## Expected Result

After these changes, profile images will load from:
```
https://api.vendors.biec.in/uploads/profile-images/profile-xxxxx.png
```

Instead of the incorrect:
```
https://vendors.biec.in/uploads/profile-images/profile-xxxxx.png
```

## Verification Steps

1. **Check API calls**: Open browser dev tools → Network tab → Verify API calls go to `api.vendors.biec.in`
2. **Check image URLs**: Inspect profile images → Verify src URLs point to `api.vendors.biec.in`
3. **Test upload**: Upload a new profile image and verify it displays correctly

## If Still Not Working

Check these common issues:

1. **Server restart**: Ensure you restarted the server after updating .env
2. **Client rebuild**: Ensure you rebuilt the client with the new .env
3. **Cache**: Clear browser cache or try incognito mode
4. **SSL**: Ensure both domains have valid SSL certificates
5. **Firewall**: Ensure port 5000 is accessible on your VPS
6. **Nginx/Apache**: Ensure reverse proxy is configured correctly for api.vendors.biec.in

The key missing piece was the `CLIENT_URL` environment variable for CORS configuration!