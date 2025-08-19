const express = require('express');
const router = express.Router();
const activityLogController = require('../controllers/activityLog.controller');
const authMiddleware = require('../middlewares/auth.middleware');

// Apply authentication middleware to all routes
router.use(authMiddleware.protect);

// Only admin can access all activity logs
router.get('/', authMiddleware.authorize('admin'), activityLogController.getAllActivityLogs);

// Get activity statistics
router.get('/stats', authMiddleware.authorize('admin'), activityLogController.getActivityStats);

// Get activity logs for a specific user
router.get('/users/:userId', authMiddleware.authorize('admin'), activityLogController.getUserActivityLogs);

// Get activity logs for vendors
router.get('/vendors', authMiddleware.authorize('admin'), activityLogController.getVendorActivityLogs);
router.get('/vendors/:vendorId', authMiddleware.authorize('admin'), activityLogController.getVendorActivityLogs);

// Get activity logs for consultants
router.get('/consultants', authMiddleware.authorize('admin'), activityLogController.getConsultantActivityLogs);
router.get('/consultants/:consultantId', authMiddleware.authorize('admin'), activityLogController.getConsultantActivityLogs);

// Get activity logs for a specific document
router.get('/documents/:documentId', authMiddleware.authorize('admin'), activityLogController.getDocumentActivityLogs);

// Manually log an activity
router.post('/log', activityLogController.manualLogActivity);

// Create test activity logs (development only)
router.post('/test-data', activityLogController.createTestActivityLogs);

module.exports = router;