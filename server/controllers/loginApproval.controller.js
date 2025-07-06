const LoginApproval = require('../models/loginApproval.model');
const User = require('../models/user.model');
const Notification = require('../models/notification.model');
const crypto = require('crypto');

// Create login approval request
exports.createLoginApproval = async (user, ipAddress, userAgent) => {
  try {
    // Generate secure random token for this login request
    const requestToken = crypto.randomBytes(32).toString('hex');
    const tokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    const deviceInfo = parseUserAgent(userAgent);

    // Find assigned consultant if any
    const vendor = await User.findById(user._id).populate('assignedConsultant');
    
    // Create login approval request
    const loginApproval = await LoginApproval.create({
      vendor: user._id,
      status: 'pending',
      ipAddress,
      userAgent,
      deviceInfo,
      requestToken,
      tokenExpires,
      assignedConsultant: vendor.assignedConsultant ? vendor.assignedConsultant._id : null,
      expiresAt: tokenExpires
    });

    // Find admins and relevant consultants to notify
    const admins = await User.find({ role: 'admin', isActive: true });
    const relevantUsers = [...admins];

    // Add assigned consultant if exists
    if (vendor.assignedConsultant) {
      relevantUsers.push(vendor.assignedConsultant);
    } else {
      // If no assigned consultant, notify all active consultants
      const consultants = await User.find({ role: 'consultant', isActive: true });
      relevantUsers.push(...consultants);
    }

    // Create notifications
    const notifiedUserIds = [];
    for (const receiver of relevantUsers) {
      // Create in-app notification
      await Notification.create({
        recipient: receiver._id,
        sender: user._id,
        type: 'login_request',
        title: 'Vendor Login Request',
        message: `${user.name} from ${user.company} is attempting to log in and needs approval.`,
        relatedLoginApproval: loginApproval._id,
        priority: 'high',
        actionUrl: `/login-approvals/${loginApproval._id}`
      });
      
      notifiedUserIds.push(receiver._id);
    }

    // Update login approval with notified users
    loginApproval.notifiedUsers = notifiedUserIds;
    await loginApproval.save();

    // Create in-app notification for vendor about pending login
    await Notification.create({
      recipient: user._id,
      type: 'login_request',
      title: 'Login Approval Pending',
      message: 'Your login request is pending approval. You will be notified when it is approved.',
      relatedLoginApproval: loginApproval._id,
      priority: 'medium',
      actionUrl: `/login-status`
    });

    return loginApproval;
  } catch (error) {
    console.error('Create login approval error:', error);
    throw new Error('Failed to create login approval request');
  }
};

// Get all pending login approvals (for admins and consultants)
exports.getPendingLoginApprovals = async (req, res) => {
  try {
    let query = { status: 'pending' };

    // If consultant, only show relevant requests
    if (req.user.role === 'consultant') {
      query.$or = [
        { assignedConsultant: req.user._id },  // Assigned specifically to this consultant
        { assignedConsultant: { $exists: false } }  // Or not assigned to any consultant
      ];
    }

    const loginApprovals = await LoginApproval.find(query)
      .populate({
        path: 'vendor',
        select: 'name email company'
      })
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: loginApprovals.length,
      data: loginApprovals
    });
  } catch (error) {
    console.error('Get pending login approvals error:', error);
    res.status(500).json({
      success: false,
      message: 'Could not fetch login approval requests',
      error: error.message
    });
  }
};

// Get single login approval detail
exports.getLoginApproval = async (req, res) => {
  try {
    const loginApproval = await LoginApproval.findById(req.params.id)
      .populate({
        path: 'vendor',
        select: 'name email company phone'
      })
      .populate({
        path: 'approver',
        select: 'name email role'
      })
      .populate({
        path: 'assignedConsultant',
        select: 'name email'
      });

    if (!loginApproval) {
      return res.status(404).json({
        success: false,
        message: 'Login approval request not found'
      });
    }

    // Check permission - only admins, consultants, or the vendor can view
    if (req.user.role === 'vendor' && loginApproval.vendor._id.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this login approval request'
      });
    }

    res.status(200).json({
      success: true,
      data: loginApproval
    });
  } catch (error) {
    console.error('Get login approval error:', error);
    res.status(500).json({
      success: false,
      message: 'Could not fetch login approval request',
      error: error.message
    });
  }
};

// Approve login request
exports.approveLoginRequest = async (req, res) => {
  try {
    // Ensure we have a valid ID
    if (!req.params.id || !req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid login approval ID format'
      });
    }
    
    const loginApproval = await LoginApproval.findById(req.params.id);

    if (!loginApproval) {
      return res.status(404).json({
        success: false,
        message: 'Login approval request not found'
      });
    }

    // Check if already processed
    if (loginApproval.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: `Login request has already been ${loginApproval.status}`
      });
    }

    // Check if token is expired
    if (new Date() > new Date(loginApproval.tokenExpires)) {
      loginApproval.status = 'rejected';
      await loginApproval.save();
      
      return res.status(400).json({
        success: false,
        message: 'Login request has expired. Vendor must attempt login again.'
      });
    }

    // Update login approval
    loginApproval.status = 'approved';
    loginApproval.approver = req.user._id;
    loginApproval.approvalDate = Date.now();
    await loginApproval.save();

    // Get vendor details
    const vendor = await User.findById(loginApproval.vendor);
    
    // Mark first login as completed for the vendor
    if (!vendor.firstLoginCompleted) {
      await User.findByIdAndUpdate(vendor._id, { 
        firstLoginCompleted: true,
        lastLogin: new Date()
      });
      console.log(`Marked first login as completed for vendor: ${vendor.email}`);
    }
    
    // Send real-time notification via WebSocket
    const socketService = require('../utils/socketService');
    socketService.sendLoginApprovalUpdate(vendor._id.toString(), 'approved', req.user);

    // Create in-app notification for the vendor with high priority
    await Notification.create({
      recipient: vendor._id,
      sender: req.user._id,
      type: 'login_approved',
      title: 'Login Request Approved',
      message: `Your login request has been approved by ${req.user.name}. You can now access the system.`,
      relatedLoginApproval: loginApproval._id,
      priority: 'high',
      actionUrl: '/dashboard'
    });

    // Update vendor's last login time
    vendor.lastLogin = Date.now();
    await vendor.save();

    res.status(200).json({
      success: true,
      data: loginApproval,
      message: 'Login request approved successfully'
    });
  } catch (error) {
    console.error('Approve login request error:', error);
    res.status(500).json({
      success: false,
      message: 'Could not approve login request',
      error: error.message
    });
  }
};

// Reject login request
exports.rejectLoginRequest = async (req, res) => {
  try {
    // Ensure we have a valid ID
    if (!req.params.id || !req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid login approval ID format'
      });
    }
    
    const { reason } = req.body;
    
    const loginApproval = await LoginApproval.findById(req.params.id);

    if (!loginApproval) {
      return res.status(404).json({
        success: false,
        message: 'Login approval request not found'
      });
    }

    // Check if already processed
    if (loginApproval.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: `Login request has already been ${loginApproval.status}`
      });
    }

    // Update login approval
    loginApproval.status = 'rejected';
    loginApproval.approver = req.user._id;
    loginApproval.approvalDate = Date.now();
    loginApproval.rejectionReason = reason || 'No reason provided';
    await loginApproval.save();

    // Get vendor details
    const vendor = await User.findById(loginApproval.vendor);
    
    // Send real-time notification via WebSocket
    const socketService = require('../utils/socketService');
    socketService.sendLoginApprovalUpdate(vendor._id.toString(), 'rejected', req.user);

    // Create in-app notification for the vendor with high priority
    await Notification.create({
      recipient: vendor._id,
      sender: req.user._id,
      type: 'login_rejected',
      title: 'Login Request Rejected',
      message: `Your login request has been rejected by ${req.user.name}. Reason: ${loginApproval.rejectionReason}`,
      relatedLoginApproval: loginApproval._id,
      priority: 'high',
      actionUrl: '/login-status'
    });

    res.status(200).json({
      success: true,
      data: loginApproval,
      message: 'Login request rejected successfully'
    });
  } catch (error) {
    console.error('Reject login request error:', error);
    res.status(500).json({
      success: false,
      message: 'Could not reject login request',
      error: error.message
    });
  }
};

// Verify login token (for vendors to poll approval status)
exports.verifyLoginToken = async (req, res) => {
  try {
    const { token } = req.params;
    
    const loginApproval = await LoginApproval.findOne({
      requestToken: token,
      tokenExpires: { $gt: Date.now() }
    }).populate({
      path: 'vendor',
      select: 'name email company'
    });

    if (!loginApproval) {
      return res.status(404).json({
        success: false,
        message: 'Invalid or expired login token'
      });
    }

    // Check if request is for the current user
    if (req.user && loginApproval.vendor._id.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to check this login request'
      });
    }

    // If approved, generate token
    if (loginApproval.status === 'approved') {
      const vendor = await User.findById(loginApproval.vendor._id);
      
      // Update last login info
      await vendor.updateLastLogin(
        loginApproval.ipAddress || 'Unknown',
        loginApproval.userAgent || 'Unknown'
      );
      
      // Generate JWT token
      const token = vendor.getSignedJwtToken();
      
      return res.status(200).json({
        success: true,
        status: loginApproval.status,
        token,
        user: {
          id: vendor._id,
          name: vendor.name,
          email: vendor.email,
          role: vendor.role,
          company: vendor.company
        }
      });
    }
    
    // If rejected or still pending
    res.status(200).json({
      success: true,
      status: loginApproval.status,
      message: loginApproval.status === 'rejected' 
        ? loginApproval.rejectionReason 
        : 'Login request is still pending approval'
    });
  } catch (error) {
    console.error('Verify login token error:', error);
    res.status(500).json({
      success: false,
      message: 'Could not verify login token',
      error: error.message
    });
  }
};

// Admin can assign/change consultant for a vendor
exports.assignConsultant = async (req, res) => {
  try {
    const { vendorId, consultantId } = req.body;
    
    // Verify both users exist
    const vendor = await User.findById(vendorId);
    if (!vendor || vendor.role !== 'vendor') {
      return res.status(404).json({
        success: false,
        message: 'Vendor not found'
      });
    }
    
    // Validate consultant if provided (or assign null to remove assignment)
    if (consultantId) {
      const consultant = await User.findById(consultantId);
      if (!consultant || consultant.role !== 'consultant') {
        return res.status(404).json({
          success: false,
          message: 'Consultant not found'
        });
      }
    }
    
    // Update vendor with assigned consultant
    vendor.assignedConsultant = consultantId || null;
    await vendor.save();
    
    res.status(200).json({
      success: true,
      data: vendor,
      message: consultantId 
        ? 'Consultant assigned successfully' 
        : 'Consultant assignment removed'
    });
  } catch (error) {
    console.error('Assign consultant error:', error);
    res.status(500).json({
      success: false,
      message: 'Could not assign consultant',
      error: error.message
    });
  }
};

// Get vendor login history
exports.getVendorLoginHistory = async (req, res) => {
  try {
    const vendorId = req.params.vendorId;
    
    // Check if user has permission to view this history
    if (req.user.role === 'vendor' && req.user._id.toString() !== vendorId) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this login history'
      });
    }

    const loginHistory = await LoginApproval.find({ vendor: vendorId })
      .populate({
        path: 'approver',
        select: 'name email role'
      })
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: loginHistory.length,
      data: loginHistory
    });
  } catch (error) {
    console.error('Get vendor login history error:', error);
    res.status(500).json({
      success: false,
      message: 'Could not fetch login history',
      error: error.message
    });
  }
};

// Utility function to parse user agent string
function parseUserAgent(userAgent) {
  if (!userAgent) return 'Unknown device';
  
  let deviceInfo = 'Unknown device';
  
  try {
    // Extract basic device information
    if (userAgent.includes('iPhone') || userAgent.includes('iPad')) {
      deviceInfo = userAgent.includes('iPhone') ? 'iPhone' : 'iPad';
    } else if (userAgent.includes('Android')) {
      deviceInfo = 'Android device';
    } else if (userAgent.includes('Windows')) {
      deviceInfo = 'Windows PC';
    } else if (userAgent.includes('Mac')) {
      deviceInfo = 'Mac';
    } else if (userAgent.includes('Linux')) {
      deviceInfo = 'Linux';
    }
    
    // Add browser information
    if (userAgent.includes('Chrome') && !userAgent.includes('Chromium')) {
      deviceInfo += ' - Chrome';
    } else if (userAgent.includes('Firefox')) {
      deviceInfo += ' - Firefox';
    } else if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) {
      deviceInfo += ' - Safari';
    } else if (userAgent.includes('Edge')) {
      deviceInfo += ' - Edge';
    }
  } catch (error) {
    console.error('Error parsing user agent:', error);
  }
  
  return deviceInfo;
}