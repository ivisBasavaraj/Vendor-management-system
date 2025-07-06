const mongoose = require('mongoose');

const FileSchema = new mongoose.Schema({
  path: {
    type: String,
    required: true
  },
  originalName: {
    type: String,
    required: true
  },
  mimeType: {
    type: String,
    required: true
  },
  size: {
    type: Number,
    required: true
  }
});

const DocumentSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please provide a document title'],
    trim: true,
    maxlength: [100, 'Title cannot be more than 100 characters']
  },
  description: {
    type: String,
    trim: true
  },
  // Support for legacy single file upload
  fileUrl: {
    type: String
  },
  fileName: {
    type: String
  },
  fileType: {
    type: String
  },
  fileSize: {
    type: Number
  },
  // Support for multiple files
  files: [FileSchema],
  // Additional metadata for documents
  metadata: {
    invoiceNumber: {
      type: String,
      trim: true
    },
    agreementPeriod: {
      type: String,
      trim: true
    },
    consultant: {
      type: String,
      trim: true
    },
    workLocation: {
      type: String,
      trim: true
    }
  },
  vendor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Vendor reference is required']
  },
  vendorName: {
    type: String,
    trim: true
  },
  companyName: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    enum: [
      'pending', 
      'under_review', 
      'approved', 
      'rejected',
      'consultant_approved',
      'consultant_rejected', 
      'final_approved',
      'final_rejected'
    ],
    default: 'pending'
  },
  reviewer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  reviewNotes: {
    type: String,
    trim: true
  },
  reviewDate: {
    type: Date
  },
  submissionDate: {
    type: Date,
    default: Date.now
  },
  documentType: {
    type: String,
    enum: ['registration', 'compliance', 'financial', 'technical', 'other'],
    required: [true, 'Document type is required']
  },
  expiryDate: {
    type: Date
  },
  version: {
    type: Number,
    default: 1
  },
  revisionHistory: [{
    version: Number,
    files: [FileSchema],
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    updatedAt: {
      type: Date,
      default: Date.now
    },
    notes: String
  }],
  tags: [String],
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Middleware to ensure either fileUrl or files is provided
DocumentSchema.pre('save', function(next) {
  if (!this.fileUrl && (!this.files || this.files.length === 0)) {
    const err = new Error('Document must have at least one file');
    return next(err);
  }
  
  // Ensure metadata is an object
  if (!this.metadata) {
    this.metadata = {};
  }
  
  next();
});

module.exports = mongoose.model('Document', DocumentSchema);