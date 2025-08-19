const express = require('express');
const {
  login,
  getMe,
  forgotPassword,
  resetPassword,
  updatePassword,
  updateDetails,
  checkLoginApprovalStatus,
  logout // Added logout
} = require('../controllers/auth.controller');

const router = express.Router();

// Import middleware
const { protect, authorize } = require('../middlewares/auth.middleware');
const { profileImageUpload } = require('../utils/profileImageUpload');

// Public routes
router.post('/login', login);
router.post('/forgotpassword', forgotPassword);
router.put('/resetpassword/:token', resetPassword);
router.get('/login-approval/:requestToken', checkLoginApprovalStatus);

// Protected routes (require authentication)
router.get('/me', protect, getMe);
router.put('/updatepassword', protect, updatePassword);
router.put('/updatedetails', protect, profileImageUpload.single('profileImage'), updateDetails);
router.post('/logout', logout); // Logout doesn't require authentication

module.exports = router; 