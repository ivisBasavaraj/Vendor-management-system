const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

// JWT secret from environment variables or default
const JWT_SECRET = process.env.JWT_SECRET || 'mansi';

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide a name'],
    trim: true,
    maxlength: [50, 'Name cannot be more than 50 characters']
  },
  email: {
    type: String,
    required: [true, 'Please provide an email'],
    unique: true,
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      'Please provide a valid email'
    ],
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: [true, 'Please provide a password'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false // Don't return password by default
  },
  role: {
    type: String,
    enum: ['vendor', 'consultant', 'cross_verifier', 'approver', 'admin', 'imtma'],
    default: 'vendor'
  },
  logo: {
    type: String,
    trim: true
  },
  company: {
    type: String,
    trim: true
  },
  phone: {
    type: String,
    trim: true
  },
  address: {
    type: String,
    trim: true
  },
  workLocation: {
    type: String,
    trim: true,
    default: 'Bangalore'
  },
  agreementPeriod: {
    type: String,
    trim: true,
    default: 'Annual Contract'
  },
  companyRegNo: {
    type: String,
    trim: true
  },
  taxId: {
    type: String,
    trim: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  requiresLoginApproval: {
    type: Boolean,
    default: function() {
      // All vendors require login approval by default
      return this.role === 'vendor';
    }
  },
  assignedConsultant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  resetPasswordToken: String,
  resetPasswordExpire: Date,
  lastLogin: Date,
  firstLoginCompleted: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Encrypt password before save
UserSchema.pre('save', async function(next) {
  // Only hash the password if it's modified or new
  if (!this.isModified('password')) {
    return next();
  }

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Sign JWT and return
UserSchema.methods.getSignedJwtToken = function() {
  return jwt.sign({ id: this._id }, JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '30d'
  });
};

// Match user entered password to hashed password in database
UserSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Generate and hash password reset token
UserSchema.methods.getResetPasswordToken = function() {
  // Generate token
  const resetToken = crypto.randomBytes(20).toString('hex');

  // Hash token and set to resetPasswordToken field
  this.resetPasswordToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  // Set expire time
  this.resetPasswordExpire = Date.now() + 10 * 60 * 1000; // 10 minutes

  return resetToken;
};

// Check if vendor has valid login approval
UserSchema.methods.hasValidLoginApproval = async function() {
  if (!this.requiresLoginApproval) {
    return true;
  }

  // Import the LoginApproval model
  const LoginApproval = require('./loginApproval.model');
  
  // Check for an active approval that hasn't expired
  const activeApproval = await LoginApproval.findOne({
    vendor: this._id,
    status: 'approved',
    expiresAt: { $gt: new Date() }
  });
  
  return !!activeApproval;
};

module.exports = mongoose.model('User', UserSchema);