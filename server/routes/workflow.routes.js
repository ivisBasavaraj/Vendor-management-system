const express = require('express');
const router = express.Router();
const workflowController = require('../controllers/workflow.controller');
const reportController = require('../controllers/reportGeneration.controller');
const { protect, authorize } = require('../middlewares/auth.middleware');

// Vendor submission routes
router.post('/submissions', 
  protect, 
  authorize('vendor'), 
  workflowController.createVendorSubmission
);

router.get('/submissions', 
  protect, 
  workflowController.getVendorSubmissions
);

router.get('/submissions/:id', 
  protect, 
  workflowController.getVendorSubmission
);

// Stage 1: Consultant Review
router.post('/submissions/:submissionId/documents/:documentId/consultant-review', 
  protect, 
  authorize('consultant', 'admin'), 
  workflowController.consultantReview
);

router.get('/consultant/pending-reviews', 
  protect, 
  authorize('consultant', 'admin'), 
  workflowController.getConsultantPendingReviews
);

// Stage 2: Cross-Verification
router.post('/submissions/:submissionId/documents/:documentId/cross-verification', 
  protect, 
  authorize('cross_verifier', 'admin'), 
  workflowController.crossVerification
);

router.get('/cross-verifier/pending-verifications', 
  protect, 
  authorize('cross_verifier', 'admin'), 
  workflowController.getCrossVerifierPendingVerifications
);

// Stage 3: Final Approval
router.post('/submissions/:submissionId/final-approval', 
  protect, 
  authorize('approver', 'admin'), 
  workflowController.finalApproval
);

router.get('/approver/vendor-list', 
  protect, 
  authorize('approver', 'admin'), 
  workflowController.getVendorListForApprover
);

// Document download routes
router.get('/submissions/:submissionId/download', 
  protect, 
  authorize('consultant', 'cross_verifier', 'approver', 'admin'), 
  reportController.downloadDocumentSet
);

// Report generation routes
router.post('/reports/approval', 
  protect, 
  authorize('admin', 'approver'), 
  reportController.generateApprovalReport
);

router.post('/reports/mis', 
  protect, 
  authorize('admin'), 
  reportController.generateMISReport
);

router.get('/reports/approval', 
  protect, 
  authorize('admin', 'approver'), 
  reportController.getApprovalReports
);

router.get('/reports/mis', 
  protect, 
  authorize('admin'), 
  reportController.getMISReports
);

// Automated features routes
router.post('/automation/monthly-reminders', 
  protect, 
  authorize('admin'), 
  reportController.sendMonthlyReminders
);

router.post('/automation/consultant-alerts', 
  protect, 
  authorize('admin'), 
  reportController.sendConsultantAlerts
);

// Dashboard data routes
router.get('/dashboard/vendor', 
  protect, 
  authorize('vendor'), 
  workflowController.getVendorDashboard
);

router.get('/dashboard/consultant', 
  protect, 
  authorize('consultant', 'admin'), 
  workflowController.getConsultantDashboard
);

router.get('/dashboard/cross-verifier', 
  protect, 
  authorize('cross_verifier', 'admin'), 
  workflowController.getCrossVerifierDashboard
);

router.get('/dashboard/approver', 
  protect, 
  authorize('approver', 'admin'), 
  workflowController.getApproverDashboard
);

router.get('/dashboard/admin', 
  protect, 
  authorize('admin'), 
  workflowController.getAdminDashboard
);

// Workflow tracking routes
router.get('/submissions/:submissionId/workflow', 
  protect, 
  workflowController.getSubmissionWorkflow
);

router.get('/documents/:documentId/workflow', 
  protect, 
  workflowController.getDocumentWorkflow
);

// Resubmission routes
router.post('/submissions/:submissionId/resubmit', 
  protect, 
  authorize('vendor'), 
  workflowController.resubmitDocuments
);

// Bulk operations
router.post('/bulk/consultant-review', 
  protect, 
  authorize('consultant', 'admin'), 
  workflowController.bulkConsultantReview
);

router.post('/bulk/cross-verification', 
  protect, 
  authorize('cross_verifier', 'admin'), 
  workflowController.bulkCrossVerification
);

router.post('/bulk/final-approval', 
  protect, 
  authorize('approver', 'admin'), 
  workflowController.bulkFinalApproval
);

// Statistics and analytics
router.get('/analytics/processing-time', 
  protect, 
  authorize('admin'), 
  workflowController.getProcessingTimeAnalytics
);

router.get('/analytics/approval-rates', 
  protect, 
  authorize('admin'), 
  workflowController.getApprovalRateAnalytics
);

router.get('/analytics/vendor-performance', 
  protect, 
  authorize('admin'), 
  workflowController.getVendorPerformanceAnalytics
);

module.exports = router;