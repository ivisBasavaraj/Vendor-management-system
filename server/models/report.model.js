const mongoose = require('mongoose');

const ReportSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Report name is required'],
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  type: {
    type: String,
    enum: [
      'vendor_performance', 
      'document_status', 
      'workflow_analytics', 
      'user_activity',
      'custom'
    ],
    required: [true, 'Report type is required']
  },
  parameters: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Report creator is required']
  },
  schedule: {
    isScheduled: {
      type: Boolean,
      default: false
    },
    frequency: {
      type: String,
      enum: ['daily', 'weekly', 'monthly', 'quarterly', 'yearly'],
    },
    lastRun: Date,
    nextRun: Date,
    recipients: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }]
  },
  filters: {
    dateRange: {
      startDate: Date,
      endDate: Date
    },
    vendors: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }],
    documentTypes: [String],
    statuses: [String]
  },
  outputs: [{
    format: {
      type: String,
      enum: ['pdf', 'excel', 'csv', 'json'],
      required: true
    },
    fileUrl: String,
    generatedAt: Date,
    expiresAt: Date
  }],
  isPublic: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Report', ReportSchema); 