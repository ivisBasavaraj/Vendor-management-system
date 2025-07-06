const express = require('express');
const {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  getVendors,
  getConsultants,
  getVendorAnalytics,
  getConsultantAnalytics,
  getDashboardAnalytics,
  assignConsultantToVendor,
  getVendorsByConsultant,
  adminResetPassword
} = require('../controllers/user.controller');

const router = express.Router();

// Import middleware
const { protect, authorize } = require('../middlewares/auth.middleware');

// User routes
router.get('/', protect, authorize('admin'), getUsers);
router.get('/vendors', protect, getVendors);
router.get('/consultants', protect, getConsultants);
router.get('/:id', protect, getUserById);
router.post('/', protect, authorize('admin'), createUser);
router.put('/:id', protect, authorize('admin'), updateUser);
router.delete('/:id', protect, authorize('admin'), deleteUser);

// Analytics routes
router.get('/analytics/vendors', protect, getVendorAnalytics);
router.get('/analytics/consultants', protect, getConsultantAnalytics);
router.get('/analytics/dashboard', protect, getDashboardAnalytics);

// Assign consultant to vendor
router.post('/vendors/:id/assign-consultant', protect, authorize('admin'), assignConsultantToVendor);

// Get vendors assigned to consultant
router.get('/consultants/:id/vendors', protect, getVendorsByConsultant);

// Admin reset user password
router.post('/:id/reset-password', protect, authorize('admin'), adminResetPassword);

// Update vendor agreement period (admin only)
router.put('/vendors/:id/agreement-period', protect, authorize('admin'), updateUser);

// Test endpoint to update lastLogin (admin only) - for debugging
router.post('/:id/test-login', protect, authorize('admin'), async (req, res) => {
  try {
    const User = require('../models/user.model');
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { lastLogin: new Date() },
      { new: true }
    ).select('-password');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'LastLogin updated successfully',
      data: {
        userId: user._id,
        name: user.name,
        email: user.email,
        lastLogin: user.lastLogin
      }
    });
  } catch (error) {
    console.error('Test login update error:', error);
    res.status(500).json({
      success: false,
      message: 'Could not update lastLogin',
      error: error.message
    });
  }
});

// Test endpoint to assign first vendor to first consultant (for testing)
router.post('/debug/auto-assign', protect, authorize('admin'), async (req, res) => {
  try {
    const User = require('../models/user.model');
    
    const vendor = await User.findOne({ role: 'vendor' });
    const consultant = await User.findOne({ role: 'consultant' });
    
    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: 'No vendor found in database'
      });
    }
    
    if (!consultant) {
      return res.status(404).json({
        success: false,
        message: 'No consultant found in database'
      });
    }
    
    // Assign consultant to vendor
    await User.updateOne(
      { _id: vendor._id },
      { $set: { assignedConsultant: consultant._id } }
    );
    
    res.status(200).json({
      success: true,
      message: `Assigned consultant ${consultant.name} to vendor ${vendor.name}`,
      data: {
        vendor: {
          id: vendor._id,
          name: vendor.name,
          email: vendor.email
        },
        consultant: {
          id: consultant._id,
          name: consultant.name,
          email: consultant.email
        }
      }
    });
  } catch (error) {
    console.error('Auto assign error:', error);
    res.status(500).json({
      success: false,
      message: 'Could not auto assign',
      error: error.message
    });
  }
});

// Specific endpoint for consultant to get their assigned vendors
router.get('/consultant/my-vendors', protect, authorize('consultant'), async (req, res) => {
  try {
    const User = require('../models/user.model');
    const DocModel = require('../models/document.model');
    const DocumentSubmission = require('../models/documentSubmission.model');
    
    console.log('=== CONSULTANT MY VENDORS ===');
    console.log('Consultant:', {
      id: req.user._id,
      name: req.user.name,
      email: req.user.email
    });
    
    const vendors = await User.find({ 
      role: 'vendor',
      assignedConsultant: req.user._id
    })
    .select('-password')
    .populate('assignedConsultant', 'name email')
    .sort({ createdAt: -1 });
    
    console.log('Found assigned vendors:', vendors.length);
    
    // Add analytics data for each vendor
    const vendorsWithAnalytics = await Promise.all(vendors.map(async (vendor) => {
      const vendorObj = vendor.toObject();
      
      try {
        // First try to get document counts from the DocumentSubmission model
        const documentSubmissions = await DocumentSubmission.find({ vendor: vendor._id });
        
        let totalDocuments = 0;
        let approvedDocuments = 0;
        let pendingDocuments = 0;
        let rejectedDocuments = 0;
        let lastActivity = vendor.createdAt;
        
        if (documentSubmissions.length > 0) {
          // Count documents from submissions
          documentSubmissions.forEach(submission => {
            if (submission.documents && submission.documents.length > 0) {
              submission.documents.forEach(doc => {
                totalDocuments++;
                
                switch (doc.status) {
                  case 'approved':
                    approvedDocuments++;
                    break;
                  case 'under_review':
                  case 'uploaded':
                    pendingDocuments++;
                    break;
                  case 'rejected':
                    rejectedDocuments++;
                    break;
                  default:
                    pendingDocuments++;
                }
              });
            }
            
            // Update last activity if this submission is newer
            if (submission.lastModifiedDate && submission.lastModifiedDate > lastActivity) {
              lastActivity = submission.lastModifiedDate;
            }
          });
          
          console.log(`DocumentSubmission analytics for vendor ${vendor.name}:`, {
            totalDocuments,
            approvedDocuments,
            pendingDocuments,
            rejectedDocuments,
            submissions: documentSubmissions.length
          });
        } else {
          // Fallback to Document model if no submissions found
          totalDocuments = await DocModel.countDocuments({ vendor: vendor._id });
          approvedDocuments = await DocModel.countDocuments({ 
            vendor: vendor._id,
            status: { $in: ['approved', 'consultant_approved', 'final_approved'] }
          });
          pendingDocuments = await DocModel.countDocuments({ 
            vendor: vendor._id,
            status: { $in: ['pending', 'under_review'] }
          });
          rejectedDocuments = await DocModel.countDocuments({ 
            vendor: vendor._id,
            status: { $in: ['rejected', 'consultant_rejected', 'final_rejected'] }
          });
          
          // Get last activity date from Document model
          const latestDocument = await DocModel.findOne({ vendor: vendor._id })
            .sort({ updatedAt: -1 })
            .select('updatedAt');
          
          if (latestDocument && latestDocument.updatedAt > lastActivity) {
            lastActivity = latestDocument.updatedAt;
          }
          
          console.log(`Document model analytics for vendor ${vendor.name}:`, {
            totalDocuments,
            approvedDocuments,
            pendingDocuments,
            rejectedDocuments
          });
        }
        
        // Calculate compliance rate
        const complianceRate = totalDocuments > 0 
          ? Math.round((approvedDocuments / totalDocuments) * 100) 
          : 0;
        
        vendorObj.analytics = {
          totalDocuments,
          approvedDocuments,
          pendingDocuments,
          rejectedDocuments,
          complianceRate,
          lastActivity
        };
        
        console.log(`Final analytics for vendor ${vendor.name}:`, vendorObj.analytics);
      } catch (err) {
        console.error(`Error getting analytics for vendor ${vendor._id}:`, err);
        vendorObj.analytics = {
          totalDocuments: 0,
          approvedDocuments: 0,
          pendingDocuments: 0,
          rejectedDocuments: 0,
          complianceRate: 0,
          lastActivity: vendor.createdAt
        };
      }
      
      return vendorObj;
    }));
    
    res.status(200).json({
      success: true,
      data: vendorsWithAnalytics,
      consultant: {
        id: req.user._id,
        name: req.user.name,
        email: req.user.email
      }
    });
  } catch (error) {
    console.error('Get consultant vendors error:', error);
    res.status(500).json({
      success: false,
      message: 'Could not fetch assigned vendors',
      error: error.message
    });
  }
});

// Specific debug endpoint for ppkrishnaprasad06048@gmail.com
router.get('/debug/consultant-vendors/:email', protect, async (req, res) => {
  try {
    const User = require('../models/user.model');
    const email = req.params.email;
    
    console.log(`=== DEBUG FOR CONSULTANT: ${email} ===`);
    
    // Find the consultant
    const consultant = await User.findOne({ email, role: 'consultant' });
    if (!consultant) {
      return res.status(404).json({
        success: false,
        message: `Consultant with email ${email} not found`
      });
    }
    
    console.log('Found consultant:', {
      id: consultant._id,
      name: consultant.name,
      email: consultant.email
    });
    
    // Find vendors assigned to this consultant
    const assignedVendors = await User.find({
      role: 'vendor',
      assignedConsultant: consultant._id
    }).select('name email assignedConsultant');
    
    console.log(`Found ${assignedVendors.length} vendors assigned to ${consultant.name}`);
    
    // Also check all vendors to see their assignments
    const allVendors = await User.find({ role: 'vendor' })
      .select('name email assignedConsultant')
      .populate('assignedConsultant', 'name email');
    
    res.status(200).json({
      success: true,
      data: {
        consultant: {
          id: consultant._id,
          name: consultant.name,
          email: consultant.email
        },
        assignedVendors: assignedVendors.map(v => ({
          id: v._id,
          name: v.name,
          email: v.email,
          assignedConsultant: v.assignedConsultant
        })),
        allVendorsWithAssignments: allVendors.map(v => ({
          id: v._id,
          name: v.name,
          email: v.email,
          assignedConsultant: v.assignedConsultant ? {
            id: v.assignedConsultant._id,
            name: v.assignedConsultant.name,
            email: v.assignedConsultant.email
          } : null
        }))
      }
    });
  } catch (error) {
    console.error('Debug consultant vendors error:', error);
    res.status(500).json({
      success: false,
      message: 'Could not fetch debug data',
      error: error.message
    });
  }
});

// Debug endpoint to reset first login status for a vendor
router.post('/debug/reset-first-login/:vendorId', protect, authorize('admin'), async (req, res) => {
  try {
    const User = require('../models/user.model');
    const { vendorId } = req.params;
    
    const vendor = await User.findById(vendorId);
    if (!vendor || vendor.role !== 'vendor') {
      return res.status(404).json({
        success: false,
        message: 'Vendor not found'
      });
    }
    
    await User.findByIdAndUpdate(vendorId, { 
      firstLoginCompleted: false,
      lastLogin: null
    });
    
    res.status(200).json({
      success: true,
      message: `Reset first login status for vendor: ${vendor.name}`,
      data: {
        vendorId: vendor._id,
        name: vendor.name,
        email: vendor.email
      }
    });
  } catch (error) {
    console.error('Reset first login status error:', error);
    res.status(500).json({
      success: false,
      message: 'Could not reset first login status',
      error: error.message
    });
  }
});

// Debug endpoint to check first login status
router.get('/debug/first-login-status', protect, async (req, res) => {
  try {
    const User = require('../models/user.model');
    
    const vendors = await User.find({ role: 'vendor' })
      .select('name email firstLoginCompleted requiresLoginApproval lastLogin');
    
    res.status(200).json({
      success: true,
      data: {
        vendors: vendors.map(v => ({
          id: v._id,
          name: v.name,
          email: v.email,
          firstLoginCompleted: v.firstLoginCompleted,
          requiresLoginApproval: v.requiresLoginApproval,
          lastLogin: v.lastLogin
        }))
      }
    });
  } catch (error) {
    console.error('Debug first login status error:', error);
    res.status(500).json({
      success: false,
      message: 'Could not fetch debug data',
      error: error.message
    });
  }
});

// Debug endpoint to check specific login approval (no auth required for debugging)
router.get('/debug/login-approval/:id', async (req, res) => {
  try {
    const LoginApproval = require('../models/loginApproval.model');
    const { id } = req.params;
    
    console.log('Debug: Looking for login approval with ID:', id);
    
    // Try to find by _id first
    let loginApproval = await LoginApproval.findById(id)
      .populate('vendor', 'name email role')
      .populate('approver', 'name email role');
    
    if (!loginApproval) {
      // Try to find by requestToken
      loginApproval = await LoginApproval.findOne({ requestToken: id })
        .populate('vendor', 'name email role')
        .populate('approver', 'name email role');
    }
    
    if (!loginApproval) {
      return res.status(404).json({
        success: false,
        message: 'Login approval not found',
        searchedId: id
      });
    }
    
    res.status(200).json({
      success: true,
      data: {
        id: loginApproval._id,
        requestToken: loginApproval.requestToken,
        status: loginApproval.status,
        vendor: loginApproval.vendor,
        approver: loginApproval.approver,
        createdAt: loginApproval.createdAt,
        expiresAt: loginApproval.expiresAt,
        tokenExpires: loginApproval.tokenExpires,
        approvalDate: loginApproval.approvalDate,
        rejectionReason: loginApproval.rejectionReason
      }
    });
  } catch (error) {
    console.error('Debug login approval error:', error);
    res.status(500).json({
      success: false,
      message: 'Could not fetch login approval debug data',
      error: error.message
    });
  }
});

// Debug endpoint to check vendor assignments
router.get('/debug/assignments', protect, async (req, res) => {
  try {
    const User = require('../models/user.model');
    
    const vendors = await User.find({ role: 'vendor' })
      .select('name email assignedConsultant')
      .populate('assignedConsultant', 'name email');
    
    const consultants = await User.find({ role: 'consultant' })
      .select('name email');
    
    res.status(200).json({
      success: true,
      data: {
        vendors: vendors.map(v => ({
          id: v._id,
          name: v.name,
          email: v.email,
          assignedConsultant: v.assignedConsultant ? {
            id: v.assignedConsultant._id,
            name: v.assignedConsultant.name,
            email: v.assignedConsultant.email
          } : null
        })),
        consultants: consultants.map(c => ({
          id: c._id,
          name: c.name,
          email: c.email
        })),
        currentUser: {
          id: req.user._id,
          name: req.user.name,
          email: req.user.email,
          role: req.user.role
        }
      }
    });
  } catch (error) {
    console.error('Debug assignments error:', error);
    res.status(500).json({
      success: false,
      message: 'Could not fetch debug data',
      error: error.message
    });
  }
});

module.exports = router;