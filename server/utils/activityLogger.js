const ActivityLog = require('../models/activityLog.model');
const Document = require('../models/document.model');

/**
 * Utility to log user activities
 */
const activityLogger = {
  /**
   * Log a user login activity
   * @param {Object} user - User object
   * @param {String} ipAddress - IP address of the user
   */
  logLogin: async (user, ipAddress) => {
    try {
      if (!user) return;
      
      const userModel = 'User'; // All users are in the User model
      const userName = user.name || user.companyName || 'Unknown User';
      
      const activityLog = new ActivityLog({
        userId: user._id,
        userModel,
        userName,
        userType: user.role,
        action: 'User Login',
        description: `${userName} logged in`,
        ipAddress,
        status: 'success'
      });
      
      await activityLog.save();
    } catch (error) {
      console.error('Error logging login activity:', error);
    }
  },
  
  /**
   * Log a document activity
   * @param {Object} user - User object
   * @param {String} action - Action performed
   * @param {Object} document - Document object
   * @param {String} ipAddress - IP address of the user
   * @param {String} description - Optional description
   */
  logDocumentActivity: async (user, action, document, ipAddress, description = '') => {
    try {
      if (!user || !document) return;
      
      const userModel = 'User'; // All users are in the User model
      const userName = user.name || user.companyName || 'Unknown User';
      
      const activityLog = new ActivityLog({
        userId: user._id,
        userModel,
        userName,
        userType: user.role,
        action,
        description: description || `${action} - ${document.name || document.title || 'Document'}`,
        documentId: document._id,
        documentType: document.type || document.documentType || '-',
        ipAddress,
        status: 'success'
      });
      
      await activityLog.save();
    } catch (error) {
      console.error('Error logging document activity:', error);
    }
  },
  
  /**
   * Log a user activity
   * @param {Object} user - User object
   * @param {String} action - Action performed
   * @param {String} ipAddress - IP address of the user
   * @param {String} description - Optional description
   * @param {Object} metadata - Optional metadata
   */
  logUserActivity: async (user, action, ipAddress, description = '', metadata = {}) => {
    try {
      if (!user) return;
      
      const userModel = 'User'; // All users are in the User model
      const userName = user.name || user.companyName || 'Unknown User';
      
      const activityLog = new ActivityLog({
        userId: user._id,
        userModel,
        userName,
        userType: user.role,
        action,
        description: description || `${action}`,
        ipAddress,
        metadata,
        status: 'success'
      });
      
      await activityLog.save();
    } catch (error) {
      console.error('Error logging user activity:', error);
    }
  },
  
  /**
   * Log a system activity
   * @param {String} action - Action performed
   * @param {String} description - Description of the activity
   * @param {Object} metadata - Optional metadata
   */
  logSystemActivity: async (action, description, metadata = {}) => {
    try {
      const activityLog = new ActivityLog({
        userModel: 'System',
        userName: 'System',
        userType: 'admin',
        action,
        description,
        metadata,
        status: 'success'
      });
      
      await activityLog.save();
    } catch (error) {
      console.error('Error logging system activity:', error);
    }
  },
  
  /**
   * Log an error activity
   * @param {Object} user - User object (optional)
   * @param {String} action - Action that failed
   * @param {Error} error - Error object
   * @param {String} ipAddress - IP address of the user
   */
  logErrorActivity: async (user, action, error, ipAddress) => {
    try {
      let userId, userModel, userName, userType;
      
      if (user) {
        userId = user._id;
        userModel = 'User'; // All users are in the User model
        userName = user.name || user.companyName || 'Unknown User';
        userType = user.role;
      } else {
        userModel = 'System';
        userName = 'System';
        userType = 'admin';
      }
      
      const activityLog = new ActivityLog({
        userId,
        userModel,
        userName,
        userType,
        action,
        description: `Error: ${error.message}`,
        ipAddress,
        metadata: {
          errorMessage: error.message,
          errorStack: error.stack
        },
        status: 'failed'
      });
      
      await activityLog.save();
    } catch (logError) {
      console.error('Error logging error activity:', logError);
    }
  }
};

module.exports = activityLogger;