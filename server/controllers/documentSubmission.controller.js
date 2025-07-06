/**
 * Document Submission Controller
 */
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const DocumentSubmission = require('../models/documentSubmission.model');
const User = require('../models/user.model');
const Notification = require('../models/notification.model');
const socketService = require('../utils/socketService');

// Helper function to convert document types to uppercase format
const convertDocumentType = (frontendType) => {
  // Convert frontend document types to backend expected format
  const typeMapping = {
    // Monthly Mandatory Documents
    'invoice': 'INVOICE',
    'form_t_muster_roll': 'FORM_T_MUSTER_ROLL',
    'bank_statement': 'BANK_STATEMENT',
    'ecr': 'ECR',
    'pf_combined_challan': 'PF_COMBINED_CHALLAN',
    'pf_trrn_details': 'PF_TRRN_DETAILS',
    'esi_contribution_history': 'ESI_CONTRIBUTION_HISTORY',
    'esi_challan': 'ESI_CHALLAN',
    'professional_tax_returns': 'PROFESSIONAL_TAX_RETURNS',
    
    // Annual Mandatory Document (January only)
    'labour_welfare_fund': 'LABOUR_WELFARE_FUND',
    
    // One-Time Optional Documents
    'vendor_agreement': 'VENDOR_AGREEMENT',
    'epf_code_letter': 'EPF_CODE_LETTER',
    'epf_form_5a': 'EPF_FORM_5A',
    'esic_registration': 'ESIC_REGISTRATION',
    'pt_registration': 'PT_REGISTRATION',
    'pt_enrollment': 'PT_ENROLLMENT',
    'contract_labour_license': 'CONTRACT_LABOUR_LICENSE',
    
    'ADDITIONAL_DOCUMENT': 'ADDITIONAL_DOCUMENT'
  };
  
  return typeMapping[frontendType] || frontendType.toUpperCase();
};

// Monthly Mandatory document types
const MONTHLY_MANDATORY_DOCUMENT_TYPES = [
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

// Annual Mandatory document type (January only)
const ANNUAL_MANDATORY_DOCUMENT_TYPES = [
  'LABOUR_WELFARE_FUND'
];

// One-Time Optional document types
const OPTIONAL_DOCUMENT_TYPES = [
  'VENDOR_AGREEMENT',
  'EPF_CODE_LETTER',
  'EPF_FORM_5A',
  'ESIC_REGISTRATION',
  'PT_REGISTRATION',
  'PT_ENROLLMENT',
  'CONTRACT_LABOUR_LICENSE'
];

// All mandatory document types (combined)
const MANDATORY_DOCUMENT_TYPES = [...MONTHLY_MANDATORY_DOCUMENT_TYPES];

// Function to determine mandatory documents based on month
const getMandatoryDocumentsForMonth = (month) => {
  // Month is 1-12 for Jan-Dec
  const mandatoryDocs = [...MONTHLY_MANDATORY_DOCUMENT_TYPES];
  
  // Add annual document in January
  if (month === 1) { // January
    mandatoryDocs.push(...ANNUAL_MANDATORY_DOCUMENT_TYPES);
  }
  
  return mandatoryDocs;
};

// Set up multer storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Create uploads directory if it doesn't exist
    const uploadDir = path.join(__dirname, '../uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Generate unique filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});

// File filter
const fileFilter = (req, file, cb) => {
  // Accept only pdf, doc, docx, xls, xlsx, jpg, jpeg, png
  const allowedFileTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'image/jpeg',
    'image/png'
  ];

  if (allowedFileTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only PDF, DOC, DOCX, XLS, XLSX, JPG, JPEG, PNG are allowed.'), false);
  }
};

// Set up multer upload
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

// @desc    Create new document submission
// @route   POST /api/document-submissions/create
// @access  Private (Vendor)
exports.createSubmission = async (req, res) => {
  try {
    // Check if user is a vendor
    if (req.user.role !== 'vendor') {
      return res.status(403).json({
        success: false,
        message: 'Only vendors can create document submissions'
      });
    }

    // Find a vendor user (consultant or admin) to assign the submission to
    const consultant = await User.findOne({ role: 'consultant' });

    if (!consultant) {
      return res.status(404).json({
        success: false,
        message: 'No consultant found to assign the submission to'
      });
    }

    // Process upload with multer
    const uploadMiddleware = upload.fields([
      { name: 'invoice', maxCount: 1 },
      { name: 'form_t_muster_roll', maxCount: 1 },
      { name: 'bank_statement', maxCount: 1 },
      { name: 'ecr', maxCount: 1 },
      { name: 'pf_combined_challan', maxCount: 1 },
      { name: 'pf_trrn_details', maxCount: 1 },
      { name: 'esi_contribution_history', maxCount: 1 },
      { name: 'esi_challan', maxCount: 1 },
      { name: 'professional_tax_returns', maxCount: 1 },
      { name: 'labour_welfare_fund', maxCount: 1 },
      { name: 'vendor_agreement', maxCount: 1 },
      { name: 'epf_code_letter', maxCount: 1 },
      { name: 'epf_form_5a', maxCount: 1 },
      { name: 'esic_registration', maxCount: 1 },
      { name: 'pt_registration', maxCount: 1 },
      { name: 'pt_enrollment', maxCount: 1 },
      { name: 'contract_labour_license', maxCount: 1 },
      { name: 'ADDITIONAL_DOCUMENT', maxCount: 5 }
    ]);

    uploadMiddleware(req, res, async (err) => {
      if (err) {
        console.error('Multer error:', err);
        return res.status(400).json({
          success: false,
          message: err.message
        });
      }

      // Log request body and files for debugging
      console.log('Request body:', req.body);
      console.log('Request files:', req.files ? Object.keys(req.files) : 'No files');

      // Extract all fields from request body
      const { year, month, consultantName, consultantEmail, invoiceNo, workLocation } = req.body;

      // Validate required fields
      if (!year || !month) {
        return res.status(400).json({
          success: false,
          message: 'Year and month are required'
        });
      }
      
      if (!consultantName || !consultantEmail) {
        return res.status(400).json({
          success: false,
          message: 'Consultant name and email are required'
        });
      }
      
      if (!invoiceNo) {
        return res.status(400).json({
          success: false,
          message: 'Invoice number is required'
        });
      }

      // Process uploaded files
      const documents = [];
      
      if (req.files) {
        // Process each uploaded file
        Object.keys(req.files).forEach(fieldName => {
          const files = req.files[fieldName];
          
          files.forEach(file => {
            const documentType = convertDocumentType(fieldName);
            const isMandatory = req.body[`${fieldName}_isMandatory`] === 'true';
            
            console.log(`Processing file: ${file.originalname}, type: ${documentType}, mandatory: ${isMandatory}`);
            
            // Get file extension and type
            const fileExtension = path.extname(file.originalname).toLowerCase().substring(1);
            let fileType = fileExtension;
            
            // Map file extensions to standardized types
            const typeMapping = {
              'pdf': 'pdf',
              'doc': 'word',
              'docx': 'word',
              'xls': 'excel',
              'xlsx': 'excel',
              'png': 'png',
              'jpg': 'jpeg',
              'jpeg': 'jpeg'
            };
            
            fileType = typeMapping[fileExtension] || fileExtension;
            
            documents.push({
              documentType: documentType,
              documentName: file.originalname,
              fileName: file.filename,
              filePath: file.path,
              fileSize: file.size,
              fileType: fileType,
              isMandatory: isMandatory,
              status: 'uploaded'
            });
          });
        });
      }

      // Generate unique submission ID
      const random = Math.random().toString(36).substr(2, 6).toUpperCase();
      const submissionId = `SUB-${year}-${month}-${random}`;

      // Create new document submission
      const newSubmission = new DocumentSubmission({
        submissionId: submissionId,
        vendor: req.user.id,
        uploadPeriod: {
          year: parseInt(year),
          month: month
        },
        consultant: {
          name: consultantName,
          email: consultantEmail
        },
        invoiceNo,
        workLocation: workLocation || 'IMTMA, Bengaluru',
        submissionStatus: 'draft',
        documents: documents
      });

      // Save the submission
      await newSubmission.save();

      res.status(201).json({
        success: true,
        message: 'Document submission created successfully',
        data: newSubmission
      });
    });
  } catch (error) {
    console.error('Error creating document submission:', error);
    res.status(500).json({
      success: false,
      message: 'Could not create document submission',
      error: error.message
    });
  }
};

// Import mongoose at the top of the file
const mongoose = require('mongoose');

// @desc    Check if document exists
// @route   GET /api/document-submissions/exists/:id
// @access  Public
exports.checkDocumentExists = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Document ID is required'
      });
    }
    
    console.log(`Checking if document with ID ${id} exists in DocumentSubmission`);
    
    // Check if ID is a valid MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      console.log(`Invalid MongoDB ObjectId: ${id}`);
      return res.status(404).json({
        success: false,
        exists: false,
        message: 'Invalid document ID format'
      });
    }
    
    const DocumentSubmission = require('../models/documentSubmission.model');
    
    // Try to find the document in DocumentSubmission
    let documentExists = false;
    
    // Check if it's a submission
    const submissionExists = await DocumentSubmission.exists({ _id: id });
    if (submissionExists) {
      console.log(`Document found in DocumentSubmission with ID: ${id}`);
      documentExists = true;
    } else {
      // Check if it's a document within a submission
      const submissionWithDoc = await DocumentSubmission.exists({ 'documents._id': id });
      if (submissionWithDoc) {
        console.log(`Document found in DocumentSubmission.documents with ID: ${id}`);
        documentExists = true;
      }
    }
    
    return res.status(documentExists ? 200 : 404).json({
      success: true,
      exists: documentExists,
      message: documentExists ? 'Document exists' : 'Document not found'
    });
  } catch (error) {
    console.error('Error checking document existence:', error);
    return res.status(500).json({
      success: false,
      message: 'Error checking document existence',
      error: error.message
    });
  }
};

// @desc    View file
// @route   GET /api/document-submissions/view
// @access  Public (with validation)
exports.viewFile = async (req, res) => {
  try {
    const { filePath: requestedFilePath } = req.query;
    let resolvedFilePath = requestedFilePath; // Use a different variable that can be modified

    if (!resolvedFilePath) {
      return res.status(400).json({
        success: false,
        message: 'File path is required'
      });
    }

    console.log('Requested file path:', resolvedFilePath);

    // Check if this is a document ID instead of a file path
    if (resolvedFilePath.match(/^[0-9a-fA-F]{24}$/)) {
      console.log('This appears to be a document ID, trying to find the document');
      try {
        // Try to find the document in the database
        const DocumentSubmission = require('../models/documentSubmission.model');
        
        // First try to find a submission with this ID
        let submission = await DocumentSubmission.findById(resolvedFilePath);
        
        if (!submission) {
          // If not found, try to find a submission containing a document with this ID
          submission = await DocumentSubmission.findOne({
            'documents._id': resolvedFilePath
          });
        }
        
        if (submission) {
          console.log('Found submission:', submission._id);
          
          // If this is a document ID, find the document in the submission
          let targetDocument = null;
          
          if (submission._id.toString() === resolvedFilePath) {
            // If the submission ID matches, use the first document
            if (submission.documents && submission.documents.length > 0) {
              targetDocument = submission.documents[0];
              console.log('Using first document in submission:', targetDocument.documentType);
            }
          } else {
            // Find the specific document with this ID
            targetDocument = submission.documents.find(doc => doc._id.toString() === resolvedFilePath);
            console.log('Found specific document:', targetDocument?.documentType);
          }
          
          if (targetDocument && targetDocument.filePath) {
            console.log('Using file path from document:', targetDocument.filePath);
            // Use the file path from the document
            resolvedFilePath = targetDocument.filePath;
          } else if (targetDocument && targetDocument.fileName) {
            // If no filePath but we have fileName, construct a path
            resolvedFilePath = path.join('uploads', 'documents', targetDocument.fileName);
            console.log('Constructed file path from fileName:', resolvedFilePath);
          } else {
            console.log('No valid file path found in document');
          }
        } else {
          console.log('No submission found with this ID');
        }
      } catch (dbError) {
        console.error('Error searching for document in database:', dbError);
      }
    }

    // Handle Windows absolute paths (D:\path\to\file)
    if (resolvedFilePath.match(/^[A-Z]:\\/i)) {
      console.log('Detected Windows absolute path');
      // Extract just the filename from the Windows path
      const fileName = path.basename(resolvedFilePath);
      console.log('Extracted filename from Windows path:', fileName);
      
      // Try to find this file in our uploads directory
      const uploadsDir = path.join(__dirname, '../uploads');
      
      try {
        // Get all files in the uploads directory recursively
        const getAllFiles = (dir, fileList = []) => {
          const files = fs.readdirSync(dir);
          
          files.forEach(file => {
            const filePath = path.join(dir, file);
            if (fs.statSync(filePath).isDirectory()) {
              getAllFiles(filePath, fileList);
            } else {
              fileList.push(filePath);
            }
          });
          
          return fileList;
        };
        
        const allFiles = getAllFiles(uploadsDir);
        
        // Look for files with matching name
        const matchingFiles = allFiles.filter(file => 
          path.basename(file).toLowerCase() === fileName.toLowerCase()
        );
        
        if (matchingFiles.length > 0) {
          // Use the first matching file
          resolvedFilePath = matchingFiles[0];
          console.log('Found matching file for Windows path:', resolvedFilePath);
        } else {
          console.log('No matching files found for Windows path');
        }
      } catch (searchError) {
        console.error('Error searching for Windows path file:', searchError);
      }
    }

    // Normalize the path to prevent directory traversal attacks
    const normalizedPath = path.normalize(resolvedFilePath).replace(/^\/+/, '');
    console.log('Normalized path:', normalizedPath);

    // Extract the filename from the path
    const fileName = path.basename(normalizedPath);
    console.log('Extracted filename:', fileName);

    // Try multiple possible locations for the file
    const possiblePaths = [
      // Original paths
      resolvedFilePath, // Try the exact path first
      path.join(__dirname, '../uploads', normalizedPath),
      path.join(__dirname, '../uploads', normalizedPath.replace(/\\/g, '/')),
      path.join(__dirname, '../', normalizedPath),
      
      // Just the filename in various directories
      path.join(__dirname, '../uploads', fileName),
      path.join(__dirname, '../uploads/documents', fileName),
      path.join(__dirname, '../uploads/files', fileName),
      
      // Try with different parent directories
      path.join(__dirname, '../uploads/documents', normalizedPath),
      path.join(__dirname, '../uploads/files', normalizedPath),
      
      // Try with different casing
      path.join(__dirname, '../uploads', fileName.toLowerCase()),
      path.join(__dirname, '../uploads', fileName.toUpperCase()),
      
      // Try with URL-encoded path
      path.join(__dirname, '../uploads', decodeURIComponent(normalizedPath)),
      
      // Try with common prefixes
      path.join(__dirname, '../uploads/vendor_documents', fileName),
      path.join(__dirname, '../uploads/submissions', fileName)
    ];

    console.log('Trying these file paths:', possiblePaths);

    // Find the first path that exists
    let absolutePath = null;
    for (const testPath of possiblePaths) {
      if (fs.existsSync(testPath)) {
        absolutePath = testPath;
        console.log('Found file at:', absolutePath);
        break;
      }
    }

    // If no file found in any location
    if (!absolutePath) {
      console.log('File not found in any location');
      
      // Try a more exhaustive search in the uploads directory
      console.log('Performing exhaustive search in uploads directory...');
      
      // Get all files in the uploads directory recursively
      const getAllFiles = (dir, fileList = []) => {
        const files = fs.readdirSync(dir);
        
        files.forEach(file => {
          const filePath = path.join(dir, file);
          if (fs.statSync(filePath).isDirectory()) {
            getAllFiles(filePath, fileList);
          } else {
            fileList.push(filePath);
          }
        });
        
        return fileList;
      };
      
      try {
        const uploadsDir = path.join(__dirname, '../uploads');
        const allFiles = getAllFiles(uploadsDir);
        
        // Look for files with matching name
        const matchingFiles = allFiles.filter(file => 
          path.basename(file).toLowerCase() === fileName.toLowerCase()
        );
        
        if (matchingFiles.length > 0) {
          absolutePath = matchingFiles[0];
          console.log('Found file in exhaustive search:', absolutePath);
        } else {
          console.log('No matching files found in exhaustive search');
        }
      } catch (searchError) {
        console.error('Error during exhaustive search:', searchError);
      }
      
      // If still no file found
      if (!absolutePath) {
        return res.status(404).json({
          success: false,
          message: 'File not found'
        });
      }
    }

    // Determine content type based on file extension
    const ext = path.extname(absolutePath).toLowerCase();
    let contentType = 'application/octet-stream';

    switch (ext) {
      case '.pdf':
        contentType = 'application/pdf';
        break;
      case '.doc':
        contentType = 'application/msword';
        break;
      case '.docx':
        contentType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
        break;
      case '.xls':
        contentType = 'application/vnd.ms-excel';
        break;
      case '.xlsx':
        contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
        break;
      case '.jpg':
      case '.jpeg':
        contentType = 'image/jpeg';
        break;
      case '.png':
        contentType = 'image/png';
        break;
    }

    // Set content type and send file
    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'max-age=3600'); // Cache for 1 hour
    console.log('Sending file with content type:', contentType);
    res.sendFile(absolutePath);
  } catch (error) {
    console.error('Error viewing file:', error);
    res.status(500).json({
      success: false,
      message: 'Could not view file',
      error: error.message
    });
  }
};

// @desc    Download file
// @route   GET /api/document-submissions/download
// @access  Public (with validation)
exports.downloadFile = async (req, res) => {
  try {
    const { filePath, fileName } = req.query;

    if (!filePath) {
      return res.status(400).json({
        success: false,
        message: 'File path is required'
      });
    }

    console.log(`Download request for file path: ${filePath}`);

    // Process the file path to handle different formats
    let processedPath = filePath.trim();
    
    // Handle Windows absolute paths (C:\path\to\file or D:\path\to\file)
    if (processedPath.match(/^[A-Z]:[\\\/]/i)) {
      console.log('Detected Windows absolute path, extracting filename');
      // Extract just the filename from the Windows path
      const pathParts = processedPath.split(/[\\\/]/);
      processedPath = pathParts[pathParts.length - 1];
      console.log(`Extracted filename: ${processedPath}`);
    }
    // Handle Unix-style absolute paths
    else if (processedPath.startsWith('/')) {
      console.log('Detected Unix absolute path, extracting filename');
      // Extract just the filename
      const pathParts = processedPath.split('/');
      processedPath = pathParts[pathParts.length - 1];
      console.log(`Extracted filename: ${processedPath}`);
    }

    // Normalize the path to prevent directory traversal attacks
    const normalizedPath = path.normalize(processedPath).replace(/^\/+/, '');
    console.log(`Normalized path: ${normalizedPath}`);

    // Construct the absolute path
    const absolutePath = path.join(__dirname, '../uploads', normalizedPath);
    console.log(`Absolute path: ${absolutePath}`);

    // Check if file exists
    if (!fs.existsSync(absolutePath)) {
      console.log(`File not found at: ${absolutePath}`);
      return res.status(404).json({
        success: false,
        message: 'File not found'
      });
    }

    console.log(`File found, initiating download: ${absolutePath}`);
    // Download the file
    res.download(absolutePath, fileName || path.basename(absolutePath));
  } catch (error) {
    console.error('Error downloading file:', error);
    res.status(500).json({
      success: false,
      message: 'Could not download file',
      error: error.message
    });
  }
};

// @desc    Get MIS data
// @route   GET /api/document-submissions/mis/data
// @access  Private (Admin, Approver)
exports.getMISData = async (req, res) => {
  try {
    // Get counts by status
    const statusCounts = await DocumentSubmission.aggregate([
      {
        $group: {
          _id: '$submissionStatus',
          count: { $sum: 1 }
        }
      }
    ]);

    // Get counts by month
    const monthCounts = await DocumentSubmission.aggregate([
      {
        $group: {
          _id: { year: '$year', month: '$month' },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': -1, '_id.month': -1 } }
    ]);

    // Get vendor performance
    const vendorPerformance = await DocumentSubmission.aggregate([
      {
        $lookup: {
          from: 'users',
          localField: 'vendor',
          foreignField: '_id',
          as: 'vendorInfo'
        }
      },
      { $unwind: '$vendorInfo' },
      {
        $group: {
          _id: '$vendor',
          vendorName: { $first: '$vendorInfo.name' },
          vendorCompany: { $first: '$vendorInfo.company' },
          totalSubmissions: { $sum: 1 },
          approvedSubmissions: {
            $sum: {
              $cond: [{ $eq: ['$submissionStatus', 'approved'] }, 1, 0]
            }
          },
          rejectedSubmissions: {
            $sum: {
              $cond: [{ $eq: ['$submissionStatus', 'rejected'] }, 1, 0]
            }
          }
        }
      },
      {
        $project: {
          _id: 0,
          vendorId: '$_id',
          vendorName: 1,
          vendorCompany: 1,
          totalSubmissions: 1,
          approvedSubmissions: 1,
          rejectedSubmissions: 1,
          approvalRate: {
            $cond: [
              { $eq: ['$totalSubmissions', 0] },
              0,
              { $multiply: [{ $divide: ['$approvedSubmissions', '$totalSubmissions'] }, 100] }
            ]
          }
        }
      },
      { $sort: { approvalRate: -1 } }
    ]);

    res.status(200).json({
      success: true,
      data: {
        statusCounts,
        monthCounts,
        vendorPerformance
      }
    });
  } catch (error) {
    console.error('Error getting MIS data:', error);
    res.status(500).json({
      success: false,
      message: 'Could not get MIS data',
      error: error.message
    });
  }
};

// @desc    Get vendor status data with document details
// @route   GET /api/document-submissions/vendor-status
// @access  Private (Consultant, Admin)
exports.getVendorStatus = async (req, res) => {
  try {
    const { vendorId, year, month } = req.query;

    if (!vendorId) {
      return res.status(400).json({
        success: false,
        message: 'Missing required parameter: vendorId is required'
      });
    }

    // Find the vendor
    const vendor = await User.findById(vendorId);
    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: 'Vendor not found'
      });
    }

    // Build query for submissions
    let submissionQuery = { vendor: vendorId };
    
    // If year and month are provided, filter by them
    if (year && month) {
      submissionQuery['uploadPeriod.year'] = parseInt(year);
      submissionQuery['uploadPeriod.month'] = month;
    }

    // Find all submissions for this vendor (all time or specific period)
    const submissions = await DocumentSubmission.find(submissionQuery);

    // Also check the Document model for any legacy documents
    const Document = require('../models/document.model');
    const legacyDocuments = await Document.find({ vendor: vendorId });

    // If no submissions and no legacy documents found, return empty data
    if (submissions.length === 0 && legacyDocuments.length === 0) {
      return res.status(200).json({
        success: true,
        data: {
          vendorId,
          vendorName: vendor.name,
          vendorCompany: vendor.company,
          year: year ? parseInt(year) : null,
          month: month || null,
          totalDocuments: 0,
          approvedDocuments: 0,
          rejectedDocuments: 0,
          pendingDocuments: 0,
          complianceScore: 0,
          documents: []
        }
      });
    }

    // Extract all documents from all submissions
    let allDocuments = [];
    
    // Process DocumentSubmission documents
    submissions.forEach(submission => {
      submission.documents.forEach(doc => {
        allDocuments.push({
          id: doc._id,
          submissionId: submission._id,
          documentType: doc.documentType,
          documentName: doc.documentName,
          fileName: doc.fileName,
          fileType: doc.fileType,
          uploadDate: doc.uploadDate,
          status: doc.status,
          isMandatory: doc.isMandatory,
          consultantRemarks: doc.consultantRemarks || '',
          reviewDate: doc.reviewDate,
          source: 'submission'
        });
      });
    });

    // Process legacy Document model documents
    legacyDocuments.forEach(doc => {
      allDocuments.push({
        id: doc._id,
        submissionId: null,
        documentType: doc.documentType || 'other',
        documentName: doc.title,
        fileName: doc.fileName || doc.title,
        fileType: doc.fileType || 'unknown',
        uploadDate: doc.submissionDate || doc.createdAt,
        status: doc.status,
        isMandatory: false,
        consultantRemarks: doc.reviewNotes || '',
        reviewDate: doc.reviewDate,
        source: 'legacy'
      });
    });

    // Count documents by status
    const totalDocuments = allDocuments.length;
    const approvedDocuments = allDocuments.filter(doc => 
      doc.status === 'approved' || 
      doc.status === 'consultant_approved' || 
      doc.status === 'final_approved'
    ).length;
    const rejectedDocuments = allDocuments.filter(doc => 
      doc.status === 'rejected' || 
      doc.status === 'consultant_rejected' || 
      doc.status === 'final_rejected'
    ).length;
    const pendingDocuments = allDocuments.filter(doc => 
      doc.status === 'uploaded' || 
      doc.status === 'under_review' || 
      doc.status === 'pending'
    ).length;

    // Calculate compliance score
    const complianceScore = totalDocuments > 0 
      ? Math.round((approvedDocuments / totalDocuments) * 100) 
      : 0;

    // Group documents by type
    const documentsByType = {};
    allDocuments.forEach(doc => {
      if (!documentsByType[doc.documentType]) {
        documentsByType[doc.documentType] = [];
      }
      documentsByType[doc.documentType].push(doc);
    });

    console.log(`Vendor Status for ${vendor.name}:`, {
      totalDocuments,
      approvedDocuments,
      rejectedDocuments,
      pendingDocuments,
      complianceScore,
      submissionsCount: submissions.length,
      legacyDocumentsCount: legacyDocuments.length
    });

    // Return the status data
    res.status(200).json({
      success: true,
      data: {
        vendorId,
        vendorName: vendor.name,
        vendorCompany: vendor.company,
        year: year ? parseInt(year) : null,
        month: month || null,
        totalDocuments,
        approvedDocuments,
        rejectedDocuments,
        pendingDocuments,
        complianceScore,
        documents: allDocuments,
        documentsByType,
        analytics: {
          totalDocuments,
          approvedDocuments,
          rejectedDocuments,
          pendingDocuments,
          complianceRate: complianceScore,
          lastActivity: submissions.length > 0 ? 
            Math.max(...submissions.map(s => new Date(s.lastModifiedDate || s.createdAt).getTime())) :
            (legacyDocuments.length > 0 ? 
              Math.max(...legacyDocuments.map(d => new Date(d.updatedAt || d.createdAt).getTime())) :
              new Date(vendor.createdAt).getTime())
        }
      }
    });
  } catch (error) {
    console.error('Error getting vendor status:', error);
    res.status(500).json({
      success: false,
      message: 'Could not get vendor status data',
      error: error.message
    });
  }
};

// @desc    Get all submissions
// @route   GET /api/document-submissions/admin/all
// @access  Private (Admin)
exports.getAllSubmissions = async (req, res) => {
  try {
    const { status, vendor, year, month, page = 1, limit = 10 } = req.query;

    // Build query
    const query = {};

    if (status) query.submissionStatus = status;
    if (vendor) query.vendor = vendor;
    if (year) query.year = year;
    if (month) query.month = month;

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Get submissions with pagination
    const submissions = await DocumentSubmission.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('vendor', 'name email company')
      .populate('consultant', 'name email');

    // Get total count
    const total = await DocumentSubmission.countDocuments(query);

    res.status(200).json({
      success: true,
      count: submissions.length,
      total,
      totalPages: Math.ceil(total / parseInt(limit)),
      currentPage: parseInt(page),
      data: submissions
    });
  } catch (error) {
    console.error('Error getting all submissions:', error);
    res.status(500).json({
      success: false,
      message: 'Could not get submissions',
      error: error.message
    });
  }
};

// @desc    Get submission details
// @route   GET /api/document-submissions/:submissionId
// @access  Private
exports.getSubmissionDetails = async (req, res) => {
  try {
    const { submissionId } = req.params;

    // Find the submission
    const submission = await DocumentSubmission.findById(submissionId)
      .populate('vendor', 'name email company')
      .populate('consultant', 'name email');

    if (!submission) {
      return res.status(404).json({
        success: false,
        message: 'Submission not found'
      });
    }

    // Check if user has permission to view this submission
    if (
      (req.user.role === 'vendor' && submission.vendor && submission.vendor._id.toString() !== req.user.id) ||
      (req.user.role === 'consultant' && submission.consultant && submission.consultant._id && submission.consultant._id.toString() !== req.user.id)
    ) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this submission'
      });
    }

    res.status(200).json({
      success: true,
      data: submission
    });
  } catch (error) {
    console.error('Error getting submission details:', error);
    res.status(500).json({
      success: false,
      message: 'Could not get submission details',
      error: error.message
    });
  }
};

// @desc    Get document types
// @route   GET /api/document-submissions/document-types
// @access  Public
exports.getDocumentTypes = async (req, res) => {
  try {
    const { month } = req.query;
    
    // Use the static method from the model to get available document types
    const availableTypes = DocumentSubmission.getAvailableDocumentTypes(month);
    
    // Format the response to include all document information
    const documentTypes = {
      monthly_mandatory: availableTypes.monthly_mandatory.map(type => ({
        id: type,
        name: getDocumentDisplayName(type),
        category: 'monthly_mandatory',
        mandatory: true,
        description: 'Required every month'
      })),
      annual_mandatory: availableTypes.annual_mandatory.map(type => ({
        id: type,
        name: getDocumentDisplayName(type),
        category: 'annual_mandatory',
        mandatory: month === 'Jan',
        description: 'Required only in January'
      })),
      one_time_optional: availableTypes.one_time_optional.map(type => ({
        id: type,
        name: getDocumentDisplayName(type),
        category: 'one_time_optional',
        mandatory: false,
        description: 'Upload once, not mandatory'
      }))
    };

    res.status(200).json({
      success: true,
      data: documentTypes
    });
  } catch (error) {
    console.error('Error getting document types:', error);
    res.status(500).json({
      success: false,
      message: 'Could not get document types',
      error: error.message
    });
  }
};

// Helper function to get display names for document types
const getDocumentDisplayName = (documentType) => {
  const displayNames = {
    'INVOICE': 'Invoice',
    'FORM_T_MUSTER_ROLL': 'Form T Combined Muster Roll Cum Register of Wages (previous month)',
    'BANK_STATEMENT': 'Bank Statement (previous month)',
    'ECR': 'Electronic Challan Cum Return (ECR) (previous month)',
    'PF_COMBINED_CHALLAN': 'Combined Challan of A/C NO. 01, 02, 10, 21 & 22 (EPFO) (previous month)',
    'PF_TRRN_DETAILS': 'Provident Fund TRRN Details (previous month)',
    'ESI_CONTRIBUTION_HISTORY': 'ESIC Contribution History Statement (previous month)',
    'ESI_CHALLAN': 'ESIC Challan (previous month)',
    'PROFESSIONAL_TAX_RETURNS': 'Professional Tax Returns – Form 5A (previous month)',
    'LABOUR_WELFARE_FUND': 'Labour Welfare Fund Form-D (December data)',
    'VENDOR_AGREEMENT': 'Copy of Agreement (Vendors)',
    'EPF_CODE_LETTER': 'EPF Code Allotment Letter',
    'EPF_FORM_5A': 'EPF Form – 5A',
    'ESIC_REGISTRATION': 'ESIC Registration Certificate – Form C11',
    'PT_REGISTRATION': 'Professional Tax Registration Certificate – Form 3',
    'PT_ENROLLMENT': 'Professional Tax Enrollment Certificate – Form 4',
    'CONTRACT_LABOUR_LICENSE': 'Contract Labour License (if applicable)'
  };
  
  return displayNames[documentType] || documentType;
};

// @desc    Get upload periods
// @route   GET /api/document-submissions/upload-periods
// @access  Public
exports.getUploadPeriods = async (req, res) => {
  try {
    // Generate years (current year and 2 years back)
    const currentYear = new Date().getFullYear();
    const years = [currentYear - 2, currentYear - 1, currentYear];

    // Generate months
    const months = [
      { id: 1, name: 'January' },
      { id: 2, name: 'February' },
      { id: 3, name: 'March' },
      { id: 4, name: 'April' },
      { id: 5, name: 'May' },
      { id: 6, name: 'June' },
      { id: 7, name: 'July' },
      { id: 8, name: 'August' },
      { id: 9, name: 'September' },
      { id: 10, name: 'October' },
      { id: 11, name: 'November' },
      { id: 12, name: 'December' }
    ];

    res.status(200).json({
      success: true,
      data: {
        years,
        months
      }
    });
  } catch (error) {
    console.error('Error getting upload periods:', error);
    res.status(500).json({
      success: false,
      message: 'Could not get upload periods',
      error: error.message
    });
  }
};

// @desc    DEBUG - Get all submissions
// @route   GET /api/document-submissions/debug/all-submissions
// @access  Public (for debugging only)
exports.debugGetAllSubmissions = async (req, res) => {
  try {
    const submissions = await DocumentSubmission.find()
      .populate('vendor', 'name email company')
      .populate('consultant', 'name email');
    
    // Log document statuses for debugging
    console.log('Returning submissions with document statuses:');
    submissions.forEach(submission => {
      console.log(`Submission ${submission.submissionId}:`);
      submission.documents.forEach(doc => {
        console.log(`  - ${doc.documentName}: ${doc.status}`);
      });
    });
    
    res.status(200).json({
      success: true,
      count: submissions.length,
      data: submissions
    });
  } catch (error) {
    console.error('Error getting all submissions (debug):', error);
    res.status(500).json({
      success: false,
      message: 'Could not get submissions',
      error: error.message
    });
  }
};

// @desc    Submit for review
// @route   POST /api/document-submissions/:submissionId/submit
// @access  Private (Vendor)
exports.submitForReview = async (req, res) => {
  try {
    const { submissionId } = req.params;
    
    // Find the submission
    const submission = await DocumentSubmission.findById(submissionId);
    
    if (!submission) {
      return res.status(404).json({
        success: false,
        message: 'Submission not found'
      });
    }
    
    // Check if user has permission to submit this submission
    if (req.user.role === 'vendor' && submission.vendor.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to submit this submission'
      });
    }
    
    // Check if all mandatory documents are uploaded
    const uploadedDocumentTypes = submission.documents.map(doc => doc.documentType);
    
    // Get mandatory documents based on the submission month
    const submissionMonth = new Date(submission.submissionDate).getMonth() + 1; // 1-12 for Jan-Dec
    const requiredDocuments = getMandatoryDocumentsForMonth(submissionMonth);
    
    const missingMandatoryDocuments = requiredDocuments.filter(
      type => !uploadedDocumentTypes.includes(type)
    );
    
    if (missingMandatoryDocuments.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Missing mandatory documents',
        missingDocuments: missingMandatoryDocuments
      });
    }
    
    // Update submission status
    submission.submissionStatus = 'submitted';
    submission.submissionDate = Date.now();
    
    // Save the updated submission
    await submission.save();
    
    res.status(200).json({
      success: true,
      message: 'Submission submitted for review successfully',
      data: submission
    });
  } catch (error) {
    console.error('Error submitting for review:', error);
    res.status(500).json({
      success: false,
      message: 'Could not submit for review',
      error: error.message
    });
  }
};

// @desc    Update document status
// @route   PUT /api/document-submissions/:submissionId/documents/:documentId/status
// @access  Private (Consultant, Admin)
exports.updateDocumentStatus = async (req, res) => {
  try {
    const { submissionId, documentId } = req.params;
    const { status, remarks } = req.body;
    
    // Validate status
    if (!['pending', 'approved', 'rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be pending, approved, or rejected'
      });
    }
    
    // Find the submission
    const submission = await DocumentSubmission.findById(submissionId);
    
    if (!submission) {
      return res.status(404).json({
        success: false,
        message: 'Submission not found'
      });
    }
    
    // Find the document in the submission
    const document = submission.documents.id(documentId);
    
    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Document not found in submission'
      });
    }
    
    // Update document status
    document.status = status;
    
    // Add remarks if provided
    if (remarks) {
      document.consultantRemarks = remarks;
    }
    
    // Update review date and reviewer
    document.reviewDate = Date.now();
    document.reviewedBy = req.user.id;
    
    // If all documents are approved, update submission status
    const allApproved = submission.documents.every(doc => doc.status === 'approved');
    const anyRejected = submission.documents.some(doc => doc.status === 'rejected');
    
    if (allApproved) {
      submission.submissionStatus = 'approved';
    } else if (anyRejected) {
      submission.submissionStatus = 'requires_resubmission';
    } else {
      submission.submissionStatus = 'under_review';
    }
    
    // Save the updated submission
    await submission.save();
    
    res.status(200).json({
      success: true,
      message: 'Document status updated successfully',
      data: document
    });
  } catch (error) {
    console.error('Error updating document status:', error);
    res.status(500).json({
      success: false,
      message: 'Could not update document status',
      error: error.message
    });
  }
};

// @desc    Upload document
// @route   POST /api/document-submissions/:submissionId/upload
// @access  Private (Vendor)
exports.uploadDocument = async (req, res) => {
  try {
    const { submissionId } = req.params;
    
    // Find the submission
    const submission = await DocumentSubmission.findById(submissionId);
    
    if (!submission) {
      return res.status(404).json({
        success: false,
        message: 'Submission not found'
      });
    }
    
    // Check if user has permission to upload to this submission
    if (req.user.role === 'vendor' && submission.vendor.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to upload to this submission'
      });
    }
    
    // Process upload with multer
    const uploadMiddleware = upload.single('document');
    
    uploadMiddleware(req, res, async (err) => {
      if (err) {
        return res.status(400).json({
          success: false,
          message: err.message
        });
      }
      
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'No file uploaded'
        });
      }
      
      const { documentType } = req.body;
      
      if (!documentType) {
        return res.status(400).json({
          success: false,
          message: 'Document type is required'
        });
      }
      
      // Check if document type already exists in submission
      const existingDocIndex = submission.documents.findIndex(
        doc => doc.documentType === documentType
      );
      
      if (existingDocIndex !== -1) {
        // Remove the old file from the filesystem
        const oldFilePath = path.join(__dirname, '../uploads', submission.documents[existingDocIndex].filePath);
        if (fs.existsSync(oldFilePath)) {
          fs.unlinkSync(oldFilePath);
        }
        
        // Update the existing document
        submission.documents[existingDocIndex] = {
          ...submission.documents[existingDocIndex],
          originalName: req.file.originalname,
          filePath: req.file.filename,
          fileSize: req.file.size,
          mimeType: req.file.mimetype,
          uploadDate: Date.now(),
          status: 'pending',
          consultantRemarks: '',
          reviewDate: null,
          reviewedBy: null
        };
      } else {
        // Add new document
        submission.documents.push({
          documentType,
          originalName: req.file.originalname,
          filePath: req.file.filename,
          fileSize: req.file.size,
          mimeType: req.file.mimetype,
          uploadDate: Date.now(),
          status: 'pending',
          consultantRemarks: '',
          reviewDate: null,
          reviewedBy: null
        });
      }
      
      // If submission was in 'changes_required' status and all mandatory documents are now uploaded,
      // update status to 'submitted'
      if (submission.submissionStatus === 'changes_required') {
        const uploadedDocumentTypes = submission.documents.map(doc => doc.documentType);
        
        // Get mandatory documents based on the submission month
        const submissionMonth = new Date(submission.submissionDate).getMonth() + 1; // 1-12 for Jan-Dec
        const requiredDocuments = getMandatoryDocumentsForMonth(submissionMonth);
        
        const allMandatoryUploaded = requiredDocuments.every(
          type => uploadedDocumentTypes.includes(type)
        );
        
        if (allMandatoryUploaded) {
          submission.submissionStatus = 'submitted';
          submission.submissionDate = Date.now();
        }
      }
      
      // Save the updated submission
      await submission.save();

      // Create notification for assigned consultant
      await createDocumentUploadNotification(submission, documentType, existingDocIndex !== -1 ? 'resubmitted' : 'uploaded', req.user.id);
      
      res.status(200).json({
        success: true,
        message: 'Document uploaded successfully',
        data: submission.documents[existingDocIndex !== -1 ? existingDocIndex : submission.documents.length - 1]
      });
    });
  } catch (error) {
    console.error('Error uploading document:', error);
    res.status(500).json({
      success: false,
      message: 'Could not upload document',
      error: error.message
    });
  }
};

// @desc    Delete document from submission by document type
// @route   DELETE /api/document-submissions/:submissionId/documents/:documentType
// @access  Private (Vendor)
exports.deleteDocument = async (req, res) => {
  try {
    const { submissionId, documentType } = req.params;
    
    // Find the submission
    const submission = await DocumentSubmission.findById(submissionId);
    
    if (!submission) {
      return res.status(404).json({
        success: false,
        message: 'Submission not found'
      });
    }
    
    // Check if user has permission to delete from this submission
    // Only vendor who owns the submission can delete documents
    if (req.user.role === 'vendor' && submission.vendor.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete from this submission'
      });
    }
    
    // Find the document in the submission by document type
    const documentIndex = submission.documents.findIndex(
      doc => doc.documentType === documentType
    );
    
    if (documentIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Document not found in submission'
      });
    }
    
    // Get the document to delete
    const documentToDelete = submission.documents[documentIndex];
    
    // Remove the file from the filesystem
    const filePath = path.join(__dirname, '../uploads', documentToDelete.filePath);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    
    // Remove the document from the submission
    submission.documents.splice(documentIndex, 1);
    
    // Save the updated submission
    await submission.save();
    
    res.status(200).json({
      success: true,
      message: 'Document deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting document:', error);
    res.status(500).json({
      success: false,
      message: 'Could not delete document',
      error: error.message
    });
  }
};

// @desc    Delete document by ID
// @route   DELETE /api/document-submissions/documents/:documentId
// @access  Private (Vendor)
exports.deleteDocumentById = async (req, res) => {
  try {
    const { documentId } = req.params;
    
    // Find all submissions that contain the document with the given ID
    const submissions = await DocumentSubmission.find({
      'documents._id': documentId
    });
    
    if (submissions.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Document not found'
      });
    }
    
    // Get the submission that contains the document
    const submission = submissions[0];
    
    // Check if user has permission to delete from this submission
    // Only vendor who owns the submission can delete documents
    if (req.user.role === 'vendor' && submission.vendor.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this document'
      });
    }
    
    // Find the document in the submission by ID
    const documentIndex = submission.documents.findIndex(
      doc => doc._id.toString() === documentId
    );
    
    if (documentIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Document not found in submission'
      });
    }
    
    // Get the document to delete
    const documentToDelete = submission.documents[documentIndex];
    
    // Remove the file from the filesystem
    const filePath = path.join(__dirname, '../uploads', documentToDelete.filePath);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    
    // Remove the document from the submission
    submission.documents.splice(documentIndex, 1);
    
    // Save the updated submission
    await submission.save();
    
    res.status(200).json({
      success: true,
      message: 'Document deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting document by ID:', error);
    res.status(500).json({
      success: false,
      message: 'Could not delete document',
      error: error.message
    });
  }
};

// @desc    Review document
// @route   POST /api/document-submissions/:submissionId/review/:documentType
// @access  Private (Consultant, Admin)
exports.reviewDocument = async (req, res) => {
  try {
    const { submissionId, documentType } = req.params;
    const { status, remarks } = req.body;
    
    // Validate status
    if (!['pending', 'approved', 'rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be pending, approved, or rejected'
      });
    }
    
    // Find the submission
    const submission = await DocumentSubmission.findById(submissionId);
    
    if (!submission) {
      return res.status(404).json({
        success: false,
        message: 'Submission not found'
      });
    }
    
    // Find the document in the submission by document type
    const documentIndex = submission.documents.findIndex(
      doc => doc.documentType === documentType
    );
    
    if (documentIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Document not found in submission'
      });
    }
    
    // Update the document status
    submission.documents[documentIndex].status = status;
    
    // Add remarks if provided
    if (remarks) {
      submission.documents[documentIndex].consultantRemarks = remarks;
    }
    
    // Update review date and reviewer
    submission.documents[documentIndex].reviewDate = Date.now();
    submission.documents[documentIndex].reviewedBy = req.user.id;
    
    // If all documents are approved, update submission status
    const allApproved = submission.documents.every(doc => doc.status === 'approved');
    const anyRejected = submission.documents.some(doc => doc.status === 'rejected');
    
    if (allApproved) {
      submission.submissionStatus = 'approved';
    } else if (anyRejected) {
      submission.submissionStatus = 'requires_resubmission';
    } else {
      submission.submissionStatus = 'under_review';
    }
    
    // Save the updated submission
    await submission.save();

    // Create notification for vendor about document review
    await createDocumentReviewNotification(
      submission, 
      documentType, 
      status, 
      remarks, 
      req.user.id, 
      submission.vendor
    );

    // If all documents are reviewed, create completion notification for admins
    const allReviewed = submission.documents.every(doc => doc.status !== 'pending');
    if (allReviewed) {
      const approvedCount = submission.documents.filter(doc => doc.status === 'approved').length;
      const rejectedCount = submission.documents.filter(doc => doc.status === 'rejected').length;
      await createCompletionNotification(
        submission, 
        req.user.id, 
        'completion', 
        `${approvedCount} documents approved, ${rejectedCount} documents rejected.`
      );
    }
    
    res.status(200).json({
      success: true,
      message: 'Document reviewed successfully',
      data: submission.documents[documentIndex]
    });
  } catch (error) {
    console.error('Error reviewing document:', error);
    res.status(500).json({
      success: false,
      message: 'Could not review document',
      error: error.message
    });
  }
};

// @desc    Final approval
// @route   POST /api/document-submissions/:submissionId/final-approval
// @access  Private (Consultant, Admin)
exports.finalApproval = async (req, res) => {
  try {
    const { submissionId } = req.params;
    const { status, remarks } = req.body;
    
    // Validate status
    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be approved or rejected'
      });
    }
    
    // Find the submission
    const submission = await DocumentSubmission.findById(submissionId);
    
    if (!submission) {
      return res.status(404).json({
        success: false,
        message: 'Submission not found'
      });
    }
    
    // Update submission status
    submission.submissionStatus = status === 'approved' ? 'final_approved' : 'changes_required';
    
    // Add final remarks if provided
    if (remarks) {
      submission.finalRemarks = remarks;
    }
    
    // Update final approval date and approver
    submission.finalApprovalDate = Date.now();
    submission.finalApprovedBy = req.user.id;
    
    // Save the updated submission
    await submission.save();

    // Create final approval notification for vendor
    const vendor = await User.findById(submission.vendor);
    const consultant = await User.findById(req.user.id);
    
    const vendorNotification = await Notification.create({
      recipient: submission.vendor,
      sender: req.user.id,
      type: status === 'approved' ? 'document_approved' : 'document_rejected',
      title: `Final Submission ${status === 'approved' ? 'Approved' : 'Rejected'}`,
      message: `Your submission for ${submission.year}/${submission.month} has been ${status} by ${consultant.name}. ${remarks ? 'Remarks: ' + remarks : ''}`,
      relatedDocument: submission._id,
      priority: status === 'rejected' ? 'high' : 'medium'
    });

    // Send real-time notification to vendor
    socketService.sendToUser(submission.vendor.toString(), 'notification', {
      type: 'notification',
      data: {
        ...vendorNotification.toObject(),
        relatedDocument: {
          _id: submission._id,
          title: `${submission.year}/${submission.month} - Final Approval`,
          status: status,
          consultantName: consultant.name,
          remarks: remarks || '',
          reviewDate: new Date().toISOString()
        }
      }
    });

    // Create verification report notification for admins
    await createCompletionNotification(
      submission, 
      req.user.id, 
      'verification', 
      `Submission has been ${status}. ${remarks ? 'Remarks: ' + remarks : ''}`
    );
    
    res.status(200).json({
      success: true,
      message: 'Final approval completed successfully',
      data: submission
    });
  } catch (error) {
    console.error('Error processing final approval:', error);
    res.status(500).json({
      success: false,
      message: 'Could not process final approval',
      error: error.message
    });
  }
};

// @desc    Download document
// @route   GET /api/document-submissions/:submissionId/download/:documentType
// @access  Private (Consultant, Admin, Approver)
exports.downloadDocument = async (req, res) => {
  try {
    const { submissionId, documentType } = req.params;
    
    // Find the submission
    const submission = await DocumentSubmission.findById(submissionId);
    
    if (!submission) {
      return res.status(404).json({
        success: false,
        message: 'Submission not found'
      });
    }
    
    // Find the document in the submission by document type
    const document = submission.documents.find(
      doc => doc.documentType === documentType
    );
    
    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Document not found in submission'
      });
    }
    
    // Construct the absolute path
    const filePath = path.join(__dirname, '../uploads', document.filePath);
    
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        message: 'File not found on server'
      });
    }
    
    // Download the file
    res.download(filePath, document.originalName);
    
  } catch (error) {
    console.error('Error downloading document:', error);
    res.status(500).json({
      success: false,
      message: 'Could not download document',
      error: error.message
    });
  }
};

// @desc    Get vendor's submissions
// @route   GET /api/document-submissions/vendor/submissions
// @access  Private (Vendor for own submissions, Consultant/Admin for assigned vendors)
exports.getVendorSubmissions = async (req, res) => {
  try {
    let query = {};
    
    // Debug: Log the incoming query parameters
    console.log('🔍 Filtering parameters received:', req.query);
    
    // If a vendorId is provided in the query and user is consultant or admin
    if (req.query.vendorId && ['consultant', 'admin'].includes(req.user.role)) {
      // Allow consultants and admins to view submissions for a specific vendor
      query.vendor = req.query.vendorId;
      
      // If checkAssignment is true and user is a consultant, verify the vendor is assigned to this consultant
      if (req.query.checkAssignment === 'true' && req.user.role === 'consultant') {
        // Check if this vendor is assigned to the consultant
        const vendor = await User.findById(req.query.vendorId);
        
        if (!vendor) {
          return res.status(404).json({
            success: false,
            message: 'Vendor not found'
          });
        }
        
        // If vendor is not assigned to this consultant, deny access
        if (vendor.assignedConsultant && vendor.assignedConsultant.toString() !== req.user.id) {
          return res.status(403).json({
            success: false,
            message: 'You do not have permission to view this vendor\'s submissions'
          });
        }
      }
    } else {
      // For vendors, only show their own submissions
      if (req.user.role === 'vendor') {
        query.vendor = req.user.id;
      } else {
        // If no vendorId is provided and user is not a vendor, return error
        return res.status(400).json({
          success: false,
          message: 'Vendor ID is required for consultant and admin users'
        });
      }
    }
    
    // Add date filtering
    if (req.query.year && !isNaN(parseInt(req.query.year))) {
      const year = parseInt(req.query.year);
      
      // Validate year is reasonable
      if (year >= 2020 && year <= 2040) {
        const startDate = new Date(year, 0, 1); // January 1st of the year
        const endDate = new Date(year + 1, 0, 1); // January 1st of next year
        
        // Validate dates are valid
        if (!isNaN(startDate.getTime()) && !isNaN(endDate.getTime())) {
          query.createdAt = {
            $gte: startDate,
            $lt: endDate
          };
          
          // Add month filtering if specified
          if (req.query.month && req.query.month !== '' && !isNaN(parseInt(req.query.month))) {
            const month = parseInt(req.query.month) - 1; // Convert to 0-based month
            
            // Validate month is reasonable (0-11)
            if (month >= 0 && month <= 11) {
              const monthStartDate = new Date(year, month, 1);
              const monthEndDate = new Date(year, month + 1, 1);
              
              // Validate month dates are valid
              if (!isNaN(monthStartDate.getTime()) && !isNaN(monthEndDate.getTime())) {
                query.createdAt = {
                  $gte: monthStartDate,
                  $lt: monthEndDate
                };
              }
            }
          }
        }
      }
    }
    
    console.log('📊 MongoDB query being executed:', JSON.stringify(query, null, 2));
    
    // Validate query dates before executing
    if (query.createdAt) {
      console.log('📅 Date filter details:', {
        startDate: query.createdAt.$gte,
        endDate: query.createdAt.$lt,
        startValid: query.createdAt.$gte instanceof Date && !isNaN(query.createdAt.$gte.getTime()),
        endValid: query.createdAt.$lt instanceof Date && !isNaN(query.createdAt.$lt.getTime())
      });
    }
    
    // Find submissions based on the query
    let submissions = await DocumentSubmission.find(query)
      .sort({ createdAt: -1 })
      .populate('vendor', 'name email company')
      .populate('consultant', 'name email');
    
    // Apply status filtering after fetching (since status is on individual documents)
    if (req.query.status && req.query.status !== '') {
      console.log(`🔍 Filtering by status: "${req.query.status}"`);
      
      // Debug: Log all unique statuses found in the documents
      const allStatuses = new Set();
      submissions.forEach(submission => {
        submission.documents.forEach(doc => {
          allStatuses.add(doc.status);
        });
      });
      console.log('📊 All unique document statuses found:', Array.from(allStatuses));
      
      // Filter submissions and also filter documents within each submission
      submissions = submissions.filter(submission => {
        // Check if any document in the submission has the specified status
        const hasMatchingStatus = submission.documents.some(doc => doc.status === req.query.status);
        
        if (hasMatchingStatus) {
          // Only keep documents that match the status filter
          submission.documents = submission.documents.filter(doc => {
            const matches = doc.status === req.query.status;
            if (matches) {
              console.log(`✅ Keeping document "${doc.documentName}" with status "${doc.status}"`);
            }
            return matches;
          });
          
          console.log(`✅ Submission ${submission.submissionId} after filtering has ${submission.documents.length} documents with status "${req.query.status}"`);
        }
        
        return hasMatchingStatus;
      });
    }
    
    // Apply search filtering
    if (req.query.search && req.query.search !== '') {
      const searchTerm = req.query.search.toLowerCase();
      console.log(`🔍 Filtering by search term: ${searchTerm}`);
      submissions = submissions.filter(submission => {
        // Search in submission ID, vendor name, company, or document names
        return submission.submissionId.toLowerCase().includes(searchTerm) ||
               submission.vendor?.name?.toLowerCase().includes(searchTerm) ||
               submission.vendor?.company?.toLowerCase().includes(searchTerm) ||
               submission.documents.some(doc => 
                 doc.documentName?.toLowerCase().includes(searchTerm) ||
                 doc.documentType?.toLowerCase().includes(searchTerm)
               );
      });
    }
    
    console.log(`📊 Final filtered submissions count: ${submissions.length}`);
    
    // Apply pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    
    const totalSubmissions = submissions.length;
    const paginatedSubmissions = submissions.slice(startIndex, endIndex);
    
    console.log(`📊 Pagination: Page ${page}, Limit ${limit}, Total ${totalSubmissions}, Showing ${paginatedSubmissions.length}`);
    
    // Log document statuses for debugging
    console.log('Returning vendor submissions with document statuses:');
    let resubmittedCount = 0;
    let rejectedCount = 0;
    paginatedSubmissions.forEach(submission => {
      console.log(`Submission ${submission.submissionId}:`);
      submission.documents.forEach(doc => {
        console.log(`  - ${doc.documentName}: ${doc.status} (ID: ${doc._id})`);
        if (doc.status === 'resubmitted') {
          resubmittedCount++;
          console.log(`    --> RESUBMITTED DOCUMENT FOUND: ${doc.documentName}`);
        }
        if (doc.status === 'rejected') {
          rejectedCount++;
          console.log(`    --> REJECTED DOCUMENT FOUND: ${doc.documentName} (ID: ${doc._id})`);
        }
      });
    });
    console.log(`Total resubmitted documents found: ${resubmittedCount}`);
    console.log(`Total rejected documents found: ${rejectedCount}`);
    
    res.status(200).json({
      success: true,
      count: paginatedSubmissions.length,
      total: totalSubmissions,
      page: page,
      totalPages: Math.ceil(totalSubmissions / limit),
      data: paginatedSubmissions
    });
  } catch (error) {
    console.error('Error getting vendor submissions:', error);
    res.status(500).json({
      success: false,
      message: 'Could not get vendor submissions',
      error: error.message
    });
  }
};

// @desc    Get consultant's assigned submissions
// @route   GET /api/document-submissions/consultant/submissions
// @access  Private (Consultant, Admin)
exports.getConsultantSubmissions = async (req, res) => {
  try {
    let query = {};
    
    // If user is a consultant, only show submissions assigned to them
    if (req.user.role === 'consultant') {
      query['consultant.email'] = req.user.email;
    }
    
    // Find submissions based on query
    const submissions = await DocumentSubmission.find(query)
      .sort({ createdAt: -1 })
      .populate('vendor', 'name email company');
    
    // Log document statuses for debugging
    console.log('Returning submissions with document statuses:');
    submissions.forEach(submission => {
      console.log(`Submission ${submission.submissionId}:`);
      submission.documents.forEach(doc => {
        console.log(`  - ${doc.documentName}: ${doc.status}`);
      });
    });
    
    res.status(200).json({
      success: true,
      count: submissions.length,
      data: submissions
    });
  } catch (error) {
    console.error('Error getting consultant submissions:', error);
    res.status(500).json({
      success: false,
      message: 'Could not get consultant submissions',
      error: error.message
    });
  }
};

// @desc    Bulk approve submissions
// @route   POST /api/document-submissions/admin/bulk-approve
// @access  Private (Admin)
exports.bulkApprove = async (req, res) => {
  try {
    const { submissionIds, remarks } = req.body;
    
    if (!submissionIds || !Array.isArray(submissionIds) || submissionIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide an array of submission IDs'
      });
    }
    
    // Update all submissions
    const updatePromises = submissionIds.map(async (submissionId) => {
      const submission = await DocumentSubmission.findById(submissionId);
      
      if (!submission) {
        return { id: submissionId, success: false, message: 'Submission not found' };
      }
      
      // Update all documents to approved
      submission.documents.forEach(doc => {
        doc.status = 'approved';
        doc.reviewDate = Date.now();
        doc.reviewedBy = req.user.id;
        
        if (remarks) {
          doc.consultantRemarks = remarks;
        }
      });
      
      // Update submission status
      submission.submissionStatus = 'approved';
      
      // Add final remarks if provided
      if (remarks) {
        submission.finalRemarks = remarks;
      }
      
      // Update final approval date and approver
      submission.finalApprovalDate = Date.now();
      submission.finalApprovedBy = req.user.id;
      
      await submission.save();
      
      return { id: submissionId, success: true, message: 'Submission approved' };
    });
    
    const results = await Promise.all(updatePromises);
    
    const successCount = results.filter(result => result.success).length;
    
    res.status(200).json({
      success: true,
      message: `Successfully approved ${successCount} out of ${submissionIds.length} submissions`,
      data: results
    });
  } catch (error) {
    console.error('Error bulk approving submissions:', error);
    res.status(500).json({
      success: false,
      message: 'Could not bulk approve submissions',
      error: error.message
    });
  }
};

// @desc    Bulk reject submissions
// @route   POST /api/document-submissions/admin/bulk-reject
// @access  Private (Admin)
exports.bulkReject = async (req, res) => {
  try {
    const { submissionIds, remarks } = req.body;
    
    if (!submissionIds || !Array.isArray(submissionIds) || submissionIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide an array of submission IDs'
      });
    }
    
    if (!remarks) {
      return res.status(400).json({
        success: false,
        message: 'Remarks are required for rejections'
      });
    }
    
    // Update all submissions
    const updatePromises = submissionIds.map(async (submissionId) => {
      const submission = await DocumentSubmission.findById(submissionId);
      
      if (!submission) {
        return { id: submissionId, success: false, message: 'Submission not found' };
      }
      
      // Update all documents to rejected
      submission.documents.forEach(doc => {
        doc.status = 'rejected';
        doc.reviewDate = Date.now();
        doc.reviewedBy = req.user.id;
        doc.consultantRemarks = remarks;
      });
      
      // Update submission status
      submission.submissionStatus = 'requires_resubmission';
      
      // Add final remarks
      submission.finalRemarks = remarks;
      
      // Update final rejection date and rejector
      submission.finalApprovalDate = Date.now();
      submission.finalApprovedBy = req.user.id;
      
      await submission.save();
      
      return { id: submissionId, success: true, message: 'Submission rejected' };
    });
    
    const results = await Promise.all(updatePromises);
    
    const successCount = results.filter(result => result.success).length;
    
    res.status(200).json({
      success: true,
      message: `Successfully rejected ${successCount} out of ${submissionIds.length} submissions`,
      data: results
    });
  } catch (error) {
    console.error('Error bulk rejecting submissions:', error);
    res.status(500).json({
      success: false,
      message: 'Could not bulk reject submissions',
      error: error.message
    });
  }
};
// Get submissions by status
exports.getSubmissionsByStatus = async (req, res) => {
  try {
    const { status } = req.params;
    const { consultantId, includeVendorDetails, includeFiles } = req.query;
    
    console.log(`Fetching submissions with status: ${status}, consultantId: ${consultantId}`);
    
    // Build query
    let query = {};
    
    // Filter by document status
    if (status === "approved" || status === "rejected" || status === "pending" || status === "under_review") {
      query["documents.status"] = status;
    }
    
    // If consultantId is provided, filter by consultant
    if (consultantId) {
      // For consultants, only show submissions assigned to them
      if (req.user.role === "consultant" && req.user.id !== consultantId) {
        return res.status(403).json({
          success: false,
          message: "You can only view submissions assigned to you"
        });
      }
      
      // Find submissions where any document has been reviewed by this consultant
      query["documents.reviewedBy"] = consultantId;
    }
    
    // Find submissions matching the query
    let submissions = await DocumentSubmission.find(query);
    
    // Process submissions to extract only documents with the requested status
    let processedData = [];
    
    submissions.forEach(submission => {
      // Filter documents by status
      const filteredDocuments = submission.documents.filter(doc => doc.status === status);
      
      // Skip submissions with no matching documents
      if (filteredDocuments.length === 0) return;
      
      // For each matching document, create a separate entry
      filteredDocuments.forEach(doc => {
        processedData.push({
          _id: doc._id,
          title: doc.documentName,
          documentType: doc.documentType,
          submissionDate: submission.submissionDate,
          approvalDate: doc.reviewDate,
          status: doc.status,
          vendor: {
            _id: submission.vendor,
            name: '', // Will be populated later
            company: '' // Will be populated later
          },
          reviewer: {
            _id: doc.reviewedBy,
            name: '' // Will be populated later
          },
          files: includeFiles === "true" ? [{
            _id: doc._id,
            originalName: doc.fileName,
            path: doc.filePath,
            mimeType: doc.fileType || 'application/pdf'
          }] : [],
          reviewNotes: doc.consultantRemarks
        });
      });
    });
    
    // Populate vendor and reviewer details
    if (processedData.length > 0) {
      // Get unique vendor IDs
      const vendorIds = [...new Set(processedData.map(item => item.vendor._id))];
      
      // Get unique reviewer IDs
      const reviewerIds = [...new Set(processedData.map(item => item.reviewer._id).filter(Boolean))];
      
      // Fetch vendor details
      const vendors = await User.find({ _id: { $in: vendorIds } }, "name company");
      
      // Fetch reviewer details
      const reviewers = await User.find({ _id: { $in: reviewerIds } }, "name");
      
      // Create maps for quick lookup
      const vendorMap = vendors.reduce((map, vendor) => {
        map[vendor._id.toString()] = vendor;
        return map;
      }, {});
      
      const reviewerMap = reviewers.reduce((map, reviewer) => {
        map[reviewer._id.toString()] = reviewer;
        return map;
      }, {});
      
      // Add details to each document
      processedData.forEach(doc => {
        // Add vendor details
        if (doc.vendor && doc.vendor._id) {
          const vendorId = doc.vendor._id.toString();
          if (vendorMap[vendorId]) {
            doc.vendor.name = vendorMap[vendorId].name;
            doc.vendor.company = vendorMap[vendorId].company;
          }
        }
        
        // Add reviewer details
        if (doc.reviewer && doc.reviewer._id) {
          const reviewerId = doc.reviewer._id.toString();
          if (reviewerMap[reviewerId]) {
            doc.reviewer.name = reviewerMap[reviewerId].name;
          }
        }
      });
    }
    
    res.status(200).json({
      success: true,
      count: processedData.length,
      data: processedData
    });
  } catch (error) {
    console.error(`Error getting ${req.params.status} submissions:`, error);
    res.status(500).json({
      success: false,
      message: `Could not get ${req.params.status} submissions`,
      error: error.message
    });
  }
};

// @desc    Resubmit a document in a submission
// @route   POST /api/document-submissions/:submissionId/documents/:documentId/resubmit
// @access  Private (Vendor)
exports.resubmitDocument = async (req, res) => {
  try {
    const { submissionId, documentId } = req.params;
    
    // Validate submission and document IDs
    if (!submissionId || !documentId) {
      return res.status(400).json({
        success: false,
        message: 'Submission ID and Document ID are required'
      });
    }
    
    // Find the submission
    const submission = await DocumentSubmission.findOne({ submissionId });
    
    if (!submission) {
      return res.status(404).json({
        success: false,
        message: `Submission with ID ${submissionId} not found`
      });
    }
    
    // Check if the user is the owner of the submission
    if (submission.vendor.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to resubmit documents for this submission'
      });
    }
    
    // Find the document in the submission
    const documentIndex = submission.documents.findIndex(doc => doc._id.toString() === documentId);
    
    if (documentIndex === -1) {
      return res.status(404).json({
        success: false,
        message: `Document with ID ${documentId} not found in submission ${submissionId}`
      });
    }
    
    // Check if the document is in a state that allows resubmission
    const document = submission.documents[documentIndex];
    if (document.status !== 'rejected') {
      return res.status(400).json({
        success: false,
        message: `Document must be in 'rejected' status to be resubmitted. Current status: ${document.status}`
      });
    }
    
    // Process the uploaded file with multer
    const uploadMiddleware = upload.single('document');
    
    uploadMiddleware(req, res, async (err) => {
      if (err) {
        console.error('Multer error:', err);
        return res.status(400).json({
          success: false,
          message: err.message
        });
      }
      
      // Check if a file was uploaded
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'No document file uploaded'
        });
      }
      
      // Get file extension and type
      const fileExtension = path.extname(req.file.originalname).toLowerCase().substring(1);
      let fileType = fileExtension;
      
      // Map file extensions to standardized types
      const typeMapping = {
        'pdf': 'pdf',
        'doc': 'word',
        'docx': 'word',
        'xls': 'excel',
        'xlsx': 'excel',
        'png': 'png',
        'jpg': 'jpeg',
        'jpeg': 'jpeg'
      };
      
      fileType = typeMapping[fileExtension] || fileExtension;
      
      // Update the document in the submission
      // Get the existing document
      const existingDoc = submission.documents[documentIndex];
      
      // Update only the necessary fields while preserving the rest
      existingDoc.fileName = req.file.filename;
      existingDoc.filePath = req.file.path;
      existingDoc.fileSize = req.file.size;
      existingDoc.fileType = fileType;
      existingDoc.documentName = req.file.originalname;
      existingDoc.status = 'resubmitted';
      existingDoc.uploadDate = Date.now();
      
      // Update the submission status if needed
      if (submission.submissionStatus === 'requires_resubmission') {
        // Check if all rejected documents have been resubmitted
        const hasRejectedDocs = submission.documents.some(doc => doc.status === 'rejected');
        
        if (!hasRejectedDocs) {
          submission.submissionStatus = 'submitted';
        }
      }
      
      // Update the last modified date
      submission.lastModifiedDate = Date.now();
      
      // Update the rejectedDocuments array to mark this document as resubmitted
      const rejectedDocIndex = submission.rejectedDocuments.findIndex(
        doc => doc.documentType === existingDoc.documentType && !doc.isResubmitted
      );
      
      if (rejectedDocIndex !== -1) {
        submission.rejectedDocuments[rejectedDocIndex].isResubmitted = true;
        submission.rejectedDocuments[rejectedDocIndex].resubmissionDate = Date.now();
      } else {
        // If not found in rejectedDocuments, add a new entry
        submission.rejectedDocuments.push({
          documentType: existingDoc.documentType,
          rejectionReason: existingDoc.consultantRemarks || 'Document was rejected',
          rejectedDate: existingDoc.reviewDate,
          rejectedBy: existingDoc.reviewedBy,
          isResubmitted: true,
          resubmissionDate: Date.now()
        });
      }
      
      // Save the updated submission
      await submission.save();
      
      // Return success response
      res.status(200).json({
        success: true,
        message: 'Document resubmitted successfully',
        data: {
          submissionId: submission.submissionId,
          documentId: submission.documents[documentIndex]._id,
          status: submission.documents[documentIndex].status
        }
      });
    });
  } catch (error) {
    console.error('Error resubmitting document:', error);
    res.status(500).json({
      success: false,
      message: 'Could not resubmit document',
      error: error.message
    });
  }
};

// @desc    Search for submission by document ID
// @route   GET /api/document-submissions/search-by-document/:documentId
// @access  Private
exports.searchSubmissionByDocumentId = async (req, res) => {
  try {
    const { documentId } = req.params;
    
    if (!documentId) {
      return res.status(400).json({
        success: false,
        message: 'Document ID is required'
      });
    }
    
    console.log('Searching for submission containing document ID:', documentId);
    
    // Find submission containing the document
    const submission = await DocumentSubmission.findOne({
      'documents._id': documentId
    });
    
    if (!submission) {
      return res.status(404).json({
        success: false,
        message: 'Submission not found for the given document ID'
      });
    }
    
    // Check if the user has access to this submission
    if (submission.vendor.toString() !== req.user.id && req.user.role !== 'admin' && req.user.role !== 'consultant') {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }
    
    return res.status(200).json({
      success: true,
      data: {
        submissionId: submission.submissionId,
        _id: submission._id,
        vendor: submission.vendor
      }
    });
  } catch (error) {
    console.error('Error searching for submission by document ID:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// @desc    Test endpoint to manually set a document status to resubmitted
// @route   POST /api/document-submissions/test/set-resubmitted/:documentId
// @access  Private
exports.testSetResubmitted = async (req, res) => {
  try {
    const { documentId } = req.params;
    
    if (!documentId) {
      return res.status(400).json({
        success: false,
        message: 'Document ID is required'
      });
    }
    
    console.log('Setting document status to resubmitted for ID:', documentId);
    
    // Find submission containing the document
    const submission = await DocumentSubmission.findOne({
      'documents._id': documentId
    });
    
    if (!submission) {
      return res.status(404).json({
        success: false,
        message: 'Submission not found for the given document ID'
      });
    }
    
    // Find the document in the submission
    const docIndex = submission.documents.findIndex(doc => doc._id.toString() === documentId);
    
    if (docIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Document not found in submission'
      });
    }
    
    // Update the document status and simulate a new file
    submission.documents[docIndex].status = 'resubmitted';
    submission.documents[docIndex].uploadDate = Date.now();
    
    // For testing: Update the document to point to a different file (simulating resubmission)
    const uploadsPath = path.join(__dirname, '../uploads');
    const newFileName = 'vendor_agreement-1750095807715-40690664.pdf';
    const newFilePath = path.join(uploadsPath, newFileName);
    
    // Update document properties to point to the new file
    submission.documents[docIndex].fileName = newFileName;
    submission.documents[docIndex].filePath = newFilePath;
    submission.documents[docIndex].documentName = 'RESUBMITTED-Vendor-Agreement.pdf';
    submission.documents[docIndex].fileType = 'pdf';
    
    // Update last modified date
    submission.lastModifiedDate = Date.now();
    
    // Save the submission
    await submission.save();
    
    console.log(`Document ${documentId} status updated to resubmitted`);
    
    return res.status(200).json({
      success: true,
      message: `Document status updated to resubmitted`,
      data: {
        documentId: documentId,
        newStatus: 'resubmitted',
        submissionId: submission.submissionId
      }
    });
  } catch (error) {
    console.error('Error setting document to resubmitted:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// @desc    Update individual document status (for frontend compatibility)
// @route   PUT /api/documents/:documentId/status
// @access  Private (Consultant/Admin)
exports.updateIndividualDocumentStatus = async (req, res) => {
  try {
    const { documentId, id } = req.params;
    const { status, reviewNotes } = req.body;
    
    // Use documentId if available, otherwise use id (for compatibility with different route patterns)
    const docId = documentId || id;
    
    console.log(`Updating document ${docId} status to ${status}`);
    
    if (!docId) {
      return res.status(400).json({
        success: false,
        message: 'Document ID is required'
      });
    }
    
    if (!status) {
      return res.status(400).json({
        success: false,
        message: 'Status is required'
      });
    }
    
    // Find submission containing the document
    const submission = await DocumentSubmission.findOne({
      'documents._id': docId
    });
    
    if (!submission) {
      return res.status(404).json({
        success: false,
        message: 'Document not found'
      });
    }
    
    // Find the document in the submission
    const docIndex = submission.documents.findIndex(doc => doc._id.toString() === docId);
    
    if (docIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Document not found in submission'
      });
    }
    
    // Update the document
    submission.documents[docIndex].status = status;
    submission.documents[docIndex].reviewDate = Date.now();
    submission.documents[docIndex].reviewedBy = req.user.id;
    
    if (reviewNotes) {
      submission.documents[docIndex].consultantRemarks = reviewNotes;
    }
    
    // Update submission status based on document statuses
    const documentStatuses = submission.documents.map(doc => doc.status);
    const hasRejected = documentStatuses.includes('rejected');
    const hasResubmitted = documentStatuses.includes('resubmitted');
    const hasPending = documentStatuses.includes('uploaded') || documentStatuses.includes('pending');
    const hasUnderReview = documentStatuses.includes('under_review');
    const allApproved = documentStatuses.every(status => status === 'approved');
    
    if (allApproved) {
      submission.submissionStatus = 'fully_approved';
      submission.finalApprovedBy = req.user.id;
      submission.finalApprovedDate = Date.now();
    } else if (hasRejected || hasResubmitted) {
      submission.submissionStatus = 'requires_resubmission';
    } else if (hasUnderReview) {
      submission.submissionStatus = 'under_review';
    } else if (hasPending) {
      submission.submissionStatus = 'submitted';
    } else {
      submission.submissionStatus = 'partially_approved';
    }
    
    submission.lastModifiedDate = Date.now();
    
    // Save the submission
    await submission.save();
    
    console.log(`Document ${docId} status updated to ${status}, submission status: ${submission.submissionStatus}`);
    
    return res.status(200).json({
      success: true,
      message: 'Document status updated successfully',
      data: {
        documentId: docId,
        status: status,
        submissionStatus: submission.submissionStatus
      }
    });
  } catch (error) {
    console.error('Error updating individual document status:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Helper function to create document upload notifications
const createDocumentUploadNotification = async (submission, documentType, actionType, vendorId) => {
  try {
    // Find the vendor user to populate name
    const vendor = await User.findById(vendorId);
    
    // Find the assigned consultant
    const consultant = await User.findById(submission.consultant);
    
    if (!consultant) {
      console.error('No consultant assigned to this submission');
      return;
    }

    // Create notification for the consultant
    const consultantNotification = await Notification.create({
      recipient: consultant._id,
      sender: vendorId,
      type: actionType === 'resubmitted' ? 'document_resubmitted' : 'document_submission',
      title: `Document ${actionType === 'resubmitted' ? 'Resubmitted' : 'Uploaded'}`,
      message: `${vendor.name} has ${actionType} ${getDocumentTypeLabel(documentType)} for ${submission.year}/${submission.month}. Please review the document.`,
      relatedDocument: submission._id,
      priority: 'medium'
    });

    // Send real-time notification to consultant
    socketService.sendToUser(consultant._id.toString(), 'notification', {
      type: 'notification',
      data: {
        ...consultantNotification.toObject(),
        relatedDocument: {
          _id: submission._id,
          title: `${submission.year}/${submission.month} - ${getDocumentTypeLabel(documentType)}`,
          status: 'pending',
          vendorName: vendor.name,
          documentType: getDocumentTypeLabel(documentType),
          submissionDate: new Date().toISOString()
        }
      }
    });

    console.log(`Notification sent to consultant ${consultant.name} for document ${actionType} by ${vendor.name}`);
  } catch (error) {
    console.error('Error creating document upload notification:', error);
  }
};

// Helper function to create document review notifications (for vendors)
const createDocumentReviewNotification = async (submission, documentType, action, remarks, consultantId, vendorId) => {
  try {
    // Find the consultant and vendor
    const consultant = await User.findById(consultantId);
    const vendor = await User.findById(vendorId);
    
    if (!vendor) {
      console.error('Vendor not found');
      return;
    }

    // Create notification for the vendor
    const vendorNotification = await Notification.create({
      recipient: vendorId,
      sender: consultantId,
      type: action === 'approved' ? 'document_approved' : 'document_rejected',
      title: `Document ${action === 'approved' ? 'Approved' : 'Rejected'}`,
      message: `Your ${getDocumentTypeLabel(documentType)} for ${submission.year}/${submission.month} has been ${action} by ${consultant.name}. ${remarks ? 'Remarks: ' + remarks : ''}`,
      relatedDocument: submission._id,
      priority: action === 'rejected' ? 'high' : 'medium'
    });

    // Send real-time notification to vendor
    socketService.sendToUser(vendorId.toString(), 'notification', {
      type: 'notification',
      data: {
        ...vendorNotification.toObject(),
        relatedDocument: {
          _id: submission._id,
          title: `${submission.year}/${submission.month} - ${getDocumentTypeLabel(documentType)}`,
          status: action,
          consultantName: consultant.name,
          documentType: getDocumentTypeLabel(documentType),
          remarks: remarks || '',
          reviewDate: new Date().toISOString()
        }
      }
    });

    console.log(`Notification sent to vendor ${vendor.name} for document ${action} by ${consultant.name}`);
  } catch (error) {
    console.error('Error creating document review notification:', error);
  }
};

// Helper function to create completion/verification notifications (for admins)
const createCompletionNotification = async (submission, consultantId, notificationType, message) => {
  try {
    // Find all admins
    const admins = await User.find({ role: 'admin', isActive: true });
    const consultant = await User.findById(consultantId);
    
    if (!consultant) {
      console.error('Consultant not found');
      return;
    }

    // Create notifications for all admins
    const adminNotificationPromises = admins.map(async admin => {
      const adminNotification = await Notification.create({
        recipient: admin._id,
        sender: consultantId,
        type: 'workflow_update',
        title: notificationType === 'completion' ? 'Submission Review Completed' : 'Document Verification Report',
        message: `${consultant.name} has completed review of ${submission.year}/${submission.month} submission. ${message}`,
        relatedDocument: submission._id,
        priority: 'low'
      });

      // Send real-time notification to admin
      socketService.sendToUser(admin._id.toString(), 'notification', {
        type: 'notification',
        data: {
          ...adminNotification.toObject(),
          relatedDocument: {
            _id: submission._id,
            title: `${submission.year}/${submission.month} - Review Completed`,
            status: 'completed',
            consultantName: consultant.name,
            completionDate: new Date().toISOString()
          }
        }
      });

      return adminNotification;
    });

    await Promise.all(adminNotificationPromises);
    console.log(`Completion notification sent to ${admins.length} admins by ${consultant.name}`);
  } catch (error) {
    console.error('Error creating completion notification:', error);
  }
};

// Helper function to get document type label
const getDocumentTypeLabel = (documentType) => {
  const labels = {
    'INVOICE': 'Invoice',
    'FORM_T_MUSTER_ROLL': 'Form T Muster Roll',
    'BANK_STATEMENT': 'Bank Statement',
    'ECR': 'ECR',
    'PF_COMBINED_CHALLAN': 'PF Combined Challan',
    'PF_TRRN_DETAILS': 'PF TRRN Details',
    'ESI_CONTRIBUTION_HISTORY': 'ESI Contribution History',
    'ESI_CHALLAN': 'ESI Challan',
    'PROFESSIONAL_TAX_RETURNS': 'Professional Tax Returns',
    'LABOUR_WELFARE_FUND': 'Labour Welfare Fund',
    'VENDOR_AGREEMENT': 'Vendor Agreement',
    'EPF_CODE_LETTER': 'EPF Code Letter',
    'EPF_FORM_5A': 'EPF Form 5A',
    'ESIC_REGISTRATION': 'ESIC Registration',
    'PT_REGISTRATION': 'PT Registration',
    'PT_ENROLLMENT': 'PT Enrollment',
    'CONTRACT_LABOUR_LICENSE': 'Contract Labour License',
    'ADDITIONAL_DOCUMENT': 'Additional Document'
  };
  return labels[documentType] || documentType;
};

// Export notification functions for use in other controllers
module.exports.createDocumentReviewNotification = createDocumentReviewNotification;
module.exports.createCompletionNotification = createCompletionNotification;


