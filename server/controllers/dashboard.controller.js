/**
 * Dashboard Controller
 * Handles all dashboard related operations
 */

const User = require('../models/user.model');
const Document = require('../models/document.model');
const DocumentSubmission = require('../models/documentSubmission.model');

// @desc    Get admin dashboard data
// @route   GET /api/dashboard/admin
// @access  Private (Admin)
exports.getAdminDashboard = async (req, res) => {
  try {
    // Check if user exists in request
    if (!req.user || !req.user._id) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required. Please log in to access this resource'
      });
    }
    
    console.log('Fetching admin dashboard data');
    
    // Get counts
    const totalVendors = await User.countDocuments({ role: 'vendor' });
    const activeVendors = await User.countDocuments({ role: 'vendor', isActive: true });
    const totalConsultants = await User.countDocuments({ role: 'consultant' });
    const totalDocuments = await Document.countDocuments();
    const pendingApprovals = await User.countDocuments({ 
      role: 'vendor', 
      requiresLoginApproval: true 
    });
    
    // Get document stats by status
    const documentsByStatus = await Document.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      },
      {
        $project: {
          name: {
            $switch: {
              branches: [
                { case: { $eq: ['$_id', 'pending'] }, then: 'Pending' },
                { case: { $eq: ['$_id', 'under_review'] }, then: 'Under Review' },
                { case: { $eq: ['$_id', 'approved'] }, then: 'Approved' },
                { case: { $eq: ['$_id', 'rejected'] }, then: 'Rejected' }
              ],
              default: 'Unknown'
            }
          },
          value: '$count'
        }
      }
    ]);
    
    // Get recent activity (last 10 activities)
    const recentActivity = await Document.find()
      .populate('vendor', 'name company')
      .sort({ updatedAt: -1 })
      .limit(10)
      .select('title status updatedAt vendor');
    
    res.status(200).json({
      success: true,
      data: {
        stats: {
          totalVendors,
          activeVendors,
          totalConsultants,
          totalDocuments,
          pendingApprovals,
          documentsProcessed: totalDocuments
        },
        documentsByStatus,
        recentActivity,
        pendingApprovals: []
      }
    });
  } catch (error) {
    console.error('Get admin dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Could not fetch admin dashboard data',
      error: error.message
    });
  }
};

// @desc    Get vendor dashboard data
// @route   GET /api/dashboard/vendor
// @access  Private (Vendor)
exports.getVendorDashboard = async (req, res) => {
  try {
    // Check if user exists in request
    if (!req.user || !req.user._id) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required. Please log in to access this resource'
      });
    }
    
    const vendorId = req.user._id;
    console.log('Fetching dashboard for vendor ID:', vendorId);
    
    // Debug: Check what statuses exist for this vendor
    const allDocuments = await Document.find({ vendor: vendorId }, 'status title');
    console.log('All documents for vendor:', allDocuments.map(doc => ({ title: doc.title, status: doc.status })));
    
    // First try to get document counts from Document model
    let totalDocuments = await Document.countDocuments({ vendor: vendorId });
    let pendingDocuments = await Document.countDocuments({ 
      vendor: vendorId, 
      status: 'pending'
    });
    let underReviewDocuments = await Document.countDocuments({ 
      vendor: vendorId, 
      status: 'under_review'
    });
    let approvedDocuments = await Document.countDocuments({ 
      vendor: vendorId, 
      status: { $in: ['approved', 'consultant_approved', 'final_approved'] }
    });
    let rejectedDocuments = await Document.countDocuments({ 
      vendor: vendorId, 
      status: { $in: ['rejected', 'consultant_rejected', 'final_rejected'] }
    });
    
    // If no documents found in Document model, try DocumentSubmission model
    if (totalDocuments === 0) {
      console.log('No documents found in Document model, checking DocumentSubmission model');
      
      // Get submissions for this vendor
      const submissions = await DocumentSubmission.find({ vendor: vendorId });
      console.log(`Found ${submissions.length} document submissions`);
      
      // Count documents from submissions
      let totalFromSubmissions = 0;
      let pendingFromSubmissions = 0;
      let underReviewFromSubmissions = 0;
      let approvedFromSubmissions = 0;
      let rejectedFromSubmissions = 0;
      
      submissions.forEach(submission => {
        submission.documents.forEach(doc => {
          totalFromSubmissions++;
          switch (doc.status) {
            case 'pending':
            case 'uploaded': // Count uploaded as pending
              pendingFromSubmissions++;
              break;
            case 'under_review':
              underReviewFromSubmissions++;
              break;
            case 'approved':
              approvedFromSubmissions++;
              break;
            case 'rejected':
              rejectedFromSubmissions++;
              break;
          }
        });
      });
      
      // Use counts from submissions if available
      if (totalFromSubmissions > 0) {
        totalDocuments = totalFromSubmissions;
        pendingDocuments = pendingFromSubmissions;
        underReviewDocuments = underReviewFromSubmissions;
        approvedDocuments = approvedFromSubmissions;
        rejectedDocuments = rejectedFromSubmissions;
      }
    }
    
    console.log('Document counts:', {
      totalDocuments,
      pendingDocuments,
      underReviewDocuments,
      approvedDocuments,
      rejectedDocuments
    });
    
    // Get recent submissions
    let recentDocuments = await Document.find({ vendor: vendorId })
      .sort({ createdAt: -1 })
      .limit(5)
      .select('title documentType status createdAt files reviewNotes feedback');
    
    // Get document status breakdown
    let documentsByStatus = await Document.aggregate([
      { $match: { vendor: vendorId } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      },
      {
        $project: {
          name: {
            $switch: {
              branches: [
                { case: { $eq: ['$_id', 'pending'] }, then: 'Pending' },
                { case: { $eq: ['$_id', 'under_review'] }, then: 'Under Review' },
                { case: { $eq: ['$_id', 'approved'] }, then: 'Approved' },
                { case: { $eq: ['$_id', 'rejected'] }, then: 'Rejected' }
              ],
              default: 'Unknown'
            }
          },
          value: '$count'
        }
      }
    ]);
    
    // If no documents found, try to get from DocumentSubmission
    if (recentDocuments.length === 0 && totalDocuments > 0) {
      const submissions = await DocumentSubmission.find({ vendor: vendorId })
        .sort({ createdAt: -1 })
        .limit(5)
        .populate('vendor', 'name company');
      
      // Format recent documents from submissions
      recentDocuments = [];
      submissions.forEach(submission => {
        submission.documents.forEach(doc => {
          recentDocuments.push({
            _id: doc._id,
            title: doc.documentName || doc.documentType,
            documentType: doc.documentType,
            status: doc.status,
            createdAt: submission.createdAt,
            files: doc.files || [],
            reviewNotes: doc.reviewNotes,
            feedback: doc.feedback
          });
        });
      });
      
      // Limit to 5 and sort by creation date
      recentDocuments = recentDocuments
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 5);
      
      // Create status breakdown from the counts we calculated
      documentsByStatus = [];
      if (pendingDocuments > 0) {
        documentsByStatus.push({ name: 'Pending', value: pendingDocuments });
      }
      if (underReviewDocuments > 0) {
        documentsByStatus.push({ name: 'Under Review', value: underReviewDocuments });
      }
      if (approvedDocuments > 0) {
        documentsByStatus.push({ name: 'Approved', value: approvedDocuments });
      }
      if (rejectedDocuments > 0) {
        documentsByStatus.push({ name: 'Rejected', value: rejectedDocuments });
      }
    }
    
    res.status(200).json({
      success: true,
      data: {
        documentStats: {
          totalDocuments,
          pendingDocuments,
          underReviewDocuments,
          approvedDocuments,
          rejectedDocuments
        },
        recentDocuments,
        documentsByStatus,
        upcomingDeadlines: []
      }
    });
  } catch (error) {
    console.error('Get vendor dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Could not fetch vendor dashboard data',
      error: error.message
    });
  }
};

// @desc    Get consultant dashboard data
// @route   GET /api/dashboard/consultant
// @access  Private (Consultant)
exports.getConsultantDashboard = async (req, res) => {
  try {
    // Check if user exists in request
    if (!req.user || !req.user._id) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required. Please log in to access this resource'
      });
    }
    
    const consultantId = req.user._id;
    const consultantEmail = req.user.email;
    console.log('Fetching dashboard for consultant ID:', consultantId, 'Email:', consultantEmail);
    
    // Get assigned vendors count
    const assignedVendors = await User.countDocuments({ 
      role: 'vendor',
      assignedConsultant: consultantId 
    });
    
    // Get document submissions assigned to this consultant using email
    const submissions = await DocumentSubmission.find({ 
      'consultant.email': consultantEmail 
    }).populate('vendor', 'name company email');
    
    console.log(`Found ${submissions.length} submissions for consultant ${consultantId}`);
    
    // Calculate document statistics from submissions
    let totalPending = 0;
    let totalUnderReview = 0;
    let totalApproved = 0;
    let totalRejected = 0;
    let totalUploaded = 0;
    
    submissions.forEach(submission => {
      submission.documents.forEach(doc => {
        switch (doc.status) {
          case 'pending':
            totalPending++;
            break;
          case 'under_review':
            totalUnderReview++;
            break;
          case 'uploaded': // This seems to be the equivalent of "pending"
            totalUploaded++;
            totalPending++; // Count uploaded as pending for dashboard purposes
            break;
          case 'approved':
            totalApproved++;
            break;
          case 'rejected':
            totalRejected++;
            break;
        }
      });
    });
    
    // Get pending reviews list (documents that need attention)
    const pendingReviewsList = [];
    submissions.forEach(submission => {
      submission.documents.forEach(doc => {
        if (doc.status === 'pending' || doc.status === 'under_review' || doc.status === 'uploaded') {
          pendingReviewsList.push({
            _id: doc._id,
            title: doc.documentName || `${doc.documentType} Document`,
            documentType: doc.documentType,
            status: doc.status,
            createdAt: submission.createdAt,
            vendor: submission.vendor,
            submissionId: submission._id
          });
        }
      });
    });
    
    // Sort by creation date and limit to 10
    pendingReviewsList.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    const limitedPendingReviews = pendingReviewsList.slice(0, 10);
    
    // Get recent activity (recently updated submissions)
    const recentActivity = [];
    const sortedSubmissions = submissions
      .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
      .slice(0, 10);
    
    sortedSubmissions.forEach(submission => {
      // Get the most recent document from the submission
      const mostRecentDoc = submission.documents
        .sort((a, b) => new Date(b.updatedAt || b.uploadDate) - new Date(a.updatedAt || a.uploadDate))[0];
      
      if (mostRecentDoc) {
        recentActivity.push({
          _id: mostRecentDoc._id,
          title: mostRecentDoc.documentName || `${mostRecentDoc.documentType} Document`,
          status: mostRecentDoc.status,
          updatedAt: submission.updatedAt,
          vendor: submission.vendor,
          submissionId: submission._id
        });
      }
    });
    
    console.log('Dashboard stats:', {
      assignedVendors,
      totalPending,
      totalUnderReview,
      totalApproved,
      totalRejected,
      totalUploaded,
      pendingReviewsCount: limitedPendingReviews.length
    });
    
    res.status(200).json({
      success: true,
      data: {
        stats: {
          assignedVendors,
          pendingReviews: totalPending + totalUnderReview,
          documentsApproved: totalApproved,
          documentsRejected: totalRejected,
          totalPending,
          totalApproved,
          totalRejected,
          totalUnderReview,
          totalUploaded
        },
        pendingReviews: limitedPendingReviews,
        vendorPerformance: [],
        recentActivity
      }
    });
  } catch (error) {
    console.error('Get consultant dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Could not fetch consultant dashboard data',
      error: error.message
    });
  }
};

// @desc    Get cross verifier dashboard data
// @route   GET /api/dashboard/cross-verifier
// @access  Private (Cross Verifier)
exports.getCrossVerifierDashboard = (req, res) => {
  res.status(200).json({
    success: true,
    data: {
      stats: {
        pendingVerifications: 0,
        completedVerifications: 0,
        flaggedDocuments: 0
      },
      pendingVerifications: [],
      recentActivity: []
    }
  });
};

// @desc    Get approver dashboard data
// @route   GET /api/dashboard/approver
// @access  Private (Approver)
exports.getApproverDashboard = (req, res) => {
  res.status(200).json({
    success: true,
    data: {
      stats: {
        pendingApprovals: 0,
        approvedDocuments: 0,
        rejectedDocuments: 0
      },
      pendingApprovals: [],
      recentActivity: []
    }
  });
};