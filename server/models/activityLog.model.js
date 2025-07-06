const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');

/**
 * Activity Log Schema
 * Captures all user activities in the system including vendors, consultants, and admins
 */
const activityLogSchema = new mongoose.Schema({
  // The user who performed the action
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: 'userModel',
    required: false // Not required as some activities might be system-generated
  },
  
  // The model type of the user (User, System)
  userModel: {
    type: String,
    enum: ['User', 'System'],
    required: true
  },
  
  // User's name or identifier (for display purposes)
  userName: {
    type: String,
    required: true
  },
  
  // Type of user (vendor, consultant, admin, system)
  userType: {
    type: String,
    enum: ['vendor', 'consultant', 'admin', 'system'],
    required: true
  },
  
  // The action performed (e.g., 'Document Uploaded', 'Login', etc.)
  action: {
    type: String,
    required: true
  },
  
  // Description of the activity (optional)
  description: {
    type: String,
    default: ''
  },
  
  // Related document if applicable
  documentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Document',
    required: false
  },
  
  // Document type if applicable
  documentType: {
    type: String,
    default: '-'
  },
  
  // IP address of the user
  ipAddress: {
    type: String,
    default: ''
  },
  
  // Additional metadata as JSON
  metadata: {
    type: Object,
    default: {}
  },
  
  // Status of the activity (success, failed, etc.)
  status: {
    type: String,
    enum: ['success', 'failed', 'pending', 'warning'],
    default: 'success'
  }
}, {
  timestamps: true, // Automatically add createdAt and updatedAt fields
  collection: 'activityLogs' // Explicitly set collection name
});

// Create indexes for better query performance
activityLogSchema.index({ userType: 1 });
activityLogSchema.index({ action: 1 });
activityLogSchema.index({ createdAt: -1 }); // For sorting by most recent
activityLogSchema.index({ userId: 1, userModel: 1 });
activityLogSchema.index({ documentId: 1 });

// Add pagination plugin
activityLogSchema.plugin(mongoosePaginate);

const ActivityLog = mongoose.model('ActivityLog', activityLogSchema);

module.exports = ActivityLog;