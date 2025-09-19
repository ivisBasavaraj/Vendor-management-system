/**
 * Document Submission Routes
 */
const express = require('express');
const router = express.Router();
const documentSubmissionController = require('../controllers/documentSubmission.controller');
const { protect, authorize } = require('../middlewares/auth.middleware');

// Create new document submission
router.post('/create', protect, documentSubmissionController.createSubmission);

// Upload documents on behalf of vendor (for consultants)
router.post('/consultant-upload', protect, authorize('consultant', 'admin'), documentSubmissionController.consultantUploadDocument);

// Upload document to submission
router.post('/:submissionId/upload', protect, documentSubmissionController.uploadDocument);

// Delete document from submission
router.delete('/:submissionId/documents/:documentType', protect, documentSubmissionController.deleteDocument);

// Delete document by ID
router.delete('/documents/:documentId', protect, documentSubmissionController.deleteDocumentById);

// Submit documents for review
router.post('/:submissionId/submit', protect, authorize('vendor'), documentSubmissionController.submitForReview);

// Get vendor's submissions
// Allow vendors to see their own submissions, and consultants/admins to see submissions with a vendorId parameter
router.get('/vendor/submissions', protect, documentSubmissionController.getVendorSubmissions);

// Get consultant's assigned submissions
router.get('/consultant/submissions', protect, authorize('consultant', 'admin'), documentSubmissionController.getConsultantSubmissions);

// Get submissions by status
router.get('/status/:status', protect, authorize('consultant', 'admin'), documentSubmissionController.getSubmissionsByStatus);

// Review document
router.post('/:submissionId/review/:documentType', protect, authorize('consultant', 'admin'), documentSubmissionController.reviewDocument);

// Update document status
router.put('/:submissionId/documents/:documentId/status', protect, authorize('consultant', 'admin'), documentSubmissionController.updateDocumentStatus);

// Final approval
router.post('/:submissionId/final-approval', protect, authorize('consultant', 'admin'), documentSubmissionController.finalApproval);

// Download document
router.get('/:submissionId/download/:documentType', protect, authorize('consultant', 'admin', 'approver'), documentSubmissionController.downloadDocument);

// View file - public route with validation
router.get('/view', documentSubmissionController.viewFile);

// Download file - public route with validation
router.get('/download', documentSubmissionController.downloadFile);

// Check if document exists
router.get('/exists/:id', documentSubmissionController.checkDocumentExists);

// Search for submission by document ID
router.get('/search-by-document/:documentId', protect, documentSubmissionController.searchSubmissionByDocumentId);

// Resubmit document in a submission
router.post('/:submissionId/documents/:documentId/resubmit', protect, authorize('vendor'), documentSubmissionController.resubmitDocument);

// Get MIS data
router.get('/mis/data', protect, authorize('admin', 'approver'), documentSubmissionController.getMISData);

// Get vendor status data with document details
// Allow vendors to access their own status; controller enforces self-access
router.get('/vendor-status', protect, authorize('consultant', 'admin', 'approver', 'vendor'), documentSubmissionController.getVendorStatus);

// Get all submissions (admin view)
router.get('/admin/all', protect, authorize('admin'), documentSubmissionController.getAllSubmissions);

// Get submission details
router.get('/:submissionId', protect, documentSubmissionController.getSubmissionDetails);

// Get document types
router.get('/document-types', documentSubmissionController.getDocumentTypes);

// Get upload periods
router.get('/upload-periods', documentSubmissionController.getUploadPeriods);

// Bulk approve submissions
router.post('/admin/bulk-approve', protect, authorize('admin'), documentSubmissionController.bulkApprove);

// Bulk reject submissions
router.post('/admin/bulk-reject', protect, authorize('admin'), documentSubmissionController.bulkReject);

// DEBUG - Get all submissions
router.get('/debug/all-submissions', documentSubmissionController.debugGetAllSubmissions);

// TEST - Set document status to resubmitted (no auth for testing)
router.post('/test/set-resubmitted/:documentId', documentSubmissionController.testSetResubmitted);

module.exports = router;