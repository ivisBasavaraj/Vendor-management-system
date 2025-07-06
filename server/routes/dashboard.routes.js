const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboard.controller');
const { protect, authorize } = require('../middlewares/auth.middleware');

// Admin Dashboard
router.get('/admin', protect, authorize('admin'), dashboardController.getAdminDashboard);

// Vendor Dashboard
router.get('/vendor', protect, authorize('vendor'), dashboardController.getVendorDashboard);

// Consultant Dashboard
router.get('/consultant', protect, authorize('consultant'), dashboardController.getConsultantDashboard);

// Cross Verifier Dashboard
router.get('/cross-verifier', protect, authorize('cross_verifier'), dashboardController.getCrossVerifierDashboard);

// Approver Dashboard
router.get('/approver', protect, authorize('approver'), dashboardController.getApproverDashboard);

module.exports = router;