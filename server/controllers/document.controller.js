const DocModel = require('../models/document.model');
const Workflow = require('../models/workflow.model');
const Notification = require('../models/notification.model');
const User = require('../models/user.model');
const emailService = require('../utils/emailService');
const fileUpload = require('../utils/fileUpload');
const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');

// Import documentSubmission model if it exists
let DocumentSubmission;
try {
  DocumentSubmission = require('../models/documentSubmission.model');
} catch (err) {
  console.log('documentSubmission.model not found, some features may be limited');
}

// Check if a document exists
exports.checkDocumentExists = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Document ID is required'
      });
    }
    
    console.log(`Checking if document with ID ${id} exists`);
    
    // Check if ID is a valid MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      console.log(`Invalid MongoDB ObjectId: ${id}`);
      return res.status(404).json({
        success: false,
        exists: false,
        message: 'Invalid document ID format'
      });
    }
    
    // Try to find the document in DocModel
    let documentExists = false;
    
    // Check in DocModel
    const docExists = await DocModel.exists({ _id: id });
    if (docExists) {
      console.log(`Document found in DocModel with ID: ${id}`);
      documentExists = true;
    }
    
    // If not found and DocumentSubmission model exists, check there
    if (!documentExists && DocumentSubmission) {
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

// View file endpoint
exports.viewFile = async (req, res) => {
  try {
    const { filePath } = req.query;

    if (!filePath) {
      return res.status(400).json({
        success: false,
        message: 'File path is required'
      });
    }

    console.log('Requested file path:', filePath);

    // Check if this is a document ID instead of a file path
    if (filePath.match(/^[0-9a-fA-F]{24}$/)) {
      console.log('This appears to be a document ID, trying to find the document');
      try {
        // Try to find the document in the database
        const DocModel = require('../models/document.model');
        const DocumentSubmission = require('../models/documentSubmission.model');
        
        // First try to find a document with this ID
        let document = await DocModel.findById(filePath);
        
        if (document) {
          console.log('Found document in Document model:', document._id);
          
          if (document.filePath) {
            console.log('Using file path from document:', document.filePath);
            filePath = document.filePath;
          } else if (document.files && document.files.length > 0) {
            console.log('Using file path from document files array:', document.files[0].path);
            filePath = document.files[0].path;
          }
        } else {
          // If not found in Document model, try DocumentSubmission
          console.log('Document not found in Document model, trying DocumentSubmission');
          
          // First try to find a submission with this ID
          let submission = await DocumentSubmission.findById(filePath);
          
          if (!submission) {
            // If not found, try to find a submission containing a document with this ID
            submission = await DocumentSubmission.findOne({
              'documents._id': filePath
            });
          }
          
          if (submission) {
            console.log('Found submission:', submission._id);
            
            // If this is a document ID, find the document in the submission
            let targetDocument = null;
            
            if (submission._id.toString() === filePath) {
              // If the submission ID matches, use the first document
              if (submission.documents && submission.documents.length > 0) {
                targetDocument = submission.documents[0];
                console.log('Using first document in submission:', targetDocument.documentType);
              }
            } else {
              // Find the specific document with this ID
              targetDocument = submission.documents.find(doc => doc._id.toString() === filePath);
              console.log('Found specific document:', targetDocument?.documentType);
            }
            
            if (targetDocument && targetDocument.filePath) {
              console.log('Using file path from document:', targetDocument.filePath);
              // Use the file path from the document
              filePath = targetDocument.filePath;
            } else if (targetDocument && targetDocument.fileName) {
              // If no filePath but we have fileName, construct a path
              filePath = path.join('uploads', 'documents', targetDocument.fileName);
              console.log('Constructed file path from fileName:', filePath);
            } else {
              console.log('No valid file path found in document');
            }
          } else {
            console.log('No submission found with this ID');
          }
        }
      } catch (dbError) {
        console.error('Error searching for document in database:', dbError);
      }
    }

    // Handle Windows absolute paths (D:\path\to\file)
    if (filePath.match(/^[A-Z]:\\/i)) {
      console.log('Detected Windows absolute path');
      // Extract just the filename from the Windows path
      const fileName = path.basename(filePath);
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
          filePath = matchingFiles[0];
          console.log('Found matching file for Windows path:', filePath);
        } else {
          console.log('No matching files found for Windows path');
        }
      } catch (searchError) {
        console.error('Error searching for Windows path file:', searchError);
      }
    }

    // Normalize the path to prevent directory traversal attacks
    const normalizedPath = path.normalize(filePath).replace(/^\/+/, '');
    console.log('Normalized path:', normalizedPath);

    // Extract the filename from the path
    const fileName = path.basename(normalizedPath);
    console.log('Extracted filename:', fileName);

    // Try multiple possible locations for the file
    const possiblePaths = [
      // Original paths
      filePath, // Try the exact path first
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

// Upload multiple files for a document
exports.uploadDocumentFiles = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please upload at least one file'
      });
    }

    // Check file type validation
    const allowedFileTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation'];
    const invalidFiles = req.files.filter(file => !allowedFileTypes.includes(file.mimetype));
    if (invalidFiles.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'One or more files have invalid file types',
        files: invalidFiles.map(file => file.originalname)
      });
    }

    // Check file size limits
    const maxSize = 10 * 1024 * 1024; // 10MB
    const oversizedFiles = req.files.filter(file => file.size > maxSize);
    if (oversizedFiles.length > 0) {
      return res.status(400).json({
        success: false,
        message: `One or more files exceed the maximum size limit of ${maxSize} bytes`,
        files: oversizedFiles.map(file => file.originalname)
      });
    }

    // Get vendor ID from authenticated user
    const vendorId = req.user.id;

    if (req.user.role !== 'vendor') {
      return res.status(403).json({
        success: false,
        message: 'Only vendors can upload documents'
      });
    }

    // Get document details
    const { title, description, documentType, expiryDate } = req.body;
    
    if (!title || !documentType) {
      return res.status(400).json({
        success: false,
        message: 'Title and document type are required'
      });
    }
    
    // Validate document type
    const validDocTypes = ['registration', 'compliance', 'financial', 'technical', 'other'];
    if (!validDocTypes.includes(documentType) && documentType !== 'other') {
      return res.status(400).json({
        success: false,
        message: 'Invalid document type'
      });
    }

    // Process the uploaded files
    const files = req.files.map(file => ({
      path: `/uploads/${file.filename}`,
      originalName: file.originalname,
      mimeType: file.mimetype,
      size: file.size
    }));

    // Create document record
    const document = await DocModel.create({
      title,
      description,
      documentType,
      expiryDate: expiryDate || null,
      files: files,
      vendor: vendorId,
      status: 'pending',
      submissionDate: new Date()
    });
    
    // Get vendor details for the document
    const vendor = await User.findById(vendorId).select('name company email');
    if (vendor) {
      document.vendorName = vendor.name;
      document.companyName = vendor.company;
      await document.save();
    }

    // Create workflow for document
    const workflow = await Workflow.create({
      document: document._id,
      vendor: vendorId,
      stages: [
        {
          name: 'submission',
          status: 'completed',
          startDate: new Date(),
          completionDate: new Date()
        },
        {
          name: 'consultant_review',
          status: 'pending'
        },
        {
          name: 'cross_verification',
          status: 'pending'
        },
        {
          name: 'final_approval',
          status: 'pending'
        }
      ],
      currentStage: 'consultant_review'
    });

    // Create notifications (wrapped in try-catch to prevent errors from blocking success response)
    try {
      // Find consultants for notification
      const consultants = await User.find({ role: 'consultant' });
      

      // Create notifications for consultants
      if (consultants.length > 0) {
        const notificationPromises = consultants.map(consultant => {
          return Notification.create({
            recipient: consultant._id,
            sender: vendorId,
            type: 'document_submission',
            title: 'New Document Submitted',
            message: `A new document "${title}" has been submitted by ${vendor?.name || 'Unknown'} (${vendor?.company || 'Unknown Company'}) for review.`,
            relatedDocument: document._id,
            relatedWorkflow: workflow._id,
            priority: 'high',
            actionUrl: `/documents/${document._id}`
          });
        });

        await Promise.all(notificationPromises);
      }
      
      // Create notifications for all admins
      const admins = await User.find({ role: 'admin' });
      if (admins.length > 0) {
        const adminNotificationPromises = admins.map(admin => {
          return Notification.create({
            recipient: admin._id,
            sender: vendorId,
            type: 'document_submission',
            title: 'New Document Submitted',
            message: `A new document "${title}" has been submitted by ${vendor?.name || 'Unknown'} (${vendor?.company || 'Unknown Company'}) for review.`,
            relatedDocument: document._id,
            isRead: false
          });
        });
        
        await Promise.all(adminNotificationPromises);
      }

      // Notification for the vendor
      await Notification.create({
        recipient: vendorId,
        sender: null, // System notification
        type: 'system',
        title: 'Document Submitted Successfully',
        message: `Your document "${title}" has been submitted successfully and is pending review.`,
        relatedDocument: document._id,
        isRead: false
      });
    } catch (notificationError) {
      console.error('Error creating notifications:', notificationError);
      // Continue with success response even if notifications fail
    }

    // Return success response with document data
    return res.status(201).json({
      success: true,
      data: document,
      workflow,
      message: 'Document uploaded successfully and is pending review'
    });
  } catch (error) {
    console.error('Document upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Could not upload document',
      error: error.message
    });
  }
};

// Upload a document
exports.uploadDocument = async (req, res) => {
  try {
    // Debug logging
    console.log('Upload document request received');
    console.log('Request headers:', req.headers);
    console.log('Content-Type:', req.headers['content-type']);
    console.log('Body keys:', Object.keys(req.body));
    
    // Get vendor ID from authenticated user
    const vendorId = req.user.id;
    console.log('Vendor ID:', vendorId);
    
    // Log file information
    console.log('req.file:', req.file ? 'Present' : 'Not present');
    console.log('req.files:', req.files ? `Present (${req.files.length})` : 'Not present');
    
    // Check if files are present in the request
    if (!req.files || req.files.length === 0) {
      console.log('No files found in request');
      return res.status(400).json({
        success: false,
        message: 'Please upload at least one file'
      });
    }
    
    console.log(`Found ${req.files.length} files in request`);
    
    // Get document details from request body
    const { 
      title, 
      description, 
      documentType, 
      expiryDate,
      invoiceNumber,
      agreementPeriod,
      consultant,
      workLocation,
      isReupload,
      originalDocumentId,
      documentId
    } = req.body;
    
    // Validate required fields
    if (!title) {
      console.log('Missing title');
      return res.status(400).json({
        success: false,
        message: 'Document title is required'
      });
    }
    
    if (!documentType) {
      console.log('Missing document type');
      return res.status(400).json({
        success: false,
        message: 'Document type is required'
      });
    }
    
    // Process files
    const files = req.files.map(file => ({
      path: `/uploads/${file.filename}`,
      originalName: file.originalname,
      mimeType: file.mimetype,
      size: file.size
    }));
    
    console.log('Processed files:', files);
    
    // Check if this is a reupload
    const reuploadId = originalDocumentId || documentId;
    if (isReupload === 'true' && reuploadId) {
      console.log(`This is a reupload for document ID: ${reuploadId}`);
      
      // Try to find the original document
      let originalDocument = null;
      
      // First check in DocModel
      try {
        originalDocument = await DocModel.findById(reuploadId);
        if (originalDocument) {
          console.log('Found original document in DocModel');
          
          // Update the existing document with new files and mark as resubmitted
          originalDocument.files = files;
          originalDocument.status = 'pending'; // Reset status to pending for re-review
          originalDocument.submissionDate = new Date();
          originalDocument.version = (originalDocument.version || 1) + 1;
          
          // Add to revision history
          if (!originalDocument.revisionHistory) {
            originalDocument.revisionHistory = [];
          }
          originalDocument.revisionHistory.push({
            version: originalDocument.version,
            files: files,
            updatedBy: vendorId,
            updatedAt: new Date(),
            notes: 'Document resubmitted after rejection'
          });
          
          await originalDocument.save();
          
          // Update workflow to restart the review process
          const workflow = await Workflow.findOne({ document: originalDocument._id });
          if (workflow) {
            workflow.currentStage = 'consultant_review';
            workflow.resubmissionCount = (workflow.resubmissionCount || 0) + 1;
            
            // Reset all stages except submission
            workflow.stages.forEach(stage => {
              if (stage.name !== 'submission') {
                stage.status = 'pending';
                stage.startDate = null;
                stage.completionDate = null;
                stage.comments = null;
              }
            });
            
            await workflow.save();
            console.log('Updated workflow for resubmission');
          }
          
          // Create notifications for the resubmission
          try {
            // Find consultants for notification
            const consultants = await User.find({ role: 'consultant' });
            
            if (consultants.length > 0) {
              const notificationPromises = consultants.map(consultant => {
                return Notification.create({
                  recipient: consultant._id,
                  sender: vendorId,
                  type: 'document_submission',
                  title: 'Document Resubmitted',
                  message: `Document "${originalDocument.title}" has been resubmitted by ${originalDocument.vendorName || 'vendor'} for review.`,
                  relatedDocument: originalDocument._id,
                  relatedWorkflow: workflow?._id,
                  priority: 'high',
                  actionUrl: `/documents/${originalDocument._id}`
                });
              });

              await Promise.all(notificationPromises);
              console.log('Created notifications for consultants about resubmission');
            }
            
            // Notification for the vendor
            await Notification.create({
              recipient: vendorId,
              sender: null,
              type: 'system',
              title: 'Document Resubmitted Successfully',
              message: `Your document "${originalDocument.title}" has been resubmitted successfully and is pending review.`,
              relatedDocument: originalDocument._id,
              isRead: false
            });
          } catch (notificationError) {
            console.error('Error creating notifications for resubmission:', notificationError);
          }
          
          return res.status(200).json({
            success: true,
            data: originalDocument,
            workflow,
            message: 'Document resubmitted successfully and is pending review'
          });
        }
      } catch (docError) {
        console.log('Error finding document in DocModel:', docError.message);
      }
      
      // If not found in DocModel, check DocumentSubmission
      if (!originalDocument && DocumentSubmission) {
        try {
          console.log('Checking DocumentSubmission model for reupload');
          
          // Find submission containing the document
          const submission = await DocumentSubmission.findOne({
            'documents._id': reuploadId
          });
          
          if (submission) {
            console.log('Found submission containing the document');
            
            // Find the specific document in the submission
            const docIndex = submission.documents.findIndex(doc => doc._id.toString() === reuploadId);
            
            if (docIndex !== -1) {
              // Update the document in the submission
              submission.documents[docIndex].filePath = files[0].path;
              submission.documents[docIndex].fileName = files[0].originalName;
              submission.documents[docIndex].status = 'resubmitted';
              submission.documents[docIndex].submissionDate = new Date();
              
              await submission.save();
              
              return res.status(200).json({
                success: true,
                data: submission.documents[docIndex],
                message: 'Document resubmitted successfully in submission'
              });
            }
          }
        } catch (submissionError) {
          console.log('Error finding document in DocumentSubmission:', submissionError.message);
        }
      }
      
      console.log('Original document not found, creating new document with resubmission flag');
    }
    
    // Create document record (new document or fallback for reupload)
    const document = await DocModel.create({
      title: isReupload === 'true' ? `[RESUBMITTED] ${title}` : title,
      description: isReupload === 'true' ? 
        `${description} - This is a resubmitted document (Original ID: ${reuploadId})` : 
        description,
      documentType,
      expiryDate: expiryDate || null,
      files,
      vendor: vendorId,
      status: 'pending',
      submissionDate: new Date(),
      metadata: {
        invoiceNumber: invoiceNumber || '',
        agreementPeriod: agreementPeriod || '',
        consultant: consultant || '',
        workLocation: workLocation || '',
        isResubmission: isReupload === 'true',
        originalDocumentId: reuploadId || null
      }
    });
    
    console.log('Document created with ID:', document._id);
    
    // Get vendor details for the document
    const vendor = await User.findById(vendorId).select('name company email');
    if (vendor) {
      document.vendorName = vendor.name;
      document.companyName = vendor.company;
      await document.save();
      console.log('Updated document with vendor details');
    }
    
    // Create workflow for document
    const workflow = await Workflow.create({
      document: document._id,
      vendor: vendorId,
      stages: [
        {
          name: 'submission',
          status: 'completed',
          startDate: new Date(),
          completionDate: new Date()
        },
        {
          name: 'consultant_review',
          status: 'pending'
        },
        {
          name: 'cross_verification',
          status: 'pending'
        },
        {
          name: 'final_approval',
          status: 'pending'
        }
      ],
      currentStage: 'consultant_review'
    });
    
    console.log('Created workflow for document');
    
    // Create notifications (wrapped in try-catch to prevent errors from blocking success response)
    try {
      // Find consultants for notification
      const consultants = await User.find({ role: 'consultant' });
      
      // Create notifications for consultants
      if (consultants.length > 0) {
        const notificationPromises = consultants.map(consultant => {
          return Notification.create({
            recipient: consultant._id,
            sender: vendorId,
            type: 'document_submission',
            title: isReupload === 'true' ? 'Document Resubmitted' : 'New Document Submitted',
            message: isReupload === 'true' ? 
              `A document "${title}" has been resubmitted by ${vendor?.name || 'Unknown'} (${vendor?.company || 'Unknown Company'}) for review.` :
              `A new document "${title}" has been submitted by ${vendor?.name || 'Unknown'} (${vendor?.company || 'Unknown Company'}) for review.`,
            relatedDocument: document._id,
            relatedWorkflow: workflow._id,
            priority: 'high',
            actionUrl: `/documents/${document._id}`
          });
        });

        await Promise.all(notificationPromises);
        console.log('Created notifications for consultants');
      }
      
      // Create notifications for all admins
      const admins = await User.find({ role: 'admin' });
      if (admins.length > 0) {
        const adminNotificationPromises = admins.map(admin => {
          return Notification.create({
            recipient: admin._id,
            sender: vendorId,
            type: 'document_submission',
            title: isReupload === 'true' ? 'Document Resubmitted' : 'New Document Submitted',
            message: isReupload === 'true' ? 
              `A document "${title}" has been resubmitted by ${vendor?.name || 'Unknown'} (${vendor?.company || 'Unknown Company'}) for review.` :
              `A new document "${title}" has been submitted by ${vendor?.name || 'Unknown'} (${vendor?.company || 'Unknown Company'}) for review.`,
            relatedDocument: document._id,
            isRead: false
          });
        });
        
        await Promise.all(adminNotificationPromises);
        console.log('Created notifications for admins');
      }

      // Notification for the vendor
      await Notification.create({
        recipient: vendorId,
        sender: null, // System notification
        type: 'system',
        title: isReupload === 'true' ? 'Document Resubmitted Successfully' : 'Document Submitted Successfully',
        message: isReupload === 'true' ? 
          `Your document "${title}" has been resubmitted successfully and is pending review.` :
          `Your document "${title}" has been submitted successfully and is pending review.`,
        relatedDocument: document._id,
        isRead: false
      });
      
      console.log('Created notification for vendor');
    } catch (notificationError) {
      console.error('Error creating notifications:', notificationError);
      // Continue with success response even if notifications fail
    }

    // Send email notifications (wrapped in try-catch to prevent errors from blocking success response)
    let emailResults = null;
    try {
      // Get assigned consultant for the vendor
      const vendorDetails = await User.findById(vendorId).populate('assignedConsultant', 'name email');
      let consultant = null;

      if (vendorDetails && vendorDetails.assignedConsultant) {
        consultant = vendorDetails.assignedConsultant;
      } else {
        // If no assigned consultant, find the first available consultant
        consultant = await User.findOne({ role: 'consultant' }).select('name email');
      }

      if (consultant) {
        // Send upload confirmation emails
        emailResults = await emailService.sendDocumentUploadEmails(document, vendorDetails, consultant);
        
        if (emailResults.success) {
          console.log('Upload confirmation emails sent successfully');
        } else {
          console.error('Failed to send upload confirmation emails:', emailResults.error);
        }
      } else {
        console.warn('No consultant found to send document upload notification');
      }
    } catch (emailError) {
      console.error('Error sending upload confirmation emails:', emailError);
      // Continue with success response even if email fails
    }

    // Return success response with document data
    return res.status(201).json({
      success: true,
      data: document,
      workflow,
      emailStatus: emailResults,
      message: 'Document uploaded successfully and is pending review'
    });
  } catch (error) {
    console.error('Document upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Could not upload document',
      error: error.message
    });
  }
};

// Get all documents (with filtering)
exports.getDocuments = async (req, res) => {
  try {
    let query = {};

    // Role-based filtering
    if (req.user.role === 'vendor') {
      // Vendors can only see their own documents
      query.vendor = req.user.id;
    } else if (req.user.role === 'consultant') {
      // Consultants can only see documents from vendors assigned to them
      // First, find all vendors assigned to this consultant
      const User = require('../models/user.model');
      const assignedVendors = await User.find({ 
        assignedConsultant: req.user.id,
        role: 'vendor'
      }).select('_id');
      
      // Get array of vendor IDs
      const vendorIds = assignedVendors.map(vendor => vendor._id);
      
      // Add vendor filter to query
      if (vendorIds.length > 0) {
        query.vendor = { $in: vendorIds };
      } else {
        // If no vendors are assigned, return empty result
        query.vendor = null;
      }
      
      // Additional filters for consultants
      if (req.query.reviewStatus) {
        query.status = req.query.reviewStatus;
      }
      if (req.query.assignedToMe) {
        query.reviewer = req.user.id;
      }
    }

    // Additional filters
    if (req.query.status) {
      query.status = req.query.status;
    }
    if (req.query.documentType) {
      query.documentType = req.query.documentType;
    }
    if (req.query.vendorId && req.user.role !== 'vendor') {
      query.vendor = req.query.vendorId;
    }
    
    // Year and Month filters
    if (req.query.year && req.query.month) {
      const year = parseInt(req.query.year);
      const month = parseInt(req.query.month);
      
      // Create date range for the specified month and year
      const startDate = new Date(year, month - 1, 1); // Month is 0-indexed in JavaScript Date
      const endDate = new Date(year, month, 0, 23, 59, 59, 999); // Last day of the month at 23:59:59.999
      
      // Check date fields and uploadPeriod for DocumentSubmission
      query.$or = [
        // Check createdAt
        { 
          createdAt: {
            $gte: startDate,
            $lte: endDate
          }
        },
        // Check submissionDate
        { 
          submissionDate: {
            $gte: startDate,
            $lte: endDate
          }
        },
        // Check uploadPeriod for DocumentSubmission model
        {
          'uploadPeriod.year': year,
          'uploadPeriod.month': getMonthName(month)
        }
      ];
      
      console.log(`Filtering documents for ${month}/${year}, date range:`, startDate, 'to', endDate);
    } else if (req.query.year) {
      const year = parseInt(req.query.year);
      
      // Create date range for the specified year
      const startDate = new Date(year, 0, 1); // January 1st
      const endDate = new Date(year, 11, 31, 23, 59, 59, 999); // December 31st at 23:59:59.999
      
      // Check date fields and uploadPeriod for DocumentSubmission
      query.$or = [
        // Check createdAt
        { 
          createdAt: {
            $gte: startDate,
            $lte: endDate
          }
        },
        // Check submissionDate
        { 
          submissionDate: {
            $gte: startDate,
            $lte: endDate
          }
        },
        // Check uploadPeriod for DocumentSubmission model
        {
          'uploadPeriod.year': year
        }
      ];
      
      console.log(`Filtering documents for year ${year}, date range:`, startDate, 'to', endDate);
    }
    
    // Helper function to convert month number to name
    function getMonthName(monthNum) {
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      // Adjust for 1-based month input
      return months[(monthNum - 1) % 12];
    }

    // Search by title or description
    if (req.query.search) {
      // If we already have an $or condition for date filtering
      if (query.$or) {
        // Save the existing date filters
        const dateFilters = query.$or;
        
        // Create a new $and condition that combines date filters with search filters
        query.$and = [
          { $or: dateFilters },
          { $or: [
            { title: { $regex: req.query.search, $options: 'i' } },
            { description: { $regex: req.query.search, $options: 'i' } }
          ]}
        ];
        
        // Remove the original $or since it's now in the $and
        delete query.$or;
      } else {
        // If no date filters, just use the search filters directly
        query.$or = [
          { title: { $regex: req.query.search, $options: 'i' } },
          { description: { $regex: req.query.search, $options: 'i' } }
        ];
      }
    }

    // Pagination
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    // Get total count of documents from active vendors only
    const activeVendorDocuments = await DocModel.aggregate([
      { $match: query },
      {
        $lookup: {
          from: 'users',
          localField: 'vendor',
          foreignField: '_id',
          as: 'vendorInfo'
        }
      },
      {
        $match: {
          'vendorInfo.isActive': { $ne: false }
        }
      },
      { $count: 'total' }
    ]);
    
    const total = activeVendorDocuments.length > 0 ? activeVendorDocuments[0].total : 0;

    // Get documents with vendor and reviewer info, excluding deactivated vendors
    const allDocuments = await DocModel.find(query)
      .populate({
        path: 'vendor',
        select: 'name email company isActive',
        match: { isActive: { $ne: false } }
      })
      .populate('reviewer', 'name email')
      .sort({ createdAt: -1 })
      .skip(startIndex)
      .limit(limit);

    // Filter out documents where vendor is null (deactivated users)
    const documents = allDocuments.filter(doc => doc.vendor !== null);

    // Pagination result
    const pagination = {};

    if (endIndex < total) {
      pagination.next = {
        page: page + 1,
        limit
      };
    }

    if (startIndex > 0) {
      pagination.prev = {
        page: page - 1,
        limit
      };
    }

    res.status(200).json({
      success: true,
      count: documents.length,
      pagination,
      data: documents,
      total
    });
  } catch (error) {
    console.error('Get documents error:', error);
    res.status(500).json({
      success: false,
      message: 'Could not fetch documents',
      error: error.message
    });
  }
};

// Get a single document
exports.getDocument = async (req, res) => {
  try {
    console.log(`Getting document with ID: ${req.params.id}`);
    
    // First try to find the document in the DocModel
    let document = await DocModel.findById(req.params.id)
      .populate('vendor', 'name email company phone')
      .populate('reviewer', 'name email');

    if (!document) {
      console.log(`Document not found in DocModel, checking documentSubmission model`);
      
      // If not found, try to find it in the documentSubmission model
      const DocumentSubmission = require('../models/documentSubmission.model');
      
      // First check if this is a submission ID
      const submission = await DocumentSubmission.findById(req.params.id)
        .populate('vendor', 'name email company phone')
        .populate('consultant', 'name email');
      
      if (submission) {
        console.log(`Found submission with ID: ${req.params.id}`);
        // Return the first document in the submission
        if (submission.documents && submission.documents.length > 0) {
          // Create a document-like response from the submission
          document = {
            _id: submission._id,
            title: `Submission ${submission.submissionId || submission._id}`,
            description: `Vendor: ${submission.vendor?.name || submission.vendor}`,
            status: submission.submissionStatus,
            files: submission.documents.map(doc => ({
              name: doc.documentName,
              path: doc.filePath || doc.fileName,
              type: doc.fileType,
              size: doc.fileSize,
              uploadDate: doc.uploadDate
            })),
            vendor: submission.vendor,
            consultant: submission.consultant,
            uploadDate: submission.createdAt,
            submissionDate: submission.submissionDate || submission.createdAt,
            lastModifiedDate: submission.updatedAt,
            documents: submission.documents
          };
        }
      } else {
        // Try to find a submission containing a document with this ID
        const submissionWithDoc = await DocumentSubmission.findOne({
          'documents._id': req.params.id
        }).populate('vendor', 'name email company phone')
          .populate('consultant', 'name email');
        
        if (submissionWithDoc) {
          console.log(`Found submission containing document with ID: ${req.params.id}`);
          // Find the specific document in the submission
          const targetDoc = submissionWithDoc.documents.find(
            doc => doc._id.toString() === req.params.id
          );
          
          if (targetDoc) {
            // Create a document-like response from the specific document
            document = {
              _id: targetDoc._id,
              title: targetDoc.documentName || targetDoc.documentType,
              description: `Document Type: ${targetDoc.documentType}`,
              status: targetDoc.status,
              files: [{
                name: targetDoc.documentName,
                path: targetDoc.filePath || targetDoc.fileName,
                type: targetDoc.fileType,
                size: targetDoc.fileSize,
                uploadDate: targetDoc.uploadDate
              }],
              vendor: submissionWithDoc.vendor,
              consultant: submissionWithDoc.consultant,
              uploadDate: targetDoc.uploadDate,
              submissionDate: submissionWithDoc.submissionDate || targetDoc.uploadDate || submissionWithDoc.createdAt,
              lastModifiedDate: submissionWithDoc.updatedAt,
              submissionId: submissionWithDoc._id,
              documentType: targetDoc.documentType
            };
          }
        }
      }
    }

    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Document not found'
      });
    }

    // Check if user is authorized to view this document
    if (req.user.role === 'vendor' && 
        document.vendor && 
        document.vendor._id && 
        document.vendor._id.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this document'
      });
    }

    // Get workflow data
    const workflow = await Workflow.findOne({ document: document._id });

    res.status(200).json({
      success: true,
      data: document,
      workflow
    });
  } catch (error) {
    console.error('Get document error:', error);
    res.status(500).json({
      success: false,
      message: 'Could not fetch document',
      error: error.message
    });
  }
};

// Update document status
exports.updateDocumentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, reviewNotes } = req.body;

    if (!['pending', 'approved', 'rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Status must be pending, approved, or rejected'
      });
    }

    // Find document to update
    const document = await DocModel.findById(id);

    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Document not found'
      });
    }

    // Update status
    document.status = status;
    
    if (reviewNotes) {
      document.reviewNotes = reviewNotes;
    }

    if (status === 'approved' || status === 'rejected') {
      document.reviewedBy = req.user.id;
      document.reviewDate = Date.now();
    }
    
    // If this was a resubmitted document being approved/rejected, clear the resubmission flag
    if (document.metadata && document.metadata.isResubmission && (status === 'approved' || status === 'rejected')) {
      document.metadata.isResubmission = false;
      document.metadata.resubmissionProcessed = true;
      document.metadata.processedDate = Date.now();
    }

    await document.save();

    // Update workflow
    const workflow = await Workflow.findOne({ document: document._id });
    
    if (workflow) {
      if (status === 'approved') {
        // Move to the next stage
        const stageIndex = workflow.stages.findIndex(stage => stage.status === 'pending');
        if (stageIndex >= 0) {
          workflow.stages[stageIndex].status = 'completed';
          workflow.stages[stageIndex].completionDate = new Date();
          
          // If there's a next stage, update currentStage
          if (stageIndex < workflow.stages.length - 1) {
            workflow.stages[stageIndex + 1].status = 'pending';
            workflow.stages[stageIndex + 1].startDate = new Date();
            workflow.currentStage = workflow.stages[stageIndex + 1].name;
          } else {
            workflow.currentStage = 'completed';
          }
        }
      } else if (status === 'rejected') {
        // Mark current stage as failed
        const stageIndex = workflow.stages.findIndex(stage => stage.status === 'pending');
        if (stageIndex >= 0) {
          workflow.stages[stageIndex].status = 'failed';
          workflow.stages[stageIndex].completionDate = new Date();
          workflow.currentStage = 'rejected';
        }
      }
      
      await workflow.save();
    }

    // Get vendor details for notification
    const vendor = await User.findById(document.vendor).select('name email');

    // Create notification for vendor
    const notificationTitle = status === 'approved' 
      ? 'Document Approved' 
      : status === 'rejected' 
        ? 'Document Rejected' 
        : 'Document Status Updated';
    
    const notificationMessage = status === 'approved'
      ? `Your document "${document.title}" has been approved.`
      : status === 'rejected'
        ? `Your document "${document.title}" has been rejected. Reason: ${reviewNotes || 'No reason provided'}`
        : `Your document "${document.title}" status has been updated to ${status}.`;

    await Notification.create({
      recipient: document.vendor,
      sender: req.user.id,
      type: status === 'approved' ? 'document_approved' : status === 'rejected' ? 'document_rejected' : 'document_review',
      title: notificationTitle,
      message: notificationMessage,
      relatedDocument: document._id,
      relatedWorkflow: workflow ? workflow._id : null,
      priority: status === 'rejected' ? 'high' : 'medium',
      actionUrl: `/documents/${document._id}`
    });

    // Send email notification for approved/rejected documents
    let emailResults = null;
    if (status === 'approved' || status === 'rejected') {
      try {
        // Get consultant details (reviewer)
        const consultant = await User.findById(req.user.id).select('name email');
        
        if (vendor && consultant) {
          if (status === 'rejected') {
            // Use dedicated rejection email service
            const documentForEmail = {
              _id: document._id,
              documentName: document.title,
              documentType: document.documentType,
              reviewComments: reviewNotes || 'No specific reason provided',
              reviewDate: Date.now(),
              status: 'rejected'
            };
            
            emailResults = await emailService.sendDocumentRejectionNotification(
              documentForEmail,
              vendor,
              consultant
            );
          } else {
            // Send approval email
            emailResults = await emailService.sendDocumentReviewEmails(
              document, 
              vendor, 
              consultant, 
              status, 
              reviewNotes
            );
          }
          
          if (emailResults.success) {
            console.log('Document review email sent successfully');
          } else {
            console.error('Failed to send document review email:', emailResults.error);
          }
        }
      } catch (emailError) {
        console.error('Error sending document review email:', emailError);
        // Continue with success response even if email fails
      }
    }

    res.status(200).json({
      success: true,
      data: document,
      workflow,
      emailStatus: emailResults,
      message: `Document status updated to ${status}`
    });
  } catch (error) {
    console.error('Update document status error:', error);
    res.status(500).json({
      success: false,
      message: 'Could not update document status',
      error: error.message
    });
  }
};

// Update document information
exports.updateDocument = async (req, res) => {
  try {
    let document = await DocModel.findById(req.params.id);

    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Document not found'
      });
    }

    // Check permission - only the vendor who uploaded or admin can update basic info
    if (req.user.role === 'vendor' && document.vendor.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this document'
      });
    }

    // Update fields
    const { title, description, documentType, expiryDate, tags } = req.body;

    if (title) document.title = title;
    if (description) document.description = description;
    if (documentType) document.documentType = documentType;
    if (expiryDate) document.expiryDate = expiryDate;
    if (tags) document.tags = tags;

    await document.save();

    res.status(200).json({
      success: true,
      data: document
    });
  } catch (error) {
    console.error('Update document error:', error);
    res.status(500).json({
      success: false,
      message: 'Could not update document',
      error: error.message
    });
  }
};

// Delete document
exports.deleteDocument = async (req, res) => {
  try {
    const document = await DocModel.findById(req.params.id);

    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Document not found'
      });
    }

    // Check permission - only the vendor who uploaded or admin can delete
    if (req.user.role === 'vendor' && document.vendor.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this document'
      });
    }

    // Delete associated workflow
    await Workflow.deleteOne({ document: document._id });

    // Delete associated notifications
    await Notification.deleteMany({ relatedDocument: document._id });

    // Delete file from filesystem
    const filePath = path.join(__dirname, '..', document.fileUrl);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    // Delete document from database
    await document.remove();

    res.status(200).json({
      success: true,
      message: 'Document deleted successfully'
    });
  } catch (error) {
    console.error('Delete document error:', error);
    res.status(500).json({
      success: false,
      message: 'Could not delete document',
      error: error.message
    });
  }
};

// Download document
exports.downloadDocument = async (req, res) => {
  try {
    const document = await DocModel.findById(req.params.id);

    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Document not found'
      });
    }

    // Check permission
    if (req.user.role === 'vendor' && document.vendor.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this document'
      });
    }

    const filePath = path.join(__dirname, '..', document.fileUrl);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        message: 'File not found'
      });
    }

    res.download(filePath, document.fileName);
  } catch (error) {
    console.error('Download document error:', error);
    res.status(500).json({
      success: false,
      message: 'Could not download document',
      error: error.message
    });
  }
};

// Download document file by file ID
exports.downloadDocumentFile = async (req, res) => {
  try {
    const fileId = req.params.fileId;

    // Find document that contains this file
    const document = await DocModel.findOne({ 
      $or: [
        { 'files._id': fileId },
        { fileUrl: new RegExp(fileId, 'i') } // For legacy single file
      ]
    });

    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'File not found'
      });
    }

    // Check permission
    if (req.user.role === 'vendor' && document.vendor.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this file'
      });
    }

    // Find the file in the document
    let filePath;
    let fileName;

    if (document.files && document.files.length > 0) {
      // Multiple files case
      const file = document.files.find(f => f._id.toString() === fileId);
      if (file) {
        filePath = path.join(__dirname, '..', file.path);
        fileName = file.originalName;
      }
    } else if (document.fileUrl) {
      // Legacy single file case
      filePath = path.join(__dirname, '..', document.fileUrl);
      fileName = document.fileName;
    }

    if (!filePath || !fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        message: 'File not found on server'
      });
    }

    // Log the download
    console.log(`User ${req.user.id} (${req.user.email}) downloaded file: ${fileName}`);

    // Send the file
    res.download(filePath, fileName);
  } catch (error) {
    console.error('Download file error:', error);
    res.status(500).json({
      success: false,
      message: 'Could not download file',
      error: error.message
    });
  }
};

// Get documents grouped by vendor
exports.getDocumentsGroupedByVendor = async (req, res) => {
  try {
    // Pagination
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const startIndex = (page - 1) * limit;
    
    // Build query based on filters
    let matchQuery = {};
    
    // Status filter
    if (req.query.status && req.query.status !== ':') {
      matchQuery.status = req.query.status;
    }
    
    // Year and Month filters
    if (req.query.year && req.query.month) {
      const year = parseInt(req.query.year);
      const month = parseInt(req.query.month);
      
      // Create date range for the specified month and year
      const startDate = new Date(year, month - 1, 1); // Month is 0-indexed in JavaScript Date
      const endDate = new Date(year, month, 0, 23, 59, 59, 999); // Last day of the month at 23:59:59.999
      
      // Check date fields and uploadPeriod for DocumentSubmission
      matchQuery.$or = [
        // Check createdAt
        { 
          createdAt: {
            $gte: startDate,
            $lte: endDate
          }
        },
        // Check submissionDate
        { 
          submissionDate: {
            $gte: startDate,
            $lte: endDate
          }
        },
        // Check uploadPeriod for DocumentSubmission model
        {
          'uploadPeriod.year': year,
          'uploadPeriod.month': getMonthName(month)
        }
      ];
      
      console.log(`Filtering vendor documents for ${month}/${year}, date range:`, startDate, 'to', endDate);
    } else if (req.query.year) {
      const year = parseInt(req.query.year);
      
      // Create date range for the specified year
      const startDate = new Date(year, 0, 1); // January 1st
      const endDate = new Date(year, 11, 31, 23, 59, 59, 999); // December 31st at 23:59:59.999
      
      // Check date fields and uploadPeriod for DocumentSubmission
      matchQuery.$or = [
        // Check createdAt
        { 
          createdAt: {
            $gte: startDate,
            $lte: endDate
          }
        },
        // Check submissionDate
        { 
          submissionDate: {
            $gte: startDate,
            $lte: endDate
          }
        },
        // Check uploadPeriod for DocumentSubmission model
        {
          'uploadPeriod.year': year
        }
      ];
      
      console.log(`Filtering vendor documents for year ${year}, date range:`, startDate, 'to', endDate);
    }
    
    // Helper function to convert month number to name
    function getMonthName(monthNum) {
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      // Adjust for 1-based month input
      return months[(monthNum - 1) % 12];
    }
    
    // Search filter
    if (req.query.search) {
      // If we already have an $or condition for date filtering
      if (matchQuery.$or) {
        // Save the existing date filters
        const dateFilters = matchQuery.$or;
        
        // Create a new $and condition that combines date filters with search filters
        matchQuery.$and = [
          { $or: dateFilters },
          { $or: [
            { 'vendor.name': { $regex: req.query.search, $options: 'i' } },
            { 'vendor.company': { $regex: req.query.search, $options: 'i' } },
            { 'vendor.email': { $regex: req.query.search, $options: 'i' } },
            { title: { $regex: req.query.search, $options: 'i' } }
          ]}
        ];
        
        // Remove the original $or since it's now in the $and
        delete matchQuery.$or;
      } else {
        // If no date filters, just use the search filters directly
        matchQuery.$or = [
          { 'vendor.name': { $regex: req.query.search, $options: 'i' } },
          { 'vendor.company': { $regex: req.query.search, $options: 'i' } },
          { 'vendor.email': { $regex: req.query.search, $options: 'i' } },
          { title: { $regex: req.query.search, $options: 'i' } }
        ];
      }
    }
    
    // Role-based filtering
    if (req.user.role === 'vendor') {
      // Vendors can only see their own documents
      matchQuery['vendor._id'] = mongoose.Types.ObjectId(req.user.id);
    } else if (req.user.role === 'consultant') {
      // Consultants can only see documents from vendors assigned to them
      // First, find all vendors assigned to this consultant
      const User = require('../models/user.model');
      const assignedVendors = await User.find({ 
        assignedConsultant: req.user.id,
        role: 'vendor'
      }).select('_id');
      
      // Get array of vendor IDs
      const vendorIds = assignedVendors.map(vendor => vendor._id.toString());
      
      // Add vendor filter to query
      if (vendorIds.length > 0) {
        matchQuery['vendor._id'] = { $in: vendorIds.map(id => mongoose.Types.ObjectId(id)) };
      } else {
        // If no vendors are assigned, return empty result
        matchQuery['vendor._id'] = null;
      }
    }
    
    // Aggregate to group documents by vendor
    const vendorsWithDocs = await DocModel.aggregate([
      // Lookup to get vendor details
      {
        $lookup: {
          from: 'users',
          localField: 'vendor',
          foreignField: '_id',
          as: 'vendorDetails'
        }
      },
      // Unwind the vendor details array
      {
        $unwind: '$vendorDetails'
      },
      // Filter out deactivated vendors
      {
        $match: {
          'vendorDetails.isActive': { $ne: false }
        }
      },
      // Project to reshape the data
      {
        $project: {
          _id: 1,
          title: 1,
          documentType: 1,
          status: 1,
          createdAt: 1,
          submissionDate: 1,
          files: 1,
          reviewNotes: 1,
          reviewDate: 1,
          vendor: {
            _id: '$vendorDetails._id',
            name: '$vendorDetails.name',
            email: '$vendorDetails.email',
            company: '$vendorDetails.company'
          }
        }
      },
      // Match based on filters
      {
        $match: matchQuery
      },
      // Group by vendor
      {
        $group: {
          _id: '$vendor._id',
          name: { $first: '$vendor.name' },
          email: { $first: '$vendor.email' },
          company: { $first: '$vendor.company' },
          documents: { 
            $push: {
              _id: '$_id',
              title: '$title',
              documentType: '$documentType',
              status: '$status',
              createdAt: '$createdAt',
              submissionDate: '$submissionDate',
              files: '$files',
              reviewNotes: '$reviewNotes',
              reviewDate: '$reviewDate'
            }
          }
        }
      },
      // Sort by vendor name
      {
        $sort: { name: 1 }
      },
      // Count total for pagination
      {
        $facet: {
          metadata: [{ $count: 'total' }],
          data: [{ $skip: startIndex }, { $limit: limit }]
        }
      }
    ]);
    
    // Extract results and metadata
    const vendors = vendorsWithDocs[0].data || [];
    const total = vendorsWithDocs[0].metadata[0]?.total || 0;
    const totalPages = Math.ceil(total / limit);
    
    res.status(200).json({
      success: true,
      data: vendors,
      total,
      totalPages,
      page,
      limit
    });
  } catch (error) {
    console.error('Get documents grouped by vendor error:', error);
    res.status(500).json({
      success: false,
      message: 'Could not fetch documents grouped by vendor',
      error: error.message
    });
  }
};

// Get document status distribution for reports
exports.getDocumentStatusDistribution = async (req, res) => {
  try {
    console.log('Generating document status distribution report...');
    
    // Aggregate documents by status
    const statusDistribution = await DocModel.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      },
      {
        $project: {
          name: {
            $switch: {
              branches: [
                { case: { $eq: ['$_id', 'pending'] }, then: 'Pending from Vendor' },
                { case: { $eq: ['$_id', 'under_review'] }, then: 'Pending from Consultant' },
                { case: { $eq: ['$_id', 'approved'] }, then: 'Approved' },
                { case: { $eq: ['$_id', 'rejected'] }, then: 'Rejected' }
              ],
              default: '$_id'
            }
          },
          value: '$count'
        }
      }
    ]);

    console.log('Status distribution:', statusDistribution);

    res.status(200).json({
      success: true,
      data: statusDistribution
    });
  } catch (error) {
    console.error('Get document status distribution error:', error);
    res.status(500).json({
      success: false,
      message: 'Could not fetch document status distribution',
      error: error.message
    });
  }
};

// Get monthly submissions data for reports
exports.getMonthlySubmissions = async (req, res) => {
  try {
    console.log('Generating monthly submissions report...');
    
    // Get current year
    const currentYear = new Date().getFullYear();
    
    // Aggregate documents by month for the current year
    const monthlySubmissions = await DocModel.aggregate([
      {
        $match: {
          createdAt: {
            $gte: new Date(`${currentYear}-01-01`),
            $lte: new Date(`${currentYear}-12-31`)
          }
        }
      },
      {
        $group: {
          _id: { $month: '$createdAt' },
          count: { $sum: 1 }
        }
      },
      {
        $project: {
          name: {
            $switch: {
              branches: [
                { case: { $eq: ['$_id', 1] }, then: 'Jan' },
                { case: { $eq: ['$_id', 2] }, then: 'Feb' },
                { case: { $eq: ['$_id', 3] }, then: 'Mar' },
                { case: { $eq: ['$_id', 4] }, then: 'Apr' },
                { case: { $eq: ['$_id', 5] }, then: 'May' },
                { case: { $eq: ['$_id', 6] }, then: 'Jun' },
                { case: { $eq: ['$_id', 7] }, then: 'Jul' },
                { case: { $eq: ['$_id', 8] }, then: 'Aug' },
                { case: { $eq: ['$_id', 9] }, then: 'Sep' },
                { case: { $eq: ['$_id', 10] }, then: 'Oct' },
                { case: { $eq: ['$_id', 11] }, then: 'Nov' },
                { case: { $eq: ['$_id', 12] }, then: 'Dec' }
              ],
              default: 'Unknown'
            }
          },
          count: '$count',
          month: '$_id'
        }
      },
      {
        $sort: { month: 1 }
      }
    ]);

    console.log('Monthly submissions:', monthlySubmissions);

    res.status(200).json({
      success: true,
      data: monthlySubmissions
    });
  } catch (error) {
    console.error('Get monthly submissions error:', error);
    res.status(500).json({
      success: false,
      message: 'Could not fetch monthly submissions data',
      error: error.message
    });
  }
};