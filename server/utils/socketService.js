const socketIo = require('socket.io');

class SocketService {
  constructor() {
    this.io = null;
    this.connections = new Map(); // Map user IDs to socket IDs
  }

  initialize(server) {
    this.io = socketIo(server, {
      cors: {
        origin: [
          process.env.FRONTEND_URL || 'http://localhost:3000',
          'https://vendors.biec.in'
        ],
        methods: ['GET', 'POST', 'OPTIONS'],
        credentials: true,
        allowedHeaders: ['Content-Type', 'Authorization']
      }
    });

    this.io.on('connection', (socket) => {
      console.log(`New client connected: ${socket.id}`);

      // Handle user authentication and store connection
      socket.on('authenticate', (userId) => {
        if (userId) {
          this.connections.set(userId, socket.id);
          console.log(`User ${userId} authenticated with socket ${socket.id}`);
          
          // Join user-specific room for targeted notifications
          socket.join(`user:${userId}`);
          
          // Join role-based rooms
          socket.on('joinRole', (role) => {
            if (role) {
              socket.join(`role:${role}`);
              console.log(`Socket ${socket.id} joined room: role:${role}`);
            }
          });
        }
      });

      // Handle disconnection
      socket.on('disconnect', () => {
        console.log(`Client disconnected: ${socket.id}`);
        // Remove user from connections map
        for (const [userId, socketId] of this.connections.entries()) {
          if (socketId === socket.id) {
            this.connections.delete(userId);
            console.log(`User ${userId} disconnected`);
            break;
          }
        }
      });
    });

    console.log('Socket.io service initialized');
    return this.io;
  }

  // Send notification to specific user
  sendToUser(userId, event, data) {
    if (this.io) {
      this.io.to(`user:${userId}`).emit(event, data);
    }
  }

  // Send notification to all users with specific role
  sendToRole(role, event, data) {
    if (this.io) {
      this.io.to(`role:${role}`).emit(event, data);
    }
  }

  // Send login approval request notification to admins and consultants
  sendLoginApprovalRequest(loginApproval, vendor) {
    if (this.io) {
      // Send to all admins
      this.sendToRole('admin', 'login_approval_request', {
        loginApprovalId: loginApproval._id,
        vendor: {
          id: vendor._id,
          name: vendor.name,
          email: vendor.email,
          company: vendor.company
        },
        createdAt: loginApproval.createdAt,
        expiresAt: loginApproval.expiresAt
      });

      // Send to all consultants
      this.sendToRole('consultant', 'login_approval_request', {
        loginApprovalId: loginApproval._id,
        vendor: {
          id: vendor._id,
          name: vendor.name,
          email: vendor.email,
          company: vendor.company
        },
        createdAt: loginApproval.createdAt,
        expiresAt: loginApproval.expiresAt
      });
    }
  }

  // Send login approval status update to vendor
  sendLoginApprovalUpdate(vendorId, status, approver) {
    if (this.io) {
      this.sendToUser(vendorId, 'login_approval_update', {
        status,
        approverName: approver ? approver.name : 'System',
        timestamp: new Date()
      });
    }
  }

  // Send password reset notification to admins
  sendPasswordResetNotification(user) {
    if (this.io) {
      // Send to all admins
      this.sendToRole('admin', 'password_reset_request', {
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
  }
}

// Create singleton instance
const socketService = new SocketService();

module.exports = socketService;