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

// CORS Configuration
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  'https://vendors.biec.in',
  'https://www.vendors.biec.in',
  'https://api.vendors.biec.in',
  process.env.CLIENT_URL
].filter(Boolean);

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-requested-with'],
  optionsSuccessStatus: 200, // For legacy browser support
  exposedHeaders: ['Content-Disposition']
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json({ limit: '500mb' }));
app.use(express.urlencoded({ extended: true, limit: '500mb' }));

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

// Handle OPTIONS requests first
app.options('*', cors(corsOptions));

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
