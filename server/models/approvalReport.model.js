const mongoose = require('mongoose');

const ApprovalReportSchema = new mongoose.Schema({
  reportId: {
    type: String,
    unique: true,
    required: true
  },
  generatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  reportType: {
    type: String,
    enum: ['daily', 'weekly', 'monthly', 'custom', 'vendor_specific'],
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
  // Summary statistics
  summary: {
    totalSubmissions: {
      type: Number,
      default: 0
    },
    pendingSubmissions: {
      type: Number,
      default: 0
    },
    approvedSubmissions: {
      type: Number,
      default: 0
    },
    rejectedSubmissions: {
      type: Number,
      default: 0
    },
    inProgressSubmissions: {
      type: Number,
      default: 0
    },
    averageProcessingTime: {
      type: Number,
      default: 0
    },
    totalDocuments: {
      type: Number,
      default: 0
    },
    documentsAtConsultantStage: {
      type: Number,
      default: 0
    },
    documentsAtCrossVerificationStage: {
      type: Number,
      default: 0
    },
    documentsAtFinalApprovalStage: {
      type: Number,
      default: 0
    }
  },
  // Detailed vendor data
  vendorData: [{
    vendor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    vendorName: String,
    companyName: String,
    submissions: [{
      submission: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'VendorSubmission'
      },
      submissionTitle: String,
      status: String,
      submissionDate: Date,
      documentsCount: Number,
      approvedDocuments: Number,
      rejectedDocuments: Number,
      pendingDocuments: Number,
      processingTime: Number,
      consultantNotes: [String],
      crossVerificationRemarks: [String]
    }]
  }],
  // Document samples for shared reference
  documentSamples: [{
    documentType: String,
    sampleDocuments: [{
      documentName: String,
      vendor: String,
      status: String,
      consultantComments: String,
      crossVerificationRemarks: String,
      fileUrl: String
    }]
  }],
  // Email distribution list
  emailDistribution: {
    organizers: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }],
    consultants: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }],
    approvers: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }],
    sentDate: Date,
    emailStatus: {
      type: String,
      enum: ['pending', 'sent', 'failed'],
      default: 'pending'
    }
  },
  // Report generation metadata
  generationDate: {
    type: Date,
    default: Date.now
  },
  reportFormat: {
    type: String,
    enum: ['pdf', 'excel', 'json'],
    default: 'pdf'
  },
  fileUrl: String, // Path to generated report file
  isArchived: {
    type: Boolean,
    default: false
  },
  // Automated report settings
  isAutomated: {
    type: Boolean,
    default: false
  },
  automationSchedule: {
    frequency: {
      type: String,
      enum: ['daily', 'weekly', 'monthly']
    },
    dayOfWeek: Number, // For weekly reports (0-6)
    dayOfMonth: Number, // For monthly reports (1-31)
    time: String // HH:MM format
  }
}, {
  timestamps: true
});

// Generate unique report ID
ApprovalReportSchema.pre('save', function(next) {
  if (!this.reportId) {
    const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const random = Math.random().toString(36).substr(2, 6).toUpperCase();
    this.reportId = `RPT-${date}-${random}`;
  }
  next();
});

// Method to calculate summary statistics
ApprovalReportSchema.methods.calculateSummary = async function() {
  const VendorSubmission = require('./vendorSubmission.model');
  
  const submissions = await VendorSubmission.find({
    submissionDate: {
      $gte: this.reportPeriod.startDate,
      $lte: this.reportPeriod.endDate
    }
  });

  this.summary.totalSubmissions = submissions.length;
  this.summary.pendingSubmissions = submissions.filter(s => s.overallStatus === 'pending').length;
  this.summary.approvedSubmissions = submissions.filter(s => s.overallStatus === 'fully_approved').length;
  this.summary.rejectedSubmissions = submissions.filter(s => s.overallStatus === 'rejected').length;
  this.summary.inProgressSubmissions = submissions.filter(s => s.overallStatus === 'in_progress').length;

  // Calculate average processing time
  const completedSubmissions = submissions.filter(s => s.totalProcessingTime > 0);
  if (completedSubmissions.length > 0) {
    this.summary.averageProcessingTime = completedSubmissions.reduce((sum, s) => sum + s.totalProcessingTime, 0) / completedSubmissions.length;
  }

  // Count documents by stage
  let totalDocs = 0;
  let consultantStage = 0;
  let crossVerificationStage = 0;
  let finalApprovalStage = 0;

  submissions.forEach(submission => {
    totalDocs += submission.documents.length;
    submission.documents.forEach(doc => {
      if (doc.status === 'pending') consultantStage++;
      else if (doc.status === 'consultant_approved') crossVerificationStage++;
      else if (doc.status === 'cross_verified') finalApprovalStage++;
    });
  });

  this.summary.totalDocuments = totalDocs;
  this.summary.documentsAtConsultantStage = consultantStage;
  this.summary.documentsAtCrossVerificationStage = crossVerificationStage;
  this.summary.documentsAtFinalApprovalStage = finalApprovalStage;
};

module.exports = mongoose.model('ApprovalReport', ApprovalReportSchema);