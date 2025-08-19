const mongoose = require('mongoose');

// Monthly Mandatory document types - Required every month
const MONTHLY_MANDATORY_DOCUMENTS = [
  'INVOICE',
  'FORM_T_MUSTER_ROLL', 
  'BANK_STATEMENT',
  'ECR',
  'PF_COMBINED_CHALLAN',
  'PF_TRRN_DETAILS',
  'ESI_CONTRIBUTION_HISTORY',
  'ESI_CHALLAN',
  'PROFESSIONAL_TAX_RETURNS'
];

// Annual Mandatory document type - Required only in January
const ANNUAL_MANDATORY_DOCUMENTS = [
  'LABOUR_WELFARE_FUND'
];

// One-Time Optional document types - Upload once, not mandatory
const ONE_TIME_OPTIONAL_DOCUMENTS = [
  'VENDOR_AGREEMENT',
  'EPF_CODE_LETTER',
  'EPF_FORM_5A',
  'ESIC_REGISTRATION',
  'PT_REGISTRATION',
  'PT_ENROLLMENT',
  'CONTRACT_LABOUR_LICENSE'
];

// Legacy alias for backward compatibility
const OPTIONAL_DOCUMENTS = ONE_TIME_OPTIONAL_DOCUMENTS;

// All mandatory document types (combined)
const MANDATORY_DOCUMENTS = [...MONTHLY_MANDATORY_DOCUMENTS, ...ANNUAL_MANDATORY_DOCUMENTS];

const DocumentSubmissionSchema = new mongoose.Schema({
  // Basic submission details
  submissionId: {
    type: String,
    unique: true,
    required: true
  },
  vendor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Upload period details
  uploadPeriod: {
    year: {
      type: Number,
      required: true,
      min: 2023,
      max: 2035
    },
    month: {
      type: String,
      required: true,
      enum: ['Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar']
    }
  },
  
  // Agreement period (fixed)
  agreementPeriod: {
    startDate: {
      type: Date,
      default: new Date('2024-04-01'),
      required: true
    },
    endDate: {
      type: Date,
      default: new Date('2025-03-31'),
      required: true
    }
  },
  
  // Consultant details
  consultant: {
    name: {
      type: String,
      required: true
    },
    email: {
      type: String,
      required: true
    }
  },
  
  // Work location
  workLocation: {
    type: String,
    default: 'IMTMA, Bengaluru',
    required: true
  },
  
  // Invoice details
  invoiceNo: {
    type: String,
    required: true
  },
  
  // Document uploads
  documents: [{
    documentType: {
      type: String,
      required: true,
      validate: {
        validator: function(v) {
          // Allow all defined document types plus any additional ones with proper format
          const validTypes = [
            ...MONTHLY_MANDATORY_DOCUMENTS,
            ...ANNUAL_MANDATORY_DOCUMENTS,
            ...OPTIONAL_DOCUMENTS,
            'ADDITIONAL_DOCUMENT'
          ];
          
          // Check if it's a valid type or follows proper naming convention
          return validTypes.includes(v) || /^[A-Z_]+$/.test(v);
        },
        message: props => `${props.value} is not a valid document type!`
      }
    },
    documentName: {
      type: String,
      required: true
    },
    fileName: {
      type: String,
      required: true
    },
    filePath: {
      type: String,
      required: true
    },
    fileSize: {
      type: Number,
      required: true,
      max: 5 * 1024 * 1024 // 5MB limit
    },
    fileType: {
      type: String,
      required: true,
      enum: ['pdf', 'excel', 'word', 'png', 'jpeg', 'jpg', 'xlsx', 'docx']
    },
    uploadDate: {
      type: Date,
      default: Date.now
    },
    isMandatory: {
      type: Boolean,
      default: function() {
        // Check if it's a monthly mandatory document
        if (MONTHLY_MANDATORY_DOCUMENTS.includes(this.documentType)) {
          return true;
        }
        
        // Check if it's an annual document and submission is for January
        if (ANNUAL_MANDATORY_DOCUMENTS.includes(this.documentType)) {
          // Get the submission month from the parent document
          const parent = this.parent();
          if (parent && parent.uploadPeriod && parent.uploadPeriod.month === 'Jan') {
            return true;
          }
        }
        
        // One-time optional documents are never mandatory
        if (ONE_TIME_OPTIONAL_DOCUMENTS.includes(this.documentType)) {
          return false;
        }
        
        // Default to false for unknown document types
        return false;
      }
    },
    // Document status and review
    status: {
      type: String,
      enum: ['uploaded', 'under_review', 'approved', 'rejected', 'resubmitted'],
      default: 'uploaded'
    },
    consultantRemarks: {
      type: String
    },
    reviewDate: {
      type: Date
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }],
  
  // Overall submission status
  submissionStatus: {
    type: String,
    enum: ['draft', 'submitted', 'under_review', 'partially_approved', 'fully_approved', 'rejected', 'requires_resubmission'],
    default: 'draft'
  },
  
  // Submission tracking
  submissionDate: {
    type: Date
  },
  lastModifiedDate: {
    type: Date,
    default: Date.now
  },
  
  // Approval workflow
  consultantApproval: {
    isApproved: {
      type: Boolean,
      default: false
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    approvalDate: {
      type: Date
    },
    remarks: {
      type: String
    }
  },
  
  // Final approval and verification
  finalApproval: {
    isApproved: {
      type: Boolean,
      default: false
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    approvalDate: {
      type: Date
    },
    verificationDocumentPath: {
      type: String
    }
  },
  
  // Email notifications tracking
  emailNotifications: [{
    type: {
      type: String,
      enum: ['submission_confirmation', 'document_rejected', 'final_approval', 'verification_document']
    },
    sentTo: [{
      email: String,
      role: String
    }],
    sentDate: {
      type: Date,
      default: Date.now
    },
    status: {
      type: String,
      enum: ['sent', 'failed'],
      default: 'sent'
    }
  }],
  
  // Rejection tracking
  rejectedDocuments: [{
    documentType: String,
    rejectionReason: String,
    rejectedDate: Date,
    rejectedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    isResubmitted: {
      type: Boolean,
      default: false
    },
    resubmissionDate: Date
  }],
  
  // Consultant upload tracking
  uploadedByConsultant: {
    type: Boolean,
    default: false
  },
  uploadedBy: {
    id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    name: String,
    role: String
  }
}, {
  timestamps: true
});

// Generate unique submission ID
DocumentSubmissionSchema.pre('save', function(next) {
  if (!this.submissionId) {
    const year = this.uploadPeriod.year;
    const month = this.uploadPeriod.month;
    const random = Math.random().toString(36).substr(2, 6).toUpperCase();
    this.submissionId = `SUB-${year}-${month}-${random}`;
  }
  next();
});

// Method to check if all mandatory documents are uploaded
DocumentSubmissionSchema.methods.checkMandatoryDocuments = function() {
  const uploadedTypes = this.documents.map(doc => doc.documentType);
  
  // Determine which documents are mandatory based on the submission month
  let requiredDocuments = [...MONTHLY_MANDATORY_DOCUMENTS];
  
  // If the submission is for January, include annual documents
  const submissionMonth = this.uploadPeriod.month;
  if (submissionMonth === 'Jan') {
    requiredDocuments = [...requiredDocuments, ...ANNUAL_MANDATORY_DOCUMENTS];
  }
  
  const missingMandatory = requiredDocuments.filter(
    type => !uploadedTypes.includes(type)
  );
  
  return {
    allUploaded: missingMandatory.length === 0,
    missing: missingMandatory,
    required: requiredDocuments
  };
};

// Method to check if submission can be submitted
DocumentSubmissionSchema.methods.canSubmit = function() {
  const mandatoryCheck = this.checkMandatoryDocuments();
  return mandatoryCheck.allUploaded && this.invoiceNo && this.consultant.name && this.consultant.email;
};

// Method to get rejected documents
DocumentSubmissionSchema.methods.getRejectedDocuments = function() {
  return this.documents.filter(doc => doc.status === 'rejected');
};

// Method to check if all documents are approved
DocumentSubmissionSchema.methods.allDocumentsApproved = function() {
  const mandatoryDocs = this.documents.filter(doc => doc.isMandatory);
  return mandatoryDocs.every(doc => doc.status === 'approved');
};

// Method to update submission status based on document statuses
DocumentSubmissionSchema.methods.updateSubmissionStatus = function() {
  const documents = this.documents;
  const mandatoryDocs = documents.filter(doc => doc.isMandatory);
  
  if (mandatoryDocs.length === 0) {
    this.submissionStatus = 'draft';
    return;
  }
  
  const approvedCount = mandatoryDocs.filter(doc => doc.status === 'approved').length;
  const rejectedCount = mandatoryDocs.filter(doc => doc.status === 'rejected').length;
  const underReviewCount = mandatoryDocs.filter(doc => doc.status === 'under_review').length;
  
  if (approvedCount === mandatoryDocs.length) {
    this.submissionStatus = 'fully_approved';
  } else if (rejectedCount > 0) {
    this.submissionStatus = 'requires_resubmission';
  } else if (underReviewCount > 0) {
    this.submissionStatus = 'under_review';
  } else if (approvedCount > 0) {
    this.submissionStatus = 'partially_approved';
  } else {
    this.submissionStatus = 'submitted';
  }
};

// Static method to get submissions by period
DocumentSubmissionSchema.statics.getByPeriod = function(year, month, vendorId = null) {
  let query = {
    'uploadPeriod.year': year,
    'uploadPeriod.month': month
  };
  
  if (vendorId) {
    query.vendor = vendorId;
  }
  
  return this.find(query)
    .populate('vendor', 'name email company phone address')
    .populate('documents.reviewedBy', 'name email')
    .populate('consultantApproval.approvedBy', 'name email')
    .populate('finalApproval.approvedBy', 'name email')
    .sort({ submissionDate: -1 });
};

// Static method to get consultant's assigned submissions
DocumentSubmissionSchema.statics.getConsultantSubmissions = function(consultantEmail, year = null, month = null) {
  let query = {
    'consultant.email': consultantEmail
  };
  
  if (year && month) {
    query['uploadPeriod.year'] = year;
    query['uploadPeriod.month'] = month;
  }
  
  return this.find(query)
    .populate('vendor', 'name email company phone')
    .sort({ submissionDate: -1 });
};

// Static method to get MIS data for IMTMA
DocumentSubmissionSchema.statics.getMISData = function(year, month) {
  return this.aggregate([
    {
      $match: {
        'uploadPeriod.year': year,
        'uploadPeriod.month': month
      }
    },
    {
      $group: {
        _id: '$submissionStatus',
        count: { $sum: 1 },
        vendors: { $push: '$vendor' }
      }
    }
  ]);
};

// Static method to get available document types for a given month
DocumentSubmissionSchema.statics.getAvailableDocumentTypes = function(month) {
  const documentTypes = {
    monthly_mandatory: MONTHLY_MANDATORY_DOCUMENTS,
    annual_mandatory: month === 'Jan' ? ANNUAL_MANDATORY_DOCUMENTS : [],
    one_time_optional: ONE_TIME_OPTIONAL_DOCUMENTS
  };
  
  return documentTypes;
};

// Static method to check if a document type is mandatory for a given month
DocumentSubmissionSchema.statics.isDocumentMandatory = function(documentType, month) {
  if (MONTHLY_MANDATORY_DOCUMENTS.includes(documentType)) {
    return true;
  }
  
  if (ANNUAL_MANDATORY_DOCUMENTS.includes(documentType) && month === 'Jan') {
    return true;
  }
  
  return false;
};

// Static method to check if a document type is one-time optional
DocumentSubmissionSchema.statics.isOneTimeOptional = function(documentType) {
  return ONE_TIME_OPTIONAL_DOCUMENTS.includes(documentType);
};

const DocumentSubmission = mongoose.model('DocumentSubmission', DocumentSubmissionSchema);

// Export the model and document type constants
module.exports = DocumentSubmission;
module.exports.MONTHLY_MANDATORY_DOCUMENTS = MONTHLY_MANDATORY_DOCUMENTS;
module.exports.ANNUAL_MANDATORY_DOCUMENTS = ANNUAL_MANDATORY_DOCUMENTS;
module.exports.ONE_TIME_OPTIONAL_DOCUMENTS = ONE_TIME_OPTIONAL_DOCUMENTS;
module.exports.OPTIONAL_DOCUMENTS = OPTIONAL_DOCUMENTS;