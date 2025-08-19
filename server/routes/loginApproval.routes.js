const express = require('express');
const {
  getPendingLoginApprovals,
  getLoginApproval,
  approveLoginRequest,
  rejectLoginRequest,
  getVendorLoginHistory
} = require('../controllers/loginApproval.controller');

const router = express.Router();

// Import middleware
const { protect, authorize } = require('../middlewares/auth.middleware');

// Protected routes (admin, consultant only)
router.get(
  '/pending',
  protect,
  authorize('admin', 'consultant'),
  getPendingLoginApprovals
);

router.get(
  '/:id',
  protect,
  authorize('admin', 'consultant', 'vendor'),
  getLoginApproval
);

router.put(
  '/:id/approve',
  protect,
  authorize('admin', 'consultant'),
  approveLoginRequest
);

router.put(
  '/:id/reject',
  protect,
  authorize('admin', 'consultant'),
  rejectLoginRequest
);

// Vendor login history (admin, consultant, or the vendor themselves)
router.get(
  '/vendor/:vendorId',
  protect,
  getVendorLoginHistory
);

module.exports = router; 