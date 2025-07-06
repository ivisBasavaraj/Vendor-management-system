const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema({
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Recipient is required']
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  type: {
    type: String,
    enum: [
      'document_submission', 
      'document_resubmitted',
      'document_review', 
      'document_approved', 
      'document_rejected', 
      'user_registration', 
      'workflow_update',
      'system',
      'login_request',
      'login_approved',
      'login_rejected'
    ],
    required: [true, 'Notification type is required']
  },
  title: {
    type: String,
    required: [true, 'Notification title is required']
  },
  message: {
    type: String,
    required: [true, 'Notification message is required']
  },
  relatedDocument: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Document'
  },
  relatedWorkflow: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Workflow'
  },
  relatedLoginApproval: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'LoginApproval'
  },
  isRead: {
    type: Boolean,
    default: false
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  actionUrl: String
}, {
  timestamps: true
});

module.exports = mongoose.model('Notification', NotificationSchema); 