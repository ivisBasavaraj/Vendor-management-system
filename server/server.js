const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const http = require('http');
const webSocketService = require('./utils/webSocketService');
const errorHandler = require('./middlewares/error.middleware');

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();

// CORS Configuration for EmailJS and local development
const corsOptions = {
  origin: function (origin, callback) {
<<<<<<< HEAD
    console.log(`CORS request from origin: ${origin}`);
    
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) {
      console.log('Allowing request with null origin');
      return callback(null, true);
    }
=======
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
>>>>>>> cff623d17f221f2c9aa778db9d1b99cdd539ac8a
    
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:3001',
      'http://127.0.0.1:3000',
      'http://127.0.0.1:3001',
      'https://api.emailjs.com',
      'https://vendors.biec.in',
<<<<<<< HEAD
      'https://www.vendors.biec.in', // Added www variant
      process.env.CLIENT_URL
    ].filter(Boolean); // Remove undefined values
    
    console.log('Allowed origins:', allowedOrigins);
    
    if (allowedOrigins.includes(origin)) {
      console.log(`Origin ${origin} is allowed`);
=======
      process.env.CLIENT_URL
    ].filter(Boolean); // Remove undefined values
    
    if (allowedOrigins.includes(origin)) {
>>>>>>> cff623d17f221f2c9aa778db9d1b99cdd539ac8a
      callback(null, true);
    } else {
      console.log('CORS request from origin:', origin);
      // In production, be more strict about CORS
      if (process.env.NODE_ENV === 'production') {
        // Only allow specific origins in production
        callback(new Error('Not allowed by CORS'));
      } else {
        // Allow all origins in development
        callback(null, true);
      }
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-requested-with'],
  optionsSuccessStatus: 200 // For legacy browser support
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Import routes
const authRoutes = require('./routes/auth.routes');
const roleAuthRoutes = require('./routes/roleAuth.routes');
const userRoutes = require('./routes/user.routes');
const documentRoutes = require('./routes/document.routes');
const reportRoutes = require('./routes/report.routes');
const notificationRoutes = require('./routes/notification.routes');
const loginApprovalRoutes = require('./routes/loginApproval.routes');
const workflowRoutes = require('./routes/workflow.routes');
const documentSubmissionRoutes = require('./routes/documentSubmission.routes');
const dashboardRoutes = require('./routes/dashboard.routes');
const activityLogRoutes = require('./routes/activityLog.routes');
const complianceReportRoutes = require('./routes/complianceReport.routes');
const emailRoutes = require('./routes/email.routes');


// Use routes
app.use('/api/auth', authRoutes);
app.use('/api/auth', roleAuthRoutes); // Role-based authentication routes
app.use('/api/users', userRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/login-approvals', loginApprovalRoutes);
app.use('/api/workflow', workflowRoutes);
app.use('/api/document-submissions', documentSubmissionRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/activity-logs', activityLogRoutes);
app.use('/api/compliance-reports', complianceReportRoutes);
app.use('/api/email', emailRoutes);


// Home route
app.get('/', (req, res) => {
  res.send('Vendor Management System API is running');
});

// Error handling middleware
<<<<<<< HEAD
app.use((err, req, res, next) => {
  console.error('Error:', err);
  console.log('Request headers:', req.headers);
  console.log('Request origin:', req.headers.origin);
  errorHandler(err, req, res, next);
});

// Log all requests to help diagnose CORS issues
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  console.log('Headers:', req.headers);
  console.log('Origin:', req.headers.origin);
  next();
});
=======
app.use(errorHandler);
>>>>>>> cff623d17f221f2c9aa778db9d1b99cdd539ac8a

// Connect to MongoDB
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/vendor-management';

// Create HTTP server
const server = http.createServer(app);

// Initialize WebSocket
webSocketService.initialize(server);

mongoose.connect(MONGO_URI)
  .then(() => {
    console.log('Connected to MongoDB');
    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`WebSocket server initialized`);
    });
  })
  .catch(err => {
    console.error('Failed to connect to MongoDB', err);
  });
