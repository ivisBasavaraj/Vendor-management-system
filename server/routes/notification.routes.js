const express = require('express');
const {
  getMyNotifications,
  markAsRead,
  markAllAsRead,
  createNotification,
  deleteNotification
} = require('../controllers/notification.controller');

const router = express.Router();

// Import middleware
const { protect, authorize } = require('../middlewares/auth.middleware');

// Notification routes
router.get('/', protect, getMyNotifications);
router.put('/:id/read', protect, markAsRead);
router.put('/read-all', protect, markAllAsRead);
router.post('/', protect, authorize('admin'), createNotification);
router.delete('/:id', protect, deleteNotification);

module.exports = router; 