const ActivityLog = require('../models/activityLog.model');
const User = require('../models/user.model');
const Document = require('../models/document.model');

/**
 * Create a new activity log entry
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
exports.createActivityLog = async (req, res) => {
  try {
    const activityData = req.body;
    
    // Create the activity log
    const activityLog = new ActivityLog(activityData);
    await activityLog.save();
    
    return res.status(201).json({
      success: true,
      message: 'Activity log created successfully',
      data: activityLog
    });
  } catch (error) {
    console.error('Error creating activity log:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create activity log',
      error: error.message
    });
  }
};

/**
 * Get all activity logs with pagination and filtering
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
exports.getAllActivityLogs = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      userType, 
      action, 
      startDate, 
      endDate, 
      search 
    } = req.query;
    
    console.log('Fetching activity logs with params:', { 
      page, limit, userType, action, startDate, endDate, search 
    });
    
    // Build query filters
    const filter = {};
    
    // Filter by user type
    if (userType && userType !== 'all') {
      filter.userType = userType;
    }
    
    // Filter by action
    if (action && action !== 'all') {
      filter.action = action;
    }
    
    // Filter by date range
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) {
        filter.createdAt.$gte = new Date(startDate);
      }
      if (endDate) {
        // Set the end date to the end of the day
        const endOfDay = new Date(endDate);
        endOfDay.setHours(23, 59, 59, 999);
        filter.createdAt.$lte = endOfDay;
      }
    }
    
    // Search functionality
    if (search) {
      const searchRegex = new RegExp(search, 'i');
      filter.$or = [
        { userName: searchRegex },
        { action: searchRegex },
        { description: searchRegex },
        { documentType: searchRegex }
      ];
    }
    
    console.log('Using filter:', JSON.stringify(filter));
    
    // First, check if we have any activity logs at all
    const totalCount = await ActivityLog.countDocuments({});
    console.log('Total activity logs in database:', totalCount);
    
    if (totalCount === 0) {
      // If no logs exist, return empty array
      return res.status(200).json({
        success: true,
        message: 'No activity logs found in the database',
        data: [],
        pagination: {
          total: 0,
          page: parseInt(page, 10),
          pages: 0,
          limit: parseInt(limit, 10)
        }
      });
    }
    
    // Execute query with pagination
    const options = {
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      sort: { createdAt: -1 }, // Sort by most recent first
      populate: [
        { path: 'documentId', select: 'name type status' }
      ]
    };
    
    // Try using the paginate method
    try {
      const activityLogs = await ActivityLog.paginate(filter, options);
      
      console.log('Activity logs retrieved:', activityLogs.docs.length);
      
      return res.status(200).json({
        success: true,
        message: 'Activity logs retrieved successfully',
        data: activityLogs.docs,
        pagination: {
          total: activityLogs.totalDocs,
          page: activityLogs.page,
          pages: activityLogs.totalPages,
          limit: activityLogs.limit
        }
      });
    } catch (paginateError) {
      console.error('Error using paginate method:', paginateError);
      
      // Fallback to regular find if paginate fails
      console.log('Falling back to regular find method');
      const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
      const docs = await ActivityLog.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit, 10))
        .populate({ path: 'documentId', select: 'name type status' });
      
      const count = await ActivityLog.countDocuments(filter);
      
      return res.status(200).json({
        success: true,
        message: 'Activity logs retrieved successfully (fallback method)',
        data: docs,
        pagination: {
          total: count,
          page: parseInt(page, 10),
          pages: Math.ceil(count / parseInt(limit, 10)),
          limit: parseInt(limit, 10)
        }
      });
    }
  } catch (error) {
    console.error('Error retrieving activity logs:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve activity logs',
      error: error.message
    });
  }
};

/**
 * Get activity logs for a specific user by role
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
exports.getUserActivityLogs = async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 20 } = req.query;
    
    // Verify user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Query activity logs for this user
    const options = {
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      sort: { createdAt: -1 }
    };
    
    const filter = {
      userId: userId,
      userModel: 'User'
    };
    
    const activityLogs = await ActivityLog.paginate(filter, options);
    
    return res.status(200).json({
      success: true,
      message: `${user.role.charAt(0).toUpperCase() + user.role.slice(1)} activity logs retrieved successfully`,
      data: activityLogs.docs,
      pagination: {
        total: activityLogs.totalDocs,
        page: activityLogs.page,
        pages: activityLogs.totalPages,
        limit: activityLogs.limit
      }
    });
  } catch (error) {
    console.error('Error retrieving user activity logs:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve user activity logs',
      error: error.message
    });
  }
};

/**
 * Get activity logs for vendors
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
exports.getVendorActivityLogs = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    
    // Query activity logs for vendors
    const options = {
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      sort: { createdAt: -1 }
    };
    
    const filter = {
      userType: 'vendor'
    };
    
    // If a specific vendor ID is provided
    if (req.params.vendorId) {
      filter.userId = req.params.vendorId;
      
      // Verify vendor exists
      const vendor = await User.findOne({ _id: req.params.vendorId, role: 'vendor' });
      if (!vendor) {
        return res.status(404).json({
          success: false,
          message: 'Vendor not found'
        });
      }
    }
    
    const activityLogs = await ActivityLog.paginate(filter, options);
    
    return res.status(200).json({
      success: true,
      message: 'Vendor activity logs retrieved successfully',
      data: activityLogs.docs,
      pagination: {
        total: activityLogs.totalDocs,
        page: activityLogs.page,
        pages: activityLogs.totalPages,
        limit: activityLogs.limit
      }
    });
  } catch (error) {
    console.error('Error retrieving vendor activity logs:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve vendor activity logs',
      error: error.message
    });
  }
};

/**
 * Get activity logs for consultants
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
exports.getConsultantActivityLogs = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    
    // Query activity logs for consultants
    const options = {
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      sort: { createdAt: -1 }
    };
    
    const filter = {
      userType: 'consultant'
    };
    
    // If a specific consultant ID is provided
    if (req.params.consultantId) {
      filter.userId = req.params.consultantId;
      
      // Verify consultant exists
      const consultant = await User.findOne({ _id: req.params.consultantId, role: 'consultant' });
      if (!consultant) {
        return res.status(404).json({
          success: false,
          message: 'Consultant not found'
        });
      }
    }
    
    const activityLogs = await ActivityLog.paginate(filter, options);
    
    return res.status(200).json({
      success: true,
      message: 'Consultant activity logs retrieved successfully',
      data: activityLogs.docs,
      pagination: {
        total: activityLogs.totalDocs,
        page: activityLogs.page,
        pages: activityLogs.totalPages,
        limit: activityLogs.limit
      }
    });
  } catch (error) {
    console.error('Error retrieving consultant activity logs:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve consultant activity logs',
      error: error.message
    });
  }
};

/**
 * Get activity logs for a specific document
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
exports.getDocumentActivityLogs = async (req, res) => {
  try {
    const { documentId } = req.params;
    
    // Verify document exists
    const document = await Document.findById(documentId);
    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Document not found'
      });
    }
    
    // Query activity logs for this document
    const activityLogs = await ActivityLog.find({ documentId })
      .sort({ createdAt: -1 })
      .exec();
    
    return res.status(200).json({
      success: true,
      message: 'Document activity logs retrieved successfully',
      data: activityLogs
    });
  } catch (error) {
    console.error('Error retrieving document activity logs:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve document activity logs',
      error: error.message
    });
  }
};

/**
 * Get activity statistics
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
exports.getActivityStats = async (req, res) => {
  try {
    console.log('Fetching activity statistics');
    
    // First, check if we have any activity logs at all
    const totalCount = await ActivityLog.countDocuments({});
    console.log('Total activity logs in database:', totalCount);
    
    if (totalCount === 0) {
      console.log('No activity logs found, returning empty stats');
      return res.status(200).json({
        success: true,
        message: 'No activity logs found in the database',
        data: {
          userTypeCounts: { vendor: 0, consultant: 0, admin: 0, system: 0 },
          topActions: [],
          dailyActivity: []
        }
      });
    }
    
    // Get counts by user type
    const userTypeCounts = await ActivityLog.aggregate([
      {
        $group: {
          _id: '$userType',
          count: { $sum: 1 }
        }
      }
    ]);
    
    console.log('User type counts:', userTypeCounts);
    
    // Get counts by action type
    const actionCounts = await ActivityLog.aggregate([
      {
        $group: {
          _id: '$action',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      },
      {
        $limit: 10 // Top 10 actions
      }
    ]);
    
    console.log('Action counts:', actionCounts);
    
    // Get activity counts by day for the last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const dailyActivity = await ActivityLog.aggregate([
      {
        $match: {
          createdAt: { $gte: thirtyDaysAgo }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
            day: { $dayOfMonth: '$createdAt' }
          },
          count: { $sum: 1 },
          vendorCount: {
            $sum: { $cond: [{ $eq: ['$userType', 'vendor'] }, 1, 0] }
          },
          consultantCount: {
            $sum: { $cond: [{ $eq: ['$userType', 'consultant'] }, 1, 0] }
          },
          adminCount: {
            $sum: { $cond: [{ $eq: ['$userType', 'admin'] }, 1, 0] }
          }
        }
      },
      {
        $sort: {
          '_id.year': 1,
          '_id.month': 1,
          '_id.day': 1
        }
      }
    ]);
    
    console.log('Daily activity data:', dailyActivity);
    
    // Format the daily activity data
    const formattedDailyActivity = dailyActivity.map(day => ({
      date: `${day._id.year}-${day._id.month.toString().padStart(2, '0')}-${day._id.day.toString().padStart(2, '0')}`,
      total: day.count,
      vendor: day.vendorCount,
      consultant: day.consultantCount,
      admin: day.adminCount
    }));
    
    // Create a user type counts object with defaults for all types
    const userTypeCountsObj = {
      vendor: 0,
      consultant: 0,
      admin: 0,
      system: 0
    };
    
    // Fill in actual counts
    userTypeCounts.forEach(item => {
      if (item._id) {
        userTypeCountsObj[item._id] = item.count;
      }
    });
    
    console.log('Formatted user type counts:', userTypeCountsObj);
    
    return res.status(200).json({
      success: true,
      message: 'Activity statistics retrieved successfully',
      data: {
        userTypeCounts: userTypeCountsObj,
        topActions: actionCounts,
        dailyActivity: formattedDailyActivity
      }
    });
  } catch (error) {
    console.error('Error retrieving activity statistics:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve activity statistics',
      error: error.message
    });
  }
};

/**
 * Log middleware to automatically capture API activities
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @param {Function} next - Next middleware function
 */
exports.logActivity = (action) => {
  return async (req, res, next) => {
    // Store the original end function
    const originalEnd = res.end;
    
    // Override the end function
    res.end = async function(chunk, encoding) {
      // Restore the original end function
      res.end = originalEnd;
      
      // Call the original end function
      res.end(chunk, encoding);
      
      try {
        // Only log successful requests
        if (res.statusCode >= 200 && res.statusCode < 300) {
          let userId, userModel, userName, userType;
          
          // Extract user information from the request
          if (req.user) {
            userId = req.user._id;
            userModel = 'User'; // All users are in the User model
            userName = req.user.name || req.user.companyName || 'Unknown User';
            userType = req.user.role || 'system';
          } else {
            userModel = 'System';
            userName = 'System';
            userType = 'system';
          }
          
          // Create activity log
          const activityLog = new ActivityLog({
            userId,
            userModel,
            userName,
            userType,
            action,
            description: `${req.method} ${req.originalUrl}`,
            ipAddress: req.ip,
            metadata: {
              method: req.method,
              url: req.originalUrl,
              body: req.body,
              params: req.params,
              query: req.query
            },
            status: 'success'
          });
          
          // If there's a document ID in the request, add it
          if (req.params.documentId) {
            activityLog.documentId = req.params.documentId;
            
            // Try to get document type
            try {
              const document = await Document.findById(req.params.documentId);
              if (document) {
                activityLog.documentType = document.type;
              }
            } catch (err) {
              console.error('Error getting document type:', err);
            }
          }
          
          await activityLog.save();
        }
      } catch (error) {
        console.error('Error logging activity:', error);
        // Don't throw error, just log it
      }
    };
    
    next();
  };
};

/**
 * Manually log an activity
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
exports.manualLogActivity = async (req, res) => {
  try {
    const { action, description, documentId, documentType, status } = req.body;
    
    if (!action) {
      return res.status(400).json({
        success: false,
        message: 'Action is required'
      });
    }
    
    let userId, userModel, userName, userType;
    
    // Extract user information from the request
    if (req.user) {
      userId = req.user._id;
      userModel = 'User'; // All users are in the User model
      userName = req.user.name || req.user.companyName || 'Unknown User';
      userType = req.user.role || 'system';
    } else {
      userModel = 'System';
      userName = 'System';
      userType = 'system';
    }
    
    // Create activity log
    const activityLog = new ActivityLog({
      userId,
      userModel,
      userName,
      userType,
      action,
      description: description || `Manual log: ${action}`,
      documentId,
      documentType: documentType || '-',
      ipAddress: req.ip,
      status: status || 'success'
    });
    
    await activityLog.save();
    
    return res.status(201).json({
      success: true,
      message: 'Activity logged successfully',
      data: activityLog
    });
  } catch (error) {
    console.error('Error manually logging activity:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to log activity',
      error: error.message
    });
  }
};

/**
 * Create test activity logs (for development only)
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
exports.createTestActivityLogs = async (req, res) => {
  try {
    // Only allow in development environment
    if (process.env.NODE_ENV === 'production') {
      return res.status(403).json({
        success: false,
        message: 'This endpoint is only available in development mode'
      });
    }
    
    // Create sample activity logs
    const testLogs = [
      {
        userModel: 'User',
        userName: 'John Vendor',
        userType: 'vendor',
        action: 'Document Upload',
        description: 'Uploaded a new document',
        documentType: 'Invoice',
        ipAddress: '192.168.1.1',
        status: 'success'
      },
      {
        userModel: 'User',
        userName: 'Jane Consultant',
        userType: 'consultant',
        action: 'Document Review',
        description: 'Reviewed vendor document',
        documentType: 'Contract',
        ipAddress: '192.168.1.2',
        status: 'success'
      },
      {
        userModel: 'User',
        userName: 'Admin User',
        userType: 'admin',
        action: 'User Management',
        description: 'Added a new vendor',
        ipAddress: '192.168.1.3',
        status: 'success'
      },
      {
        userModel: 'System',
        userName: 'System',
        userType: 'system',
        action: 'Automated Process',
        description: 'Daily report generation',
        ipAddress: '127.0.0.1',
        status: 'success'
      },
      {
        userModel: 'User',
        userName: 'John Vendor',
        userType: 'vendor',
        action: 'User Login',
        description: 'User logged in',
        ipAddress: '192.168.1.1',
        status: 'success'
      }
    ];
    
    // Save all test logs
    const savedLogs = await ActivityLog.insertMany(testLogs);
    
    return res.status(201).json({
      success: true,
      message: 'Test activity logs created successfully',
      count: savedLogs.length,
      data: savedLogs
    });
  } catch (error) {
    console.error('Error creating test activity logs:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create test activity logs',
      error: error.message
    });
  }
};