# VPS Deployment Guide

## Environment Files for Your VPS

I've created production-ready `.env` files for your VPS deployment:

### 1. Server Environment File (`server/.env.production`)
This file should be placed in your server directory on the VPS.

**Important configurations to update:**

```bash
# MongoDB Connection - Update this with your production MongoDB URI
MONGO_URI=mongodb://localhost:27017/vendor-management
# If using MongoDB Atlas or external MongoDB:
# MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/vendor-management

# Email Configuration - Update with your actual email credentials
SMTP_USER=basavarajkasbi@gmail.com
SMTP_PASSWORD=yourpassword  # Use App Password for Gmail
EMAIL_FROM=basavarajkasbi@gmail.com

# JWT Secret - Change this to a strong, unique secret
JWT_SECRET=mansi  # CHANGE THIS TO A STRONG SECRET
```

### 2. Client Environment File (`client/.env.vps`)
This file should be used when building the client for production.

## VPS Deployment Steps

### Step 1: Upload Files to VPS
1. Upload your project files to your VPS
2. Place the `.env.production` file in the `server/` directory
3. Use the `.env.vps` file when building the client

### Step 2: Server Setup on VPS
```bash
# Navigate to server directory
cd /path/to/your/project/server

# Copy the production environment file
cp .env.production .env

# Install dependencies
npm install --production

# Start the server (use PM2 for production)
npm install -g pm2
pm2 start server.js --name "vendor-api"
pm2 startup
pm2 save
```

### Step 3: Client Build and Deployment
```bash
# Navigate to client directory
cd /path/to/your/project/client

# Copy the VPS environment file
cp .env.vps .env

# Install dependencies and build
npm install
npm run build

# Deploy the build folder to your web server (nginx/apache)
# Copy contents of 'build' folder to your web server document root
```

### Step 4: Web Server Configuration (Nginx Example)

Create nginx configuration for your domains:

#### Frontend (vendors.biec.in)
```nginx
server {
    listen 80;
    listen 443 ssl;
    server_name vendors.biec.in;
    
    # SSL configuration
    ssl_certificate /path/to/ssl/certificate.crt;
    ssl_certificate_key /path/to/ssl/private.key;
    
    root /path/to/client/build;
    index index.html;
    
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    # Handle static assets
    location /static/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

#### API (api.vendors.biec.in)
```nginx
server {
    listen 80;
    listen 443 ssl;
    server_name api.vendors.biec.in;
    
    # SSL configuration
    ssl_certificate /path/to/ssl/certificate.crt;
    ssl_certificate_key /path/to/ssl/private.key;
    
    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
    
    # Handle file uploads
    client_max_body_size 50M;
}
```

## Security Checklist

### 1. Update Sensitive Information
- [ ] Change `JWT_SECRET` to a strong, unique secret
- [ ] Update MongoDB URI with production credentials
- [ ] Update email credentials with actual values
- [ ] Use App Passwords for Gmail SMTP

### 2. Database Security
- [ ] Secure MongoDB with authentication
- [ ] Use strong database passwords
- [ ] Configure firewall rules for database access

### 3. Server Security
- [ ] Configure firewall (UFW/iptables)
- [ ] Set up SSL certificates (Let's Encrypt recommended)
- [ ] Configure fail2ban for SSH protection
- [ ] Regular security updates

### 4. Application Security
- [ ] Set strong JWT secret
- [ ] Configure CORS properly
- [ ] Set up rate limiting
- [ ] Monitor logs regularly

## Environment Variables Explanation

### Server Variables
- `PORT`: Server port (5000)
- `NODE_ENV`: Set to 'production'
- `MONGO_URI`: MongoDB connection string
- `JWT_SECRET`: Secret for JWT token signing
- `FRONTEND_URL`: Your frontend domain
- `CLIENT_URL`: Same as frontend URL for CORS
- `SMTP_*`: Email configuration
- `TRUST_PROXY`: Enable if behind reverse proxy
- `SECURE_COOKIES`: Enable secure cookies in production

### Client Variables
- `REACT_APP_API_BASE_URL`: Your API domain
- `REACT_APP_CLIENT_URL`: Your frontend domain
- `REACT_APP_NODE_ENV`: Set to 'production'
- `GENERATE_SOURCEMAP`: Disable for production
- `INLINE_RUNTIME_CHUNK`: Disable for better caching

## Troubleshooting

### Profile Images Not Loading
1. Ensure API server is accessible at `https://api.vendors.biec.in`
2. Check that `/uploads` directory exists and has proper permissions
3. Verify nginx is serving static files correctly

### CORS Issues
1. Verify `CLIENT_URL` in server `.env` matches your frontend domain
2. Check nginx proxy headers are set correctly
3. Ensure SSL is properly configured

### Database Connection Issues
1. Check MongoDB is running and accessible
2. Verify connection string format
3. Check firewall rules for database port

## Monitoring

### Using PM2 for Server Management
```bash
# Check server status
pm2 status

# View logs
pm2 logs vendor-api

# Restart server
pm2 restart vendor-api

# Monitor resources
pm2 monit
```

### Log Files to Monitor
- `/var/log/nginx/access.log`
- `/var/log/nginx/error.log`
- PM2 logs: `pm2 logs`
- MongoDB logs: `/var/log/mongodb/mongod.log`

After following these steps, your profile images should load correctly from `https://api.vendors.biec.in/uploads/profile-images/`.