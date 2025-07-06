const mongoose = require('mongoose');

const WorkflowSchema = new mongoose.Schema({
  document: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Document',
    required: [true, 'Document reference is required']
  },
  vendor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Vendor reference is required']
  },
  stages: [{
    name: {
      type: String,
      required: true,
      enum: ['submission', 'consultant_review', 'cross_verification', 'final_approval']
    },
    status: {
      type: String,
      enum: ['pending', 'in_progress', 'completed', 'rejected', 'requires_changes'],
      default: 'pending'
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    startDate: Date,
    completionDate: Date,
    comments: String,
    remarks: String, // For cross-verification stage
    actionTaken: {
      type: String,
      enum: ['approved', 'rejected', 'flagged_for_modification']
    },
    attachments: [{
      url: String,
      fileName: String,
      uploadedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      uploadedAt: {
        type: Date,
        default: Date.now
      }
    }]
  }],
  currentStage: {
    type: String,
    enum: ['submission', 'consultant_review', 'cross_verification', 'final_approval', 'completed', 'rejected'],
    default: 'submission'
  },
  isCompleted: {
    type: Boolean,
    default: false
  },
  completedAt: Date,
  notes: String,
  // Track resubmissions
  resubmissionCount: {
    type: Number,
    default: 0
  },
  originalSubmissionDate: {
    type: Date,
    default: Date.now
  },
  // Final approval tracking
  finalApprovalStatus: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  finalApprovalDate: Date,
  finalApprovalBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Workflow', WorkflowSchema); 