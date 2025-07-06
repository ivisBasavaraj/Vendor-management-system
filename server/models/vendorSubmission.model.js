const mongoose = require('mongoose');

const VendorSubmissionSchema = new mongoose.Schema({
  vendor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Vendor reference is required']
  },
  submissionTitle: {
    type: String,
    required: [true, 'Submission title is required'],
    trim: true,
    maxlength: [200, 'Title cannot be more than 200 characters']
  },
  description: {
    type: String,
    trim: true
  },
  documents: [{
    document: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Document',
      required: true
    },
    documentName: {
      type: String,
      required: true
    },
    status: {
      type: String,
      enum: ['pending', 'consultant_approved', 'consultant_rejected', 'cross_verified', 'cross_flagged', 'final_approved', 'final_rejected'],
      default: 'pending'
    },
    consultantReview: {
      reviewer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      status: {
        type: String,
        enum: ['pending', 'approved', 'rejected', 'requires_changes']
      },
      comments: String,
      reviewDate: Date
    },
    crossVerification: {
      verifier: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      status: {
        type: String,
        enum: ['pending', 'approved', 'rejected', 'flagged_for_modification']
      },
      remarks: String,
      verificationDate: Date
    },
    finalApproval: {
      approver: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      status: {
        type: String,
        enum: ['pending', 'approved', 'rejected']
      },
      comments: String,
      approvalDate: Date
    }
  }],
  overallStatus: {
    type: String,
    enum: ['pending', 'in_progress', 'partially_approved', 'fully_approved', 'rejected', 'requires_resubmission'],
    default: 'pending'
  },
  currentStage: {
    type: String,
    enum: ['submission', 'consultant_review', 'cross_verification', 'final_approval', 'completed'],
    default: 'submission'
  },
  submissionDate: {
    type: Date,
    default: Date.now
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  },
  resubmissionCount: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  // Tracking for automated features
  remindersSent: {
    type: Number,
    default: 0
  },
  lastReminderDate: Date,
  // MIS reporting fields
  processingStartDate: Date,
  expectedCompletionDate: Date,
  actualCompletionDate: Date,
  totalProcessingTime: Number, // in days
  // Email notifications tracking
  emailNotifications: [{
    type: {
      type: String,
      enum: ['submission_confirmation', 'consultant_assignment', 'approval_report', 'reminder', 'status_update']
    },
    sentTo: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }],
    sentDate: {
      type: Date,
      default: Date.now
    },
    subject: String,
    content: String
  }]
}, {
  timestamps: true
});

// Middleware to update lastUpdated on save
VendorSubmissionSchema.pre('save', function(next) {
  this.lastUpdated = new Date();
  next();
});

// Method to calculate overall status based on document statuses
VendorSubmissionSchema.methods.calculateOverallStatus = function() {
  const documentStatuses = this.documents.map(doc => doc.status);
  
  if (documentStatuses.every(status => status === 'final_approved')) {
    this.overallStatus = 'fully_approved';
    this.currentStage = 'completed';
    this.actualCompletionDate = new Date();
  } else if (documentStatuses.some(status => status === 'final_rejected' || status === 'consultant_rejected')) {
    this.overallStatus = 'rejected';
  } else if (documentStatuses.some(status => status === 'cross_flagged')) {
    this.overallStatus = 'requires_resubmission';
  } else if (documentStatuses.some(status => status === 'final_approved')) {
    this.overallStatus = 'partially_approved';
  } else if (documentStatuses.some(status => status === 'cross_verified')) {
    this.currentStage = 'final_approval';
    this.overallStatus = 'in_progress';
  } else if (documentStatuses.some(status => status === 'consultant_approved')) {
    this.currentStage = 'cross_verification';
    this.overallStatus = 'in_progress';
  } else {
    this.overallStatus = 'pending';
    this.currentStage = 'consultant_review';
  }
  
  // Calculate processing time if completed
  if (this.actualCompletionDate && this.submissionDate) {
    this.totalProcessingTime = Math.ceil((this.actualCompletionDate - this.submissionDate) / (1000 * 60 * 60 * 24));
  }
};

// Method to check if submission needs reminder
VendorSubmissionSchema.methods.needsReminder = function() {
  const daysSinceLastUpdate = Math.ceil((new Date() - this.lastUpdated) / (1000 * 60 * 60 * 24));
  const daysSinceLastReminder = this.lastReminderDate ? 
    Math.ceil((new Date() - this.lastReminderDate) / (1000 * 60 * 60 * 24)) : 
    Infinity;
  
  // Send reminder if no update for 7 days and no reminder sent in last 30 days
  return daysSinceLastUpdate >= 7 && daysSinceLastReminder >= 30 && 
         !['fully_approved', 'rejected', 'completed'].includes(this.overallStatus);
};

module.exports = mongoose.model('VendorSubmission', VendorSubmissionSchema);