const User = require('../models/user.model');
const crypto = require('crypto');
const activityLogger = require('../utils/activityLogger');

// Register a new user
exports.register = async (req, res) => {
  try {
    const { name, email, password, role, company, phone, address, requiresLoginApproval } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Email already registered'
      });
    }

    // Create user data
    const userData = {
      name,
      email,
      password,
      role: role || 'vendor', // Default to vendor if not specified
      company,
      phone,
      address
    };

    // Handle requiresLoginApproval field for vendors
    if ((role || 'vendor') === 'vendor') {
      // If requiresLoginApproval is explicitly provided, use it
      // Otherwise, default to true for vendors (as per the model default)
      userData.requiresLoginApproval = requiresLoginApproval !== undefined ? 
        (requiresLoginApproval === 'true' || requiresLoginApproval === true) : 
        true;
    }

    // Create new user
    const user = await User.create(userData);

    // Send token response
    await sendTokenResponse(user, 201, res);
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Could not register user',
      error: error.message
    });
  }
};

// Login user
exports.login = async (req, res) => {
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

    // Check if password matches
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check if vendor requires login approval (only for first-time login)
    if (user.role === 'vendor' && user.requiresLoginApproval && !user.firstLoginCompleted) {
      // Import the login approval controller and socket service
      const loginApprovalController = require('./loginApproval.controller');
      const webSocketService = require('../utils/webSocketService');
      const LoginApproval = require('../models/loginApproval.model');
      
      // This logic is no longer needed since we only require approval for first login
      // The firstLoginCompleted check above handles this case
      
      // Create login approval request
      const loginApproval = await loginApprovalController.createLoginApproval(
        user,
        req.ip,
        req.headers['user-agent'] || 'Unknown'
      );
      
      // Send real-time notification via WebSocket
      webSocketService.sendLoginApprovalRequest(loginApproval, user);
      
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

    // For non-vendors or vendors that don't need approval, send token response
    await sendTokenResponse(user, 200, res);
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Login failed',
      error: error.message
    });
  }
};

// Get current logged in user
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate('assignedConsultant', 'name email');

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
};

// Forgot password
exports.forgotPassword = async (req, res) => {
  let user = null;
  
  try {
    user = await User.findOne({ email: req.body.email });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'No user with that email'
      });
    }

    // Get reset token
    const resetToken = crypto.randomBytes(20).toString('hex');

    // Set expire to 30 minutes
    user.resetPasswordToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');
    user.resetPasswordExpire = Date.now() + 30 * 60 * 1000;

    await user.save({ validateBeforeSave: false });

    // Create reset URL
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;

    // Create notification for password reset
    const Notification = require('../models/notification.model');
    await Notification.create({
      recipient: user._id,
      type: 'system',
      title: 'Password Reset Request',
      message: `You have requested a password reset. Please use the link sent to your screen to reset your password. The link will expire in 30 minutes.`,
      priority: 'high',
      actionUrl: resetUrl
    });

    // Notify all admins about the password reset request
    const adminUsers = await User.find({ role: 'admin' });
    const adminNotifications = adminUsers.map(admin => ({
      recipient: admin._id,
      type: 'system',
      title: 'Password Reset Request',
      message: `User ${user.name} (${user.email}) has requested a password reset. Role: ${user.role}${user.company ? `, Company: ${user.company}` : ''}`,
      priority: 'medium'
    }));

    if (adminNotifications.length > 0) {
      await Notification.insertMany(adminNotifications);
    }

    // Send real-time notification to admins via WebSocket
    const webSocketService = require('../utils/webSocketService');
    webSocketService.sendPasswordResetNotification(user);

    res.status(200).json({
      success: true,
      message: 'Password reset link generated',
      resetUrl // Return reset URL directly in response since we're not emailing
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    
    if (user) {
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;
      await user.save({ validateBeforeSave: false });
    }

    res.status(500).json({
      success: false,
      message: 'Could not process password reset request',
      error: error.message
    });
  }
};

// Reset password
exports.resetPassword = async (req, res) => {
  try {
    // Get hashed token
    const resetPasswordToken = crypto
      .createHash('sha256')
      .update(req.params.token)
      .digest('hex');

    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired token'
      });
    }

    // Set new password
    user.password = req.body.password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    // Create notification for successful password reset
    const Notification = require('../models/notification.model');
    await Notification.create({
      recipient: user._id,
      type: 'system',
      title: 'Password Reset Successful',
      message: 'Your password has been reset successfully. You can now log in with your new password.',
      priority: 'high',
      actionUrl: '/login'
    });

    res.status(200).json({
      success: true,
      message: 'Password reset successful'
    });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({
      success: false,
      message: 'Could not reset password',
      error: error.message
    });
  }
};

// Update password
exports.updatePassword = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('+password');

    // Check current password
    if (!(await user.matchPassword(req.body.currentPassword))) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    user.password = req.body.newPassword;
    await user.save();

    // Create notification for password update
    const Notification = require('../models/notification.model');
    await Notification.create({
      recipient: user._id,
      type: 'system',
      title: 'Password Updated',
      message: 'Your password has been updated successfully.',
      priority: 'medium',
      actionUrl: '/profile'
    });

    await sendTokenResponse(user, 200, res);
  } catch (error) {
    console.error('Update password error:', error);
    res.status(500).json({
      success: false,
      message: 'Could not update password',
      error: error.message
    });
  }
};

// Update user details
exports.updateDetails = async (req, res) => {
  try {
    const { getProfileImageUrl } = require('../utils/profileImageUpload');
    
    const fieldsToUpdate = {
      name: req.body.name,
      email: req.body.email,
      company: req.body.company,
      phone: req.body.phone,
      address: req.body.address,
      contactPerson: req.body.contactPerson,
      website: req.body.website,
      registrationNumber: req.body.registrationNumber,
      taxId: req.body.taxId,
      industry: req.body.industry,
      description: req.body.description
    };

    // Handle profile image upload
    if (req.file) {
      fieldsToUpdate.logo = getProfileImageUrl(req.file.filename);
    }

    // Remove undefined fields
    Object.keys(fieldsToUpdate).forEach(key => 
      fieldsToUpdate[key] === undefined && delete fieldsToUpdate[key]
    );

    const user = await User.findByIdAndUpdate(
      req.user.id,
      fieldsToUpdate,
      {
        new: true,
        runValidators: true
      }
    ).select('-password');

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Update details error:', error);
    res.status(500).json({
      success: false,
      message: 'Could not update user details',
      error: error.message
    });
  }
};

// Check login approval status
exports.checkLoginApprovalStatus = async (req, res) => {
  try {
    // Handle both parameter formats (requestToken or id)
    const requestToken = req.params.requestToken;
    
    console.log('checkLoginApprovalStatus called with:', {
      requestToken,
      params: req.params,
      url: req.url
    });
    
    if (!requestToken) {
      return res.status(400).json({
        success: false,
        message: 'Request token is required'
      });
    }

    const LoginApproval = require('../models/loginApproval.model');
    // Try to find by requestToken or by _id
    let loginApproval = await LoginApproval.findOne({ requestToken });
    
    // If not found by requestToken, try to find by _id
    if (!loginApproval && requestToken.match(/^[0-9a-fA-F]{24}$/)) {
      loginApproval = await LoginApproval.findById(requestToken);
    }

    if (!loginApproval) {
      return res.status(404).json({
        success: false,
        message: 'Login request not found'
      });
    }

    // Check if token is expired
    if (new Date() > new Date(loginApproval.tokenExpires)) {
      return res.status(400).json({
        success: false,
        message: 'Login request has expired. Please attempt login again.',
        status: 'expired'
      });
    }

    // If approved, get the vendor details and send token
    if (loginApproval.status === 'approved') {
      const user = await User.findById(loginApproval.vendor);
      
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found',
          status: 'error'
        });
      }
      
      // Update lastLogin timestamp
      try {
        await User.findByIdAndUpdate(user._id, { 
          lastLogin: new Date() 
        });
        console.log('Last login updated for approved user:', user.email);
      } catch (error) {
        console.error('Error updating last login for approved user:', error);
        // Don't fail the login if lastLogin update fails
      }
      
      // Create token
      const token = user.getSignedJwtToken();
      
      // Create a complete user object with all necessary information
      const userResponse = {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        company: user.company,
        requiresLoginApproval: user.requiresLoginApproval || false
      };
      
      return res.status(200).json({
        success: true,
        status: 'approved',
        token,
        user: userResponse
      });
    }

    // If still pending or rejected, return the status
    // Try to get user info if possible, but don't fail if user not found
    let userInfo = null;
    try {
      const user = await User.findById(loginApproval.vendor);
      if (user) {
        userInfo = {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          company: user.company,
          requiresLoginApproval: user.requiresLoginApproval || false
        };
      }
    } catch (err) {
      console.error('Error fetching user for login approval:', err);
    }

    const response = {
      success: true,
      status: loginApproval.status,
      requestToken: loginApproval.requestToken,
      createdAt: loginApproval.createdAt,
      expiresAt: loginApproval.expiresAt,
      message: loginApproval.status === 'rejected' 
        ? `Login rejected. Reason: ${loginApproval.rejectionReason || 'No reason provided'}` 
        : 'Login request still pending approval'
    };
    
    // Include user info if available
    if (userInfo) {
      response.user = userInfo;
    }
    
    return res.status(200).json(response);
  } catch (error) {
    console.error('Check login approval status error:', error);
    res.status(500).json({
      success: false,
      message: 'Could not check login approval status',
      error: error.message
    });
  }
};

// Logout user
exports.logout = async (req, res) => {
  try {
    // Log the logout activity if user is authenticated
    if (req.user) {
      try {
        activityLogger.logUserActivity(req.user, 'User Logout', req.ip, 'User logged out');
      } catch (logError) {
        console.error('Error logging logout activity:', logError);
        // Don't fail the logout if activity logging fails
      }
    }
    
    // Clear the authentication cookie if it exists
    res.cookie('token', 'none', {
      expires: new Date(Date.now() - 10 * 1000), // 10 seconds in the past
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production', // Ensure secure flag matches login
    });

    // Always return success for logout, even if user wasn't authenticated
    res.status(200).json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    console.error('Logout error:', error);
    // Even if there's an error, we should still return success for logout
    res.status(200).json({
      success: true,
      message: 'Logged out successfully'
    });
  }
};

// Helper function to get token from model, create cookie and send response
const sendTokenResponse = async (user, statusCode, res) => {
  // Create token
  const token = user.getSignedJwtToken();

  const options = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRE * 24 * 60 * 60 * 1000
    ),
    httpOnly: true
  };

  if (process.env.NODE_ENV === 'production') {
    options.secure = true;
  }
  
  // Update lastLogin timestamp
  try {
    await User.findByIdAndUpdate(user._id, { 
      lastLogin: new Date() 
    });
    console.log('Last login updated for user:', user.email);
  } catch (error) {
    console.error('Error updating last login:', error);
    // Don't fail the login if lastLogin update fails
  }
  
  // Log the login activity
  try {
    activityLogger.logLogin(user, res.req.ip);
    console.log('Login activity logged successfully for user:', user.name, user.email);
  } catch (error) {
    console.error('Error logging login activity:', error);
    // Don't fail the login if activity logging fails
  }

  // Create a user object with all necessary information for the frontend
  const userResponse = {
    _id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    company: user.company,
    requiresLoginApproval: user.requiresLoginApproval || false
  };

  res
    .status(statusCode)
    .cookie('token', token, options)
    .json({
      success: true,
      token,
      user: userResponse
    });
};