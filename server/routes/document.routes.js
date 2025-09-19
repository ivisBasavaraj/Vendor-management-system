const express = require('express');
const {
  uploadDocument,
  uploadDocumentFiles,
  getDocuments,
  getDocument,
  updateDocumentStatus,
  updateDocument,
  deleteDocument,
  downloadDocument,
  downloadDocumentFile,
  getDocumentsGroupedByVendor,
  viewFile,
  checkDocumentExists,
  getDocumentStatusDistribution,
  getMonthlySubmissions
} = require('../controllers/document.controller');

// Import document submission controller for embedded document updates
const { updateIndividualDocumentStatus } = require('../controllers/documentSubmission.controller');

const router = express.Router();

// Import middleware
const { protect, authorize } = require('../middlewares/auth.middleware');
const { upload } = require('../utils/fileUpload');

// Report routes (must be before parameterized routes)
router.get('/reports/status-distribution', protect, getDocumentStatusDistribution);
router.get('/reports/monthly-submissions', protect, getMonthlySubmissions);

// Document routes - Single file upload (legacy)
router.post(
  '/',
  protect,
  upload.array('files', 10), // Changed to accept multiple files with field name 'files'
  uploadDocument
);

// Document routes - Multiple file upload
router.post(
  '/upload',
  protect,
  authorize('vendor'),
  upload.array('files', 10), // Maximum 10 files
  uploadDocumentFiles
);

router.get('/grouped-by-vendor', protect, getDocumentsGroupedByVendor);
router.get('/', protect, getDocuments);
router.get('/view', viewFile); // Public route for viewing files
router.get('/exists/:id', checkDocumentExists); // Check if document exists

// Debug endpoint to get detailed document info
router.get('/debug/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Document ID is required'
      });
    }
    
    // Check if ID is a valid MongoDB ObjectId
    const mongoose = require('mongoose');
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid document ID format'
      });
    }
    
    // Try to find the document in DocModel
    const DocModel = require('../models/document.model');
    const document = await DocModel.findById(id);
    
    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Document not found in documents collection'
      });
    }
    
    return res.status(200).json({
      success: true,
      message: 'Document found',
      data: document
    });
  } catch (error) {
    console.error('Error in debug endpoint:', error);
    return res.status(500).json({
      success: false,
      message: 'Error retrieving document',
      error: error.message
    });
  }
});
router.get('/status/:status', protect, async (req, res) => {
  try {
    const { status } = req.params;
    const { page = 1, limit = 10, search = '', year, month } = req.query;
    
    console.log(`Fetching documents with status: ${status}, params:`, req.query);
    
    // Build query
    let query = { status };
    
    // Add search if provided
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }
    
    // Add year/month filters if provided
    if (year && month) {
      const startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
      const endDate = new Date(parseInt(year), parseInt(month), 0);
      query.submissionDate = { $gte: startDate, $lte: endDate };
    }
    
    // For vendors, only show their own documents
    if (req.user.role === 'vendor') {
      query.vendor = req.user.id;
    }
    
    // For consultants, only show documents assigned to them
    if (req.user.role === 'consultant') {
      query.consultant = req.user.id;
    }
    
    // Execute query with pagination
    const options = {
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      sort: { submissionDate: -1 },
      populate: [
        { path: 'vendor', select: 'name email company' },
        { path: 'consultant', select: 'name email' }
      ]
    };
    
    const Document = require('../models/document.model');
    const documents = await Document.find(query)
      .skip((parseInt(page) - 1) * parseInt(limit))
      .limit(parseInt(limit))
      .sort({ submissionDate: -1 })
      .populate('vendor', 'name email company')
      .populate('consultant', 'name email');
    
    const total = await Document.countDocuments(query);
    
    return res.status(200).json({
      success: true,
      count: documents.length,
      total,
      totalPages: Math.ceil(total / parseInt(limit)),
      page: parseInt(page),
      data: documents
    });
  } catch (error) {
    console.error('Error fetching documents by status:', error);
    return res.status(500).json({
      success: false,
      message: 'Could not fetch documents',
      error: error.message
    });
  }
});
// DEPRECATED: vendor-status mock removed to avoid confusion with real endpoint at /api/document-submissions/vendor-status
// If needed for local manual testing, reintroduce under a different path such as /debug/vendor-status-mock
router.get('/:id', protect, getDocument);
// Update document status - try both standalone documents and embedded documents in submissions
router.put('/:id/status', protect, authorize('admin', 'consultant'), async (req, res) => {
  const { id } = req.params;
  
  try {
    // Check if it's a standalone document first
    const Document = require('../models/document.model');
    const standaloneDoc = await Document.findById(id);
    
    if (standaloneDoc) {
      console.log('Found standalone document, using document controller');
      return updateDocumentStatus(req, res);
    } else {
      console.log('Not a standalone document, trying embedded document in submission');
      return updateIndividualDocumentStatus(req, res);
    }
  } catch (error) {
    console.error('Error in document status update router:', error);
    return res.status(500).json({
      success: false,
      message: 'Error updating document status',
      error: error.message
    });
  }
});
router.put('/:id', protect, updateDocument);
router.delete('/:id', protect, deleteDocument);
router.get('/:id/download', protect, downloadDocument);
router.get('/file/:fileId', protect, downloadDocumentFile);

module.exports = router; 