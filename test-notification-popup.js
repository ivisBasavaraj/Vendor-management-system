/**
 * Test script to verify notification popup functionality
 * This script will test if notifications appear as pop-ups with sounds
 */

const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');

const app = express();
const server = http.createServer(app);

// Enable CORS
app.use(cors({
  origin: ['http://localhost:3000', 'https://vendors.biec.in'],
  credentials: true
}));

// Initialize Socket.IO
const io = socketIo(server, {
  cors: {
    origin: ['http://localhost:3000', 'https://vendors.biec.in'],
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Store connected users
const connectedUsers = new Map();

io.on('connection', (socket) => {
  console.log(`New client connected: ${socket.id}`);

  // Handle user authentication
  socket.on('authenticate', (userId) => {
    if (userId) {
      connectedUsers.set(userId, socket.id);
      socket.join(`user:${userId}`);
      console.log(`User ${userId} authenticated with socket ${socket.id}`);
    }
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log(`Client disconnected: ${socket.id}`);
    // Remove user from connected users
    for (const [userId, socketId] of connectedUsers.entries()) {
      if (socketId === socket.id) {
        connectedUsers.delete(userId);
        break;
      }
    }
  });
});

// Test endpoint to send notification
app.get('/test-notification/:userId', (req, res) => {
  const { userId } = req.params;
  
  const testNotification = {
    type: 'notification',
    event: 'notification',
    data: {
      title: 'Test Notification',
      message: 'This is a test notification to verify pop-up functionality with sound!',
      type: 'system',
      priority: 'high',
      createdAt: new Date().toISOString(),
      sender: {
        name: 'System Test',
        email: 'system@test.com'
      }
    }
  };

  // Send to specific user
  io.to(`user:${userId}`).emit('message', JSON.stringify(testNotification));
  
  console.log(`Test notification sent to user ${userId}`);
  res.json({ 
    success: true, 
    message: `Test notification sent to user ${userId}`,
    connectedUsers: Array.from(connectedUsers.keys())
  });
});

// Test endpoint to send notification to all users
app.get('/test-broadcast-notification', (req, res) => {
  const testNotification = {
    type: 'notification',
    event: 'notification',
    data: {
      title: 'Broadcast Test Notification',
      message: 'This is a broadcast test notification sent to all connected users!',
      type: 'system',
      priority: 'urgent',
      createdAt: new Date().toISOString(),
      sender: {
        name: 'System Broadcast',
        email: 'system@broadcast.com'
      }
    }
  };

  // Send to all connected users
  io.emit('message', JSON.stringify(testNotification));
  
  console.log('Broadcast test notification sent to all users');
  res.json({ 
    success: true, 
    message: 'Broadcast test notification sent to all users',
    connectedUsers: Array.from(connectedUsers.keys())
  });
});

// Get connected users
app.get('/connected-users', (req, res) => {
  res.json({
    connectedUsers: Array.from(connectedUsers.keys()),
    totalConnected: connectedUsers.size
  });
});

const PORT = process.env.TEST_PORT || 3001;
server.listen(PORT, () => {
  console.log(`\n🧪 Notification Test Server running on port ${PORT}`);
  console.log(`\n📋 Test Instructions:`);
  console.log(`1. Make sure your main application is running on http://localhost:3000`);
  console.log(`2. Login to your application and note your user ID`);
  console.log(`3. Test individual notification: GET http://localhost:${PORT}/test-notification/YOUR_USER_ID`);
  console.log(`4. Test broadcast notification: GET http://localhost:${PORT}/test-broadcast-notification`);
  console.log(`5. Check connected users: GET http://localhost:${PORT}/connected-users`);
  console.log(`\n🔊 Expected behavior:`);
  console.log(`- Pop-up notification should appear in the application`);
  console.log(`- Alert sound should play`);
  console.log(`- Notification should auto-close after 5 seconds (unless urgent)`);
  console.log(`- Browser notification may also appear if permission is granted`);
});