const Notification = require('../models/notification.model');
const User = require('../models/user.model');
const webSocketService = require('../utils/webSocketService');

// Get notifications for the current user
exports.getMyNotifications = async (req, res) => {
  try {
    // Pagination
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    
    // Get total count
    const total = await Notification.countDocuments({ recipient: req.user.id });

    // Get notifications with related data
    const notifications = await Notification.find({ recipient: req.user.id })
      .populate('sender', 'name email')
      .populate('relatedDocument', 'title status')
      .sort({ createdAt: -1 })
      .skip(startIndex)
      .limit(limit);

    // Pagination result
    const pagination = {};
    if (endIndex < total) {
      pagination.next = { page: page + 1, limit };
    }
    if (startIndex > 0) {
      pagination.prev = { page: page - 1, limit };
    }

    res.status(200).json({
      success: true,
      count: notifications.length,
      pagination,
      data: notifications,
      total,
      unread: await Notification.countDocuments({ recipient: req.user.id, isRead: false })
    });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({
      success: false,
      message: 'Could not fetch notifications',
      error: error.message
    });
  }
};

// Mark notification as read
exports.markAsRead = async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    // Check if user owns this notification
    if (notification.recipient.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this notification'
      });
    }

    notification.isRead = true;
    await notification.save();

    res.status(200).json({
      success: true,
      data: notification
    });
  } catch (error) {
    console.error('Mark notification error:', error);
    res.status(500).json({
      success: false,
      message: 'Could not mark notification as read',
      error: error.message
    });
  }
};

// Mark all notifications as read
exports.markAllAsRead = async (req, res) => {
  try {
    await Notification.updateMany(
      { recipient: req.user.id, isRead: false },
      { isRead: true }
    );

    res.status(200).json({
      success: true,
      message: 'All notifications marked as read'
    });
  } catch (error) {
    console.error('Mark all notifications error:', error);
    res.status(500).json({
      success: false,
      message: 'Could not mark all notifications as read',
      error: error.message
    });
  }
};

// Create notification (internal use and admin)
exports.createNotification = async (req, res) => {
  try {
    const { recipients, title, message, type, relatedDocument, relatedWorkflow } = req.body;

    if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Recipients are required'
      });
    }

    if (!title || !message) {
      return res.status(400).json({
        success: false,
        message: 'Title and message are required'
      });
    }

    // Create notifications for each recipient
    const notificationPromises = recipients.map(async (recipientId) => {
      const notification = await Notification.create({
        recipient: recipientId,
        sender: req.user.id,
        type: type || 'system',
        title,
        message,
        relatedDocument,
        relatedWorkflow
      });

      return notification;
    });

    const notifications = await Promise.all(notificationPromises);

    res.status(201).json({
      success: true,
      count: notifications.length,
      data: notifications
    });
  } catch (error) {
    console.error('Create notification error:', error);
    res.status(500).json({
      success: false,
      message: 'Could not create notifications',
      error: error.message
    });
  }
};



// Delete notification
exports.deleteNotification = async (req, res) => {
  try {
    // Validate notification ID format
    if (!req.params.id || !req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid notification ID format'
      });
    }

    const notification = await Notification.findById(req.params.id);

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    // Check if user owns this notification or is admin
    if (notification.recipient.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this notification'
      });
    }

    // Delete the notification
    const deletedNotification = await Notification.findByIdAndDelete(req.params.id);
    
    if (!deletedNotification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found or already deleted'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Notification deleted successfully',
      data: {
        id: req.params.id,
        deletedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Delete notification error:', error);
    
    // Handle specific MongoDB errors
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid notification ID format'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Could not delete notification',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
}; 