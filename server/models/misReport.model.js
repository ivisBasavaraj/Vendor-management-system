const mongoose = require('mongoose');

const MISReportSchema = new mongoose.Schema({
  reportId: {
    type: String,
    unique: true,
    required: true
  },
  reportType: {
    type: String,
    enum: ['processing_status', 'performance_metrics', 'vendor_analytics', 'consultant_workload', 'system_usage'],
    required: true
  },
  generatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  reportPeriod: {
    startDate: {
      type: Date,
      required: true
    },
    endDate: {
      type: Date,
      required: true
    }
  },
  // Current processing status
  processingStatus: {
    documentsInProcess: [{
      document: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Document'
      },
      vendor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      vendorName: String,
      documentName: String,
      currentStage: String,
      stageStartDate: Date,
      daysInCurrentStage: Number,
      assignedTo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      priority: {
        type: String,
        enum: ['low', 'medium', 'high', 'urgent'],
        default: 'medium'
      },
      expectedCompletionDate: Date,
      isOverdue: {
        type: Boolean,
        default: false
      }
    }],
    stageWiseCount: {
      consultantReview: Number,
      crossVerification: Number,
      finalApproval: Number
    },
    overdueDocuments: Number,
    urgentDocuments: Number
  },
  // Performance metrics
  performanceMetrics: {
    averageProcessingTime: {
      overall: Number,
      consultantStage: Number,
      crossVerificationStage: Number,
      finalApprovalStage: Number
    },
    completionRates: {
      daily: Number,
      weekly: Number,
      monthly: Number
    },
    rejectionRates: {
      consultantStage: Number,
      crossVerificationStage: Number,
      finalApprovalStage: Number
    },
    resubmissionRates: Number,
    vendorResponseTime: Number // Average time for vendors to resubmit
  },
  // Vendor analytics
  vendorAnalytics: [{
    vendor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    vendorName: String,
    companyName: String,
    totalSubmissions: Number,
    approvedSubmissions: Number,
    rejectedSubmissions: Number,
    pendingSubmissions: Number,
    averageProcessingTime: Number,
    complianceScore: Number, // Percentage of approved documents
    lastSubmissionDate: Date,
    isActiveVendor: Boolean,
    documentTypes: [String], // Types of documents submitted
    frequentIssues: [String] // Common rejection reasons
  }],
  // Consultant workload
  consultantWorkload: [{
    consultant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    consultantName: String,
    assignedDocuments: Number,
    completedReviews: Number,
    pendingReviews: Number,
    averageReviewTime: Number,
    approvalRate: Number,
    rejectionRate: Number,
    workloadStatus: {
      type: String,
      enum: ['underloaded', 'optimal', 'overloaded'],
      default: 'optimal'
    },
    lastActivityDate: Date
  }],
  // System usage statistics
  systemUsage: {
    totalUsers: Number,
    activeUsers: Number,
    loginFrequency: {
      vendors: Number,
      consultants: Number,
      approvers: Number,
      admins: Number
    },
    documentUploadTrends: [{
      date: Date,
      count: Number
    }],
    peakUsageHours: [Number], // Hours of day with highest activity
    systemAlerts: [{
      type: String,
      message: String,
      severity: {
        type: String,
        enum: ['low', 'medium', 'high', 'critical']
      },
      timestamp: Date
    }]
  },
  // Automated alerts and recommendations
  alerts: [{
    type: {
      type: String,
      enum: ['overdue_document', 'consultant_overload', 'vendor_inactive', 'system_bottleneck', 'compliance_issue']
    },
    severity: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical']
    },
    message: String,
    affectedEntities: [{
      entityType: String, // 'vendor', 'consultant', 'document'
      entityId: mongoose.Schema.Types.ObjectId,
      entityName: String
    }],
    recommendedAction: String,
    isResolved: {
      type: Boolean,
      default: false
    },
    resolvedDate: Date,
    resolvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }],
  // Report metadata
  generationDate: {
    type: Date,
    default: Date.now
  },
  reportFormat: {
    type: String,
    enum: ['pdf', 'excel', 'json', 'dashboard'],
    default: 'dashboard'
  },
  fileUrl: String,
  isScheduled: {
    type: Boolean,
    default: false
  },
  scheduleConfig: {
    frequency: {
      type: String,
      enum: ['daily', 'weekly', 'monthly']
    },
    recipients: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }],
    nextGenerationDate: Date
  }
}, {
  timestamps: true
});

// Generate unique report ID
MISReportSchema.pre('save', function(next) {
  if (!this.reportId) {
    const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const random = Math.random().toString(36).substr(2, 6).toUpperCase();
    this.reportId = `MIS-${date}-${random}`;
  }
  next();
});

// Method to generate processing status data
MISReportSchema.methods.generateProcessingStatus = async function() {
  const VendorSubmission = require('./vendorSubmission.model');
  const Document = require('./document.model');
  
  // Get all documents currently in process
  const submissions = await VendorSubmission.find({
    overallStatus: { $in: ['pending', 'in_progress'] }
  }).populate('vendor documents.document');

  const documentsInProcess = [];
  let consultantReview = 0;
  let crossVerification = 0;
  let finalApproval = 0;
  let overdueCount = 0;
  let urgentCount = 0;

  submissions.forEach(submission => {
    submission.documents.forEach(docRef => {
      const currentDate = new Date();
      const stageStartDate = docRef.consultantReview?.reviewDate || 
                           docRef.crossVerification?.verificationDate || 
                           submission.submissionDate;
      
      const daysInStage = Math.ceil((currentDate - stageStartDate) / (1000 * 60 * 60 * 24));
      const isOverdue = daysInStage > 7; // Consider overdue after 7 days
      const isUrgent = daysInStage > 14; // Consider urgent after 14 days

      if (isOverdue) overdueCount++;
      if (isUrgent) urgentCount++;

      // Count by stage
      if (docRef.status === 'pending') consultantReview++;
      else if (docRef.status === 'consultant_approved') crossVerification++;
      else if (docRef.status === 'cross_verified') finalApproval++;

      documentsInProcess.push({
        document: docRef.document._id,
        vendor: submission.vendor._id,
        vendorName: submission.vendor.name,
        documentName: docRef.documentName,
        currentStage: this.getCurrentStageFromStatus(docRef.status),
        stageStartDate: stageStartDate,
        daysInCurrentStage: daysInStage,
        assignedTo: docRef.consultantReview?.reviewer || docRef.crossVerification?.verifier,
        priority: isUrgent ? 'urgent' : isOverdue ? 'high' : 'medium',
        isOverdue: isOverdue
      });
    });
  });

  this.processingStatus = {
    documentsInProcess,
    stageWiseCount: {
      consultantReview,
      crossVerification,
      finalApproval
    },
    overdueDocuments: overdueCount,
    urgentDocuments: urgentCount
  };
};

// Helper method to get current stage from status
MISReportSchema.methods.getCurrentStageFromStatus = function(status) {
  const stageMap = {
    'pending': 'consultant_review',
    'consultant_approved': 'cross_verification',
    'cross_verified': 'final_approval',
    'consultant_rejected': 'consultant_review',
    'cross_flagged': 'cross_verification'
  };
  return stageMap[status] || 'unknown';
};

// Method to generate performance metrics
MISReportSchema.methods.generatePerformanceMetrics = async function() {
  const VendorSubmission = require('./vendorSubmission.model');
  
  const completedSubmissions = await VendorSubmission.find({
    overallStatus: 'fully_approved',
    actualCompletionDate: {
      $gte: this.reportPeriod.startDate,
      $lte: this.reportPeriod.endDate
    }
  });

  // Calculate average processing times
  let totalProcessingTime = 0;
  let consultantStageTime = 0;
  let crossVerificationStageTime = 0;
  let finalApprovalStageTime = 0;

  completedSubmissions.forEach(submission => {
    if (submission.totalProcessingTime) {
      totalProcessingTime += submission.totalProcessingTime;
    }
    // Additional stage-wise time calculations would go here
  });

  this.performanceMetrics = {
    averageProcessingTime: {
      overall: completedSubmissions.length > 0 ? totalProcessingTime / completedSubmissions.length : 0,
      consultantStage: 0, // To be calculated based on stage timestamps
      crossVerificationStage: 0,
      finalApprovalStage: 0
    },
    completionRates: {
      daily: 0, // To be calculated
      weekly: 0,
      monthly: 0
    },
    rejectionRates: {
      consultantStage: 0, // To be calculated
      crossVerificationStage: 0,
      finalApprovalStage: 0
    },
    resubmissionRates: 0,
    vendorResponseTime: 0
  };
};

module.exports = mongoose.model('MISReport', MISReportSchema);