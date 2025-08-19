/**
 * Role-based permissions middleware
 * Defines permissions for each role in the system
 */

// Define role-based permissions
const rolePermissions = {
  admin: {
    canViewAllDocuments: true,
    canViewAllUsers: true,
    canCreateUsers: true,
    canEditUsers: true,
    canDeleteUsers: true,
    canApproveDocuments: true,
    canRejectDocuments: true,
    canGenerateReports: true,
    canManageSettings: true,
    canApproveLogins: true,
    canManageConsultants: true,
    canManageVendors: true,
    canGenerateCredentials: true,
    canPerformConsultantReview: true,
    canPerformCrossVerification: true,
    canPerformFinalApproval: true,
    canGenerateMISReports: true,
    canSendAutomatedReminders: true
  },
  consultant: {
    canViewAllDocuments: false,
    canViewAssignedDocuments: true,
    canViewAllUsers: false,
    canViewAssignedVendors: true,
    canApproveDocuments: true,
    canRejectDocuments: true,
    canGenerateReports: true,
    canApproveLogins: true,
    canEditOwnProfile: true,
    canPerformConsultantReview: true,
    canDownloadDocumentSets: true
  },
  cross_verifier: {
    canViewAllDocuments: false,
    canViewAssignedDocuments: true,
    canViewAllUsers: false,
    canPerformCrossVerification: true,
    canDownloadDocumentSets: true,
    canEditOwnProfile: true,
    canGenerateReports: false
  },
  approver: {
    canViewAllDocuments: true,
    canViewAllUsers: false,
    canViewVendorList: true,
    canPerformFinalApproval: true,
    canGenerateApprovalReports: true,
    canDownloadDocumentSets: true,
    canEditOwnProfile: true
  },
  vendor: {
    canViewOwnDocuments: true,
    canUploadDocuments: true,
    canViewOwnProfile: true,
    canEditOwnProfile: true,
    canCreateSubmissions: true,
    canResubmitDocuments: true
  }
};

// Middleware to check if user has required permission
const checkPermission = (permission) => {
  return (req, res, next) => {
    // Get user role from authenticated user
    const userRole = req.user.role;
    
    // Check if role exists in permissions
    if (!rolePermissions[userRole]) {
      return res.status(403).json({
        success: false,
        message: 'Role not recognized'
      });
    }
    
    // Check if role has the required permission
    if (!rolePermissions[userRole][permission]) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to perform this action'
      });
    }
    
    // User has permission, proceed
    next();
  };
};

// Middleware to check document ownership for vendors
const checkDocumentOwnership = async (req, res, next) => {
  try {
    const userRole = req.user.role;
    const userId = req.user.id;
    const documentId = req.params.id;
    
    // If user is admin or consultant, allow access
    if (userRole === 'admin' || userRole === 'consultant') {
      return next();
    }
    
    // If user is vendor, check document ownership
    if (userRole === 'vendor') {
      const Document = require('../models/document.model');
      const document = await Document.findById(documentId);
      
      if (!document) {
        return res.status(404).json({
          success: false,
          message: 'Document not found'
        });
      }
      
      // Check if vendor owns the document
      if (document.vendor.toString() !== userId) {
        return res.status(403).json({
          success: false,
          message: 'You do not have permission to access this document'
        });
      }
    }
    
    // Document ownership verified or not required, proceed
    next();
  } catch (error) {
    console.error('Document ownership check error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Middleware to check if consultant is assigned to vendor
const checkConsultantAssignment = async (req, res, next) => {
  try {
    const userRole = req.user.role;
    const userId = req.user.id;
    const vendorId = req.params.id || req.body.vendorId;
    
    // If user is admin, allow access
    if (userRole === 'admin') {
      return next();
    }
    
    // If user is consultant, check if assigned to vendor
    if (userRole === 'consultant') {
      const User = require('../models/user.model');
      const vendor = await User.findById(vendorId);
      
      if (!vendor) {
        return res.status(404).json({
          success: false,
          message: 'Vendor not found'
        });
      }
      
      // Check if consultant is assigned to vendor
      if (vendor.assignedConsultant && vendor.assignedConsultant.toString() !== userId) {
        return res.status(403).json({
          success: false,
          message: 'You are not assigned to this vendor'
        });
      }
    }
    
    // Consultant assignment verified or not required, proceed
    next();
  } catch (error) {
    console.error('Consultant assignment check error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

module.exports = {
  rolePermissions,
  checkPermission,
  checkDocumentOwnership,
  checkConsultantAssignment
};
