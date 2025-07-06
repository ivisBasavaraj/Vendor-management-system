/**
 * Role-specific authentication routes
 * Handles authentication for different user roles
 */

const express = require('express');
const router = express.Router();
const User = require('../models/user.model');
const jwt = require('jsonwebtoken');
const { protect: verifyToken, authorize: restrictTo } = require('../middlewares/auth.middleware');

// Helper function to get token from model, create cookie and send response
const sendTokenResponse = (user, statusCode, res) => {
  // Create token
  const token = user.getSignedJwtToken();
  
  // Set cookie options
  const cookieOptions = {
    expires: new Date(Date.now() + process.env.JWT_COOKIE_EXPIRE * 24 * 60 * 60 * 1000),
    httpOnly: true
  };
  
  // Set secure flag in production
  if (process.env.NODE_ENV === 'production') {
    cookieOptions.secure = true;
  }
  
  // Remove password from output
  user.password = undefined;
  
  res
    .status(statusCode)
    .cookie('token', token, cookieOptions)
    .json({
      success: true,
      token,
      user
    });
};

// @route   POST /api/auth/admin/login
// @desc    Admin login
// @access  Public
router.post('/admin/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate email & password
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password'
      });
    }

    // Check for user
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check if user is an admin
    if (user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only admin accounts can login here.'
      });
    }

    // Check if password matches
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Send token response
    sendTokenResponse(user, 200, res);
  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({
      success: false,
      message: 'Login failed',
      error: error.message
    });
  }
});

// @route   POST /api/auth/vendor/login
// @desc    Vendor login
// @access  Public
router.post('/vendor/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate email & password
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password'
      });
    }

    // Check for user
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check if user is a vendor
    if (user.role !== 'vendor') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only vendor accounts can login here.'
      });
    }

    // Check if password matches
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check if vendor requires login approval
    if (user.requiresLoginApproval) {
      // Import the login approval controller and socket service
      const loginApprovalController = require('../controllers/loginApproval.controller');
      const socketService = require('../utils/socketService');
      const LoginApproval = require('../models/loginApproval.model');
      
      // Check for existing approved login approval
      const existingApproval = await LoginApproval.findOne({
        vendor: user._id,
        status: 'approved',
        expiresAt: { $gt: new Date() }
      });
      
      // If there's an existing approved login, allow login without creating a new request
      if (existingApproval) {
        console.log(`User ${user.email} has an existing approved login request. Allowing login.`);
        return sendTokenResponse(user, 200, res);
      }
      
      // Create login approval request
      const loginApproval = await loginApprovalController.createLoginApproval(
        user,
        req.ip,
        req.headers['user-agent'] || 'Unknown'
      );
      
      // Send real-time notification via WebSocket
      socketService.sendLoginApprovalRequest(loginApproval, user);
      
      // Return response without token - login pending approval
      return res.status(200).json({
        success: true,
        requiresApproval: true,
        loginApprovalId: loginApproval._id,
        requestToken: loginApproval.requestToken,
        createdAt: loginApproval.createdAt,
        expiresAt: loginApproval.expiresAt,
        message: 'Login request pending approval'
      });
    }

    // For vendors that don't need approval, send token response
    sendTokenResponse(user, 200, res);
  } catch (error) {
    console.error('Vendor login error:', error);
    res.status(500).json({
      success: false,
      message: 'Login failed',
      error: error.message
    });
  }
});

// @route   POST /api/auth/consultant/login
// @desc    Consultant login
// @access  Public
router.post('/consultant/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate email & password
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password'
      });
    }

    // Check for user
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check if user is a consultant
    if (user.role !== 'consultant') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only consultant accounts can login here.'
      });
    }

    // Check if password matches
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Send token response
    sendTokenResponse(user, 200, res);
  } catch (error) {
    console.error('Consultant login error:', error);
    res.status(500).json({
      success: false,
      message: 'Login failed',
      error: error.message
    });
  }
});

// @route   GET /api/auth/role/me
// @desc    Get current logged in user based on role
// @access  Private
router.get('/role/me', verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get user information',
      error: error.message
    });
  }
});

module.exports = router;
