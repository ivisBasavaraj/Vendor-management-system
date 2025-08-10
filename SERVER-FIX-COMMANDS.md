# Server Fix Commands for Your VPS

## 🔍 Current PM2 Status
- **Active Server**: `vendor-management-system` (ID 3)
- **Status**: Online ✅
- **Uptime**: 19 hours

## 🔧 Server Environment Fix

### Step 1: Check Current Server .env File
```bash
# Check your current server .env file
cat /var/www/Vendor-management-system/server/.env
```

### Step 2: Add Missing CLIENT_URL
```bash
# Navigate to server directory
cd /var/www/Vendor-management-system/server

# Add the missing CLIENT_URL line
echo "CLIENT_URL=https://vendors.biec.in" >> .env

# Verify it was added
cat .env | grep CLIENT_URL
```

### Step 3: Restart Your Server
```bash
# Restart the vendor-management-system process
pm2 restart vendor-management-system

# Check if it restarted successfully
pm2 status
```

### Step 4: Check Server Logs
```bash
# Check for any errors after restart
pm2 logs vendor-management-system --lines 20
```

## 🧪 Test Server API

### Test if API is responding:
```bash
# Test API endpoint
curl -I https://api.vendors.biec.in/api/users

# Should return HTTP 200 or similar
```

### Test image directory:
```bash
# Check if uploads directory exists
ls -la /var/www/Vendor-management-system/server/uploads/
ls -la /var/www/Vendor-management-system/server/uploads/profile-images/
```

## 🔍 Complete Server .env File Should Look Like:

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
```

## 🚨 Quick Fix Commands (Run These):

```bash
# 1. Add CLIENT_URL to server .env
cd /var/www/Vendor-management-system/server
echo "CLIENT_URL=https://vendors.biec.in" >> .env

# 2. Restart server
pm2 restart vendor-management-system

# 3. Check status
pm2 status

# 4. Check logs for errors
pm2 logs vendor-management-system --lines 10
```

## 🎯 Expected Results After Fix:

1. **Server restart**: Should show "online" status
2. **No errors**: PM2 logs should show no CORS errors
3. **API accessible**: `curl https://api.vendors.biec.in` should respond
4. **Images load**: Profile images should load from `api.vendors.biec.in`

## 📞 Next Steps:

1. **Run the quick fix commands above**
2. **Check if server restarts successfully**
3. **Test your website again**
4. **Let me know if you see any errors in PM2 logs**

The server needs the `CLIENT_URL` environment variable to allow CORS requests from your frontend domain!