const mongoose = require('mongoose');

const complianceReportSchema = new mongoose.Schema({
  vendorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  month: {
    type: String,
    required: true,
    enum: ['January', 'February', 'March', 'April', 'May', 'June', 
           'July', 'August', 'September', 'October', 'November', 'December']
  },
  year: {
    type: Number,
    required: true
  },
  auditReview: {
    type: String,
    required: true
  },
  remarks: {
    type: String,
    default: ''
  },
  auditorName: {
    type: String,
    required: true
  },
  auditorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['draft', 'completed', 'archived'],
    default: 'completed'
  },
  documentHistory: [{
    documentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Document'
    },
    documentName: String,
    documentType: String,
    status: String,
    submissionDate: Date,
    reviewDate: Date,
    reviewNotes: String
  }],
  auditTrail: [{
    action: String,
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    performedByName: String,
    timestamp: {
      type: Date,
      default: Date.now
    },
    details: String
  }],
  attachments: [{
    fileName: String,
    filePath: String,
    fileSize: Number,
    fileType: String, // "Completion Report" or "Document Verification Report"
    uploadDate: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true
});

// Index for efficient queries
complianceReportSchema.index({ vendorId: 1, year: -1, month: 1 });
complianceReportSchema.index({ auditorId: 1, createdAt: -1 });

module.exports = mongoose.model('ComplianceReport', complianceReportSchema);