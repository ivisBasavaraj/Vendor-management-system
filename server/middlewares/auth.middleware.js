const jwt = require('jsonwebtoken');
const User = require('../models/user.model');

// Protect routes
exports.protect = async (req, res, next) => {
  let token;

  // Check if token exists in Authorization header
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    // Get token from header
    token = req.headers.authorization.split(' ')[1];
  } 
  // Check if token exists in cookies (for browser clients)
  else if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }

  // If no token found, return error
  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required. Please log in to access this resource'
    });
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Check token expiration
    const expirationTime = new Date(decoded.exp * 1000);
    if (expirationTime < new Date()) {
      return res.status(401).json({
        success: false,
        message: 'Your session has expired. Please log in again'
      });
    }

    // Find user by id
    const user = await User.findById(decoded.id).select('-password');

    // Check if user exists
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication failed. User no longer exists'
      });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Your account has been deactivated. Please contact an administrator'
      });
    }

    // Add user to request object
    req.user = user;
    
    next();
  } catch (err) {
    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid authentication token'
      });
    } else if (err.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Your session has expired. Please log in again'
      });
    }

    return res.status(401).json({
      success: false,
      message: 'Authentication failed. Please log in again'
    });
  }
};

// Grant access to specific roles
exports.authorize = (...roles) => {
  return (req, res, next) => {
    // Check if user exists (should have been set by protect middleware)
    if (!req.user) {
      return res.status(500).json({
        success: false,
        message: 'Server configuration error: User authentication check failed'
      });
    }

    // Check if user role is allowed
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. ${req.user.role.charAt(0).toUpperCase() + req.user.role.slice(1)} accounts are not authorized to access this resource`
      });
    }
    
    next();
  };
}; 