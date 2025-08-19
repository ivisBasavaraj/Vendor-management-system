const mongoose = require('mongoose');

const LoginApprovalSchema = new mongoose.Schema({
  vendor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Vendor is required']
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending',
    required: true
  },
  approver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  approvalDate: Date,
  ipAddress: String,
  userAgent: String,
  deviceInfo: String,
  requestToken: {
    type: String,
    required: true
  },
  tokenExpires: {
    type: Date,
    required: true
  },
  rejectionReason: String,
  assignedConsultant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  notifiedUsers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  expiresAt: {
    type: Date,
    required: true,
    default: function() {
      // Login requests expire after 24 hours by default
      // This is only for the login request token, not the approval itself
      return new Date(Date.now() + 24 * 60 * 60 * 1000);
    }
  }
}, {
  timestamps: true
});

// Add index to improve query performance
LoginApprovalSchema.index({ vendor: 1, status: 1 });
LoginApprovalSchema.index({ requestToken: 1 });
LoginApprovalSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // Auto-delete expired requests

module.exports = mongoose.model('LoginApproval', LoginApprovalSchema); 