const WebSocket = require('ws');

class WebSocketService {
  constructor() {
    this.wss = null;
    this.connections = new Map(); // Map user IDs to WebSocket connections
    this.userRoles = new Map(); // Map user IDs to their roles
  }

  initialize(server) {
    this.wss = new WebSocket.Server({ 
      server,
      path: '/ws',
      cors: {
        origin: [
          process.env.FRONTEND_URL || 'http://localhost:3000',
          'https://vendors.biec.in'
        ],
        credentials: true
      }
    });

    this.wss.on('connection', (ws, req) => {
      console.log(`New WebSocket client connected from ${req.socket.remoteAddress}`);

      ws.on('message', (message) => {
        try {
          const data = JSON.parse(message.toString());
          this.handleMessage(ws, data);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
          ws.send(JSON.stringify({
            type: 'error',
            message: 'Invalid message format'
          }));
        }
      });

      ws.on('close', () => {
        console.log('WebSocket client disconnected');
        // Remove user from connections map
        for (const [userId, connection] of this.connections.entries()) {
          if (connection === ws) {
            this.connections.delete(userId);
            this.userRoles.delete(userId);
            console.log(`User ${userId} disconnected`);
            break;
          }
        }
      });

      ws.on('error', (error) => {
        console.error('WebSocket error:', error);
      });

      // Send connection confirmation
      ws.send(JSON.stringify({
        type: 'connection',
        message: 'WebSocket connection established'
      }));
    });

    console.log('Native WebSocket service initialized');
    return this.wss;
  }

  handleMessage(ws, data) {
    switch (data.type) {
      case 'authenticate':
        if (data.userId && data.role) {
          this.connections.set(data.userId, ws);
          this.userRoles.set(data.userId, data.role);
          console.log(`User ${data.userId} authenticated with role ${data.role}`);
          
          ws.send(JSON.stringify({
            type: 'authenticated',
            message: 'Authentication successful',
            userId: data.userId,
            role: data.role
          }));
        } else {
          ws.send(JSON.stringify({
            type: 'error',
            message: 'Authentication failed: missing userId or role'
          }));
        }
        break;

      case 'ping':
        ws.send(JSON.stringify({
          type: 'pong',
          timestamp: Date.now()
        }));
        break;

      default:
        console.log('Unknown message type:', data.type);
        ws.send(JSON.stringify({
          type: 'error',
          message: 'Unknown message type'
        }));
    }
  }

  // Send notification to specific user
  sendToUser(userId, event, data) {
    const connection = this.connections.get(userId);
    if (connection && connection.readyState === WebSocket.OPEN) {
      try {
        connection.send(JSON.stringify({
          type: event,
          data: data,
          timestamp: Date.now()
        }));
        console.log(`Sent ${event} notification to user ${userId}`);
        return true;
      } catch (error) {
        console.error(`Error sending notification to user ${userId}:`, error);
        // Remove dead connection
        this.connections.delete(userId);
        this.userRoles.delete(userId);
        return false;
      }
    } else {
      console.log(`User ${userId} is not connected or connection is not open`);
      return false;
    }
  }

  // Send notification to all users with specific role
  sendToRole(role, event, data) {
    let sentCount = 0;
    for (const [userId, userRole] of this.userRoles.entries()) {
      if (userRole === role) {
        if (this.sendToUser(userId, event, data)) {
          sentCount++;
        }
      }
    }
    console.log(`Sent ${event} notification to ${sentCount} users with role ${role}`);
    return sentCount;
  }

  // Send notification to all connected users
  broadcast(event, data) {
    let sentCount = 0;
    for (const [userId] of this.connections.entries()) {
      if (this.sendToUser(userId, event, data)) {
        sentCount++;
      }
    }
    console.log(`Broadcasted ${event} notification to ${sentCount} users`);
    return sentCount;
  }

  // Get connected users count
  getConnectedUsersCount() {
    return this.connections.size;
  }

  // Get all connected user IDs
  getConnectedUserIds() {
    return Array.from(this.connections.keys());
  }

  // Check if user is connected
  isUserConnected(userId) {
    const connection = this.connections.get(userId);
    return connection && connection.readyState === WebSocket.OPEN;
  }

  // Get users by role
  getUsersByRole(role) {
    const users = [];
    for (const [userId, userRole] of this.userRoles.entries()) {
      if (userRole === role && this.isUserConnected(userId)) {
        users.push(userId);
      }
    }
    return users;
  }

  // Send login approval request notification to admins and consultants
  sendLoginApprovalRequest(loginApproval, vendor) {
    const notificationData = {
      loginApprovalId: loginApproval._id,
      vendor: {
        id: vendor._id,
        name: vendor.name,
        email: vendor.email,
        company: vendor.company
      },
      createdAt: loginApproval.createdAt,
      expiresAt: loginApproval.expiresAt
    };

    // Send to all admins
    const adminsSent = this.sendToRole('admin', 'login_approval_request', notificationData);
    
    // Send to all consultants
    const consultantsSent = this.sendToRole('consultant', 'login_approval_request', notificationData);
    
    console.log(`Login approval request sent to ${adminsSent} admins and ${consultantsSent} consultants`);
    return { adminsSent, consultantsSent };
  }

  // Send login approval status update to vendor
  sendLoginApprovalUpdate(vendorId, status, approver) {
    return this.sendToUser(vendorId, 'login_approval_update', {
      status,
      approverName: approver ? approver.name : 'System',
      timestamp: new Date()
    });
  }

  // Send password reset notification to admins
  sendPasswordResetNotification(user) {
    return this.sendToRole('admin', 'password_reset_request', {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        company: user.company
      },
      timestamp: new Date(),
      expiresAt: new Date(Date.now() + 30 * 60 * 1000) // 30 minutes
    });
  }

  // Clean up dead connections
  cleanupConnections() {
    for (const [userId, connection] of this.connections.entries()) {
      if (connection.readyState !== WebSocket.OPEN) {
        this.connections.delete(userId);
        this.userRoles.delete(userId);
        console.log(`Cleaned up dead connection for user ${userId}`);
      }
    }
  }
}

// Create singleton instance
const webSocketService = new WebSocketService();

module.exports = webSocketService;