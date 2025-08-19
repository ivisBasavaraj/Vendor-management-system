# Deployment Guide for Vendor Management System

This guide will help you deploy the Vendor Management System to production.

## Client Deployment

1. Build the client application:
   ```bash
   cd client
   npm run build
   ```

2. Deploy the built files to your web server (Netlify, Vercel, or any static hosting service).

3. Make sure your environment variables are set correctly:
   - `REACT_APP_API_BASE_URL` should point to your API server (e.g., `https://vendor-management-system-api.herokuapp.com`)
   - `REACT_APP_CLIENT_URL` should be your client domain (e.g., `https://vendors.biec.in`)

## Server Deployment

1. Deploy the server to a hosting service like Heroku:
   ```bash
   cd server
   git init
   git add .
   git commit -m "Initial commit"
   heroku create vendor-management-system-api
   git push heroku master
   ```

2. Set the environment variables on your server:
   ```bash
   heroku config:set NODE_ENV=production
   heroku config:set FRONTEND_URL=https://vendors.biec.in
   heroku config:set CLIENT_URL=https://vendors.biec.in
   heroku config:set JWT_SECRET=your_jwt_secret
   heroku config:set MONGO_URI=your_mongodb_connection_string
   # Set other environment variables as needed
   ```

## CORS Configuration

The server is configured to allow requests from the following origins:
- `http://localhost:3000` (development)
- `http://localhost:3001` (development)
- `https://vendors.biec.in` (production)
- `https://api.emailjs.com` (for EmailJS integration)

If you need to add more allowed origins, update the `allowedOrigins` array in `server.js`.

## WebSocket Configuration

The WebSocket connection is configured to use the same domain as the API server. In production, it will use a secure WebSocket connection (`wss://`).

## Troubleshooting

### CORS Issues

If you're experiencing CORS issues:

1. Check that your client is making requests to the correct API URL.
2. Verify that your server's CORS configuration includes your client domain.
3. Make sure your server is responding with the appropriate CORS headers.

### WebSocket Connection Issues

If WebSocket connections are failing:

1. Ensure your server supports WebSocket connections.
2. Check that the WebSocket URL is correct (should use `wss://` for secure connections).
3. Verify that your server's CORS configuration allows WebSocket connections.

## Monitoring

Monitor your application for errors using your hosting provider's logging system. You can also implement additional logging using services like Sentry or LogRocket.