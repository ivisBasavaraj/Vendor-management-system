const User = require('../models/user.model');
const emailService = require('../utils/emailService');
const { getProfileImageUrl } = require('../utils/profileImageUpload');

const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const DocModel = require('../models/document.model');

// Helper function to validate ObjectId
const validateObjectId = (id, paramName = 'ID') => {
  if (!id || typeof id !== 'string') {
    throw new Error(`Invalid ${paramName} provided: must be a string`);
  }
  if (!/^[0-9a-fA-F]{24}$/.test(id)) {
    throw new Error(`Invalid ${paramName} format: must be a valid ObjectId`);
  }
  return id;
};

// Get all users (with filtering)
exports.getUsers = async (req, res) => {
  try {
    let query = {};

    // Filter by role if provided
    if (req.query.role) {
      query.role = req.query.role;
    }

    // Search by name or email
    if (req.query.search) {
      query.$or = [
        { name: { $regex: req.query.search, $options: 'i' } },
        { email: { $regex: req.query.search, $options: 'i' } },
        { company: { $regex: req.query.search, $options: 'i' } }
      ];
    }

    // Pagination
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const total = await User.countDocuments(query);

    // Get users with pagination
    const users = await User.find(query)
      .select('-password')
      .populate('assignedConsultant', 'name email phone')
      .sort({ createdAt: -1 })
      .skip(startIndex)
      .limit(limit);

    // Pagination result
    const pagination = {};

    if (endIndex < total) {
      pagination.next = {
        page: page + 1,
        limit
      };
    }

    if (startIndex > 0) {
      pagination.prev = {
        page: page - 1,
        limit
      };
    }

    res.status(200).json({
      success: true,
      count: users.length,
      pagination,
      data: users,
      total
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      message: 'Could not fetch users',
      error: error.message
    });
  }
};

// Get single user by ID
exports.getUserById = async (req, res) => {
  try {
    // Validate the ID parameter
    const userId = validateObjectId(req.params.id, 'User ID');
    console.log('Fetching user with validated ID:', userId);
    
    const user = await User.findById(userId)
      .select('-password')
      .populate('assignedConsultant', 'name email phone');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check permissions - users can only access their own data
    // (except admins, consultants with assigned vendors, and vendors accessing their consultants)
    if (req.user.role !== 'admin') {
      if (req.user._id.toString() !== user._id.toString()) {
        // Consultants can access their assigned vendors
        if (req.user.role === 'consultant' && user.role === 'vendor') {
          const vendor = await User.findById(user._id);
          if (!vendor || vendor.assignedConsultant?.toString() !== req.user._id.toString()) {
            return res.status(403).json({
              success: false,
              message: 'Not authorized to access this user data'
            });
          }
        } 
        // Vendors can access their assigned consultant
        else if (req.user.role === 'vendor' && user.role === 'consultant') {
          const vendor = await User.findById(req.user._id);
          if (!vendor || vendor.assignedConsultant?.toString() !== user._id.toString()) {
            return res.status(403).json({
              success: false,
              message: 'Not authorized to access this user data'
            });
          }
        }
        else {
          return res.status(403).json({
            success: false,
            message: 'Not authorized to access this user data'
          });
        }
      }
    }

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      message: 'Could not fetch user',
      error: error.message
    });
  }
};

// Create user (admin only)
exports.createUser = async (req, res) => {
  try {
    const { 
      name, 
      email, 
      role, 
      company, 
      phone, 
      address, 
      workLocation,
      agreementPeriod,
      companyRegNo,
      taxId,
      password: providedPassword, 
      assignedConsultant 
    } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Email already registered'
      });
    }

    // Generate a random password if not provided
    const password = providedPassword || crypto.randomBytes(8).toString('hex');

    // Create user data
    const userData = {
      name,
      email,
      password,
      role,
      company,
      phone,
      address,
      workLocation,
      agreementPeriod,
      companyRegNo,
      taxId
    };

    // Add profile image if uploaded
    if (req.file) {
      userData.logo = getProfileImageUrl(req.file.filename);
    }

    // Add assigned consultant if creating a vendor
    if (role === 'vendor' && assignedConsultant) {
      userData.assignedConsultant = assignedConsultant;
    }

    // Create user
    const user = await User.create(userData);

    // Send welcome email with all user information
    let emailResults = null;
    
    try {
      // Get assigned consultant details if available (for vendors)
      let consultant = null;
      if (role === 'vendor' && assignedConsultant) {
        consultant = await User.findById(assignedConsultant).select('name email phone');
      }

      // Send welcome email to the new user (vendor or consultant)
      emailResults = await emailService.sendUserWelcomeEmail(user, password, consultant);
      
      if (!emailResults.success) {
        console.error('Welcome email sending failed:', emailResults.error);
        // Continue with user creation even if email fails
      } else {
        console.log(`Welcome email sent successfully to ${user.role}: ${user.email}`);
      }
    } catch (emailError) {
      console.error('Error in email sending process:', emailError);
      emailResults = {
        success: false,
        error: emailError.message
      };
    }

    // Remove password from response
    const userResponse = user.toObject();
    delete userResponse.password;

    res.status(201).json({
      success: true,
      data: userResponse,
      emailStatus: emailResults
    });
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({
      success: false,
      message: 'Could not create user',
      error: error.message
    });
  }
};

// Update user
exports.updateUser = async (req, res) => {
  try {
    const { name, email, role, company, phone, address, isActive, workLocation, agreementPeriod, companyRegNo, taxId } = req.body;

    // If updating email, check if it's already taken
    if (email) {
      const existingUser = await User.findOne({ email, _id: { $ne: req.params.id } });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'Email already registered'
        });
      }
    }

    // Find the user
    let user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check permissions
    if (req.user.role !== 'admin') {
      if (req.user._id.toString() !== user._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to update this user'
        });
      }
      
      // Non-admin users can't change their own role
      if (role && role !== user.role) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to change user role'
        });
      }
    }

    // Update fields
    if (name) user.name = name;
    if (email) user.email = email;
    if (role && req.user.role === 'admin') user.role = role;
    if (company) user.company = company;
    if (phone) user.phone = phone;
    if (address) user.address = address;
    if (workLocation) user.workLocation = workLocation;
    if (agreementPeriod) user.agreementPeriod = agreementPeriod;
    if (companyRegNo) user.companyRegNo = companyRegNo;
    if (taxId) user.taxId = taxId;
    if (isActive !== undefined && req.user.role === 'admin') user.isActive = isActive;

    await user.save();

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({
      success: false,
      message: 'Could not update user',
      error: error.message
    });
  }
};

// Delete user
exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    await user.deleteOne();

    res.status(200).json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({
      success: false,
      message: 'Could not delete user',
      error: error.message
    });
  }
};

// Get all vendors
exports.getVendors = async (req, res) => {
  try {
    let query = { role: 'vendor' };
    
    // If the user is a consultant, only show vendors assigned to them
    if (req.user.role === 'consultant') {
      query.assignedConsultant = req.user._id;
    }
    
    // Check if assignedToMe parameter is provided
    if (req.query.assignedToMe === 'true' && req.user.role === 'consultant') {
      query.assignedConsultant = req.user._id;
    }
    
    // Check if consultantId parameter is provided
    if (req.query.consultantId && (req.user.role === 'admin' || req.user._id.toString() === req.query.consultantId)) {
      query.assignedConsultant = req.query.consultantId;
    }
    
    console.log('=== VENDOR QUERY DEBUG ===');
    console.log('Request user:', {
      id: req.user._id,
      role: req.user.role,
      name: req.user.name,
      email: req.user.email
    });
    console.log('Query parameters:', req.query);
    console.log('Final vendor query:', query);
    
    const vendors = await User.find(query)
      .select('-password')
      .populate('assignedConsultant', 'name email')
      .sort({ createdAt: -1 });
    
    console.log('Found vendors:', vendors.length);
    
    if (vendors.length > 0) {
      console.log('Sample vendor data:', {
        name: vendors[0].name,
        email: vendors[0].email,
        assignedConsultant: vendors[0].assignedConsultant,
        lastLogin: vendors[0].lastLogin,
        createdAt: vendors[0].createdAt
      });
    } else {
      // Let's check if there are any vendors at all
      const allVendors = await User.find({ role: 'vendor' }).select('name email assignedConsultant');
      console.log('Total vendors in database:', allVendors.length);
      if (allVendors.length > 0) {
        console.log('All vendors with assignments:', allVendors.map(v => ({
          name: v.name,
          email: v.email,
          assignedConsultant: v.assignedConsultant,
          assignedConsultantString: v.assignedConsultant ? v.assignedConsultant.toString() : null
        })));
        
        // Check if any vendor is assigned to the current consultant
        const vendorsAssignedToCurrentConsultant = allVendors.filter(v => 
          v.assignedConsultant && v.assignedConsultant.toString() === req.user._id.toString()
        );
        console.log('Vendors assigned to current consultant:', vendorsAssignedToCurrentConsultant.length);
        
        // Also check by email to see if there's a consultant with the specific email
        const consultantByEmail = await User.findOne({ 
          email: 'ppkrishnaprasad06048@gmail.com', 
          role: 'consultant' 
        });
        if (consultantByEmail) {
          console.log('Found consultant by email:', {
            id: consultantByEmail._id,
            name: consultantByEmail.name,
            email: consultantByEmail.email
          });
          
          const vendorsForSpecificConsultant = allVendors.filter(v => 
            v.assignedConsultant && v.assignedConsultant.toString() === consultantByEmail._id.toString()
          );
          console.log('Vendors assigned to ppkrishnaprasad06048@gmail.com:', vendorsForSpecificConsultant.length);
          if (vendorsForSpecificConsultant.length > 0) {
            console.log('Vendor details:', vendorsForSpecificConsultant.map(v => ({
              name: v.name,
              email: v.email
            })));
          }
        }
      }
    }
    console.log('=== END VENDOR QUERY DEBUG ===');

    // If includeAnalytics is true, add analytics data for each vendor
    if (req.query.includeAnalytics === 'true') {
      // Get document counts for each vendor
      const vendorsWithAnalytics = await Promise.all(vendors.map(async (vendor) => {
        const vendorObj = vendor.toObject();
        
        try {
          // Get document counts from both models
          const DocModel = require('../models/document.model');
          const DocumentSubmission = require('../models/documentSubmission.model');
          
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
      
      return res.status(200).json({
        success: true,
        count: vendorsWithAnalytics.length,
        data: vendorsWithAnalytics
      });
    }

    res.status(200).json({
      success: true,
      count: vendors.length,
      data: vendors
    });
  } catch (error) {
    console.error('Get vendors error:', error);
    res.status(500).json({
      success: false,
      message: 'Could not fetch vendors',
      error: error.message
    });
  }
};

// Get all consultants
exports.getConsultants = async (req, res) => {
  try {
    const consultants = await User.find({ role: 'consultant' })
      .select('-password')
      .sort({ createdAt: -1 });
    
    console.log('Found consultants:', consultants.length);
    if (consultants.length > 0) {
      console.log('Sample consultant lastLogin:', consultants[0].lastLogin);
      console.log('Sample consultant data:', {
        name: consultants[0].name,
        email: consultants[0].email,
        lastLogin: consultants[0].lastLogin,
        createdAt: consultants[0].createdAt
      });
    }

    // Add assigned vendors count for each consultant
    const consultantsWithVendorCount = await Promise.all(
      consultants.map(async (consultant) => {
        const vendorCount = await User.countDocuments({
          role: 'vendor',
          assignedConsultant: consultant._id
        });
        
        return {
          ...consultant.toObject(),
          assignedVendorsCount: vendorCount
        };
      })
    );

    res.status(200).json({
      success: true,
      count: consultantsWithVendorCount.length,
      data: consultantsWithVendorCount
    });
  } catch (error) {
    console.error('Get consultants error:', error);
    res.status(500).json({
      success: false,
      message: 'Could not fetch consultants',
      error: error.message
    });
  }
};

// Activate user
exports.activateUser = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isActive: true },
      { new: true, runValidators: true }
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Activate user error:', error);
    res.status(500).json({
      success: false,
      message: 'Could not activate user',
      error: error.message
    });
  }
};

// Deactivate user
exports.deactivateUser = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true, runValidators: true }
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Deactivate user error:', error);
    res.status(500).json({
      success: false,
      message: 'Could not deactivate user',
      error: error.message
    });
  }
};

// Update password
exports.updatePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.params.id).select('+password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check permissions
    if (req.user.role !== 'admin' && req.user._id.toString() !== user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this user\'s password'
      });
    }

    // If not admin, verify current password
    if (req.user.role !== 'admin') {
      const isMatch = await user.matchPassword(currentPassword);
      if (!isMatch) {
        return res.status(401).json({
          success: false,
          message: 'Current password is incorrect'
        });
      }
    }

    user.password = newPassword;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password updated successfully'
    });
  } catch (error) {
    console.error('Update password error:', error);
    res.status(500).json({
      success: false,
      message: 'Could not update password',
      error: error.message
    });
  }
};

// Assign consultant to vendor
exports.assignConsultantToVendor = async (req, res) => {
  try {
    const { consultantId } = req.body;
    const vendorId = req.params.id;

    console.log(`Assigning consultant ${consultantId} to vendor ${vendorId}`);

    // Check if vendor exists
    const vendor = await User.findById(vendorId);
    if (!vendor || vendor.role !== 'vendor') {
      return res.status(404).json({
        success: false,
        message: 'Vendor not found'
      });
    }

    // Check if consultant exists
    const consultant = await User.findById(consultantId);
    if (!consultant || consultant.role !== 'consultant') {
      return res.status(404).json({
        success: false,
        message: 'Consultant not found'
      });
    }

    console.log(`Found vendor ${vendor.name} and consultant ${consultant.name}`);

    // Update vendor with assigned consultant using updateOne to avoid validation issues
    await User.updateOne(
      { _id: vendorId },
      { $set: { assignedConsultant: consultantId } }
    );

    console.log(`Updated vendor's assignedConsultant field`);

    // Also update any existing document submissions for this vendor with the new consultant's information
    try {
      const DocumentSubmission = require('../models/documentSubmission.model');
      
      // Update the consultant field in all the vendor's document submissions
      const updateResult = await DocumentSubmission.updateMany(
        { vendor: vendorId },
        { 
          $set: { 
            'consultant.name': consultant.name,
            'consultant.email': consultant.email
          }
        }
      );
      
      console.log(`Updated ${updateResult.modifiedCount} document submissions with new consultant information`);
    } catch (updateError) {
      console.error('Error updating document submissions:', updateError);
      // Don't fail the whole operation if this part fails
    }

    // Get the updated vendor
    const updatedVendor = await User.findById(vendorId).populate('assignedConsultant');

    res.status(200).json({
      success: true,
      data: updatedVendor,
      message: `Successfully assigned consultant ${consultant.name} to vendor ${vendor.name}`
    });
  } catch (error) {
    console.error('Assign consultant error:', error);
    res.status(500).json({
      success: false,
      message: 'Could not assign consultant to vendor',
      error: error.message
    });
  }
};

// Get vendors assigned to consultant
exports.getVendorsByConsultant = async (req, res) => {
  try {
    const consultantId = req.params.id;

    // Check permissions
    if (req.user.role !== 'admin' && req.user._id.toString() !== consultantId) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view these vendors'
      });
    }

    const vendors = await User.find({
      role: 'vendor',
      assignedConsultant: consultantId
    }).select('-password');

    res.status(200).json({
      success: true,
      count: vendors.length,
      data: vendors
    });
  } catch (error) {
    console.error('Get vendors by consultant error:', error);
    res.status(500).json({
      success: false,
      message: 'Could not fetch vendors',
      error: error.message
    });
  }
};

// Get consultant assigned to vendor
exports.getConsultantByVendor = async (req, res) => {
  try {
    const vendorId = req.params.id;
    const vendor = await User.findById(vendorId).populate('assignedConsultant', '-password');

    if (!vendor || vendor.role !== 'vendor') {
      return res.status(404).json({
        success: false,
        message: 'Vendor not found'
      });
    }

    // Check permissions
    if (req.user.role !== 'admin' && 
        req.user._id.toString() !== vendorId && 
        req.user._id.toString() !== vendor.assignedConsultant?._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this information'
      });
    }

    res.status(200).json({
      success: true,
      data: vendor.assignedConsultant
    });
  } catch (error) {
    console.error('Get consultant by vendor error:', error);
    res.status(500).json({
      success: false,
      message: 'Could not fetch consultant',
      error: error.message
    });
  }
};

// Manage vendor login approval requirement
exports.manageVendorLoginApproval = async (req, res) => {
  try {
    const { requireLoginApproval } = req.body;
    const vendorId = req.params.id;

    const vendor = await User.findById(vendorId);
    if (!vendor || vendor.role !== 'vendor') {
      return res.status(404).json({
        success: false,
        message: 'Vendor not found'
      });
    }

    vendor.requireLoginApproval = requireLoginApproval;
    await vendor.save();

    res.status(200).json({
      success: true,
      data: vendor
    });
  } catch (error) {
    console.error('Manage vendor login approval error:', error);
    res.status(500).json({
      success: false,
      message: 'Could not update vendor login approval setting',
      error: error.message
    });
  }
};

// Admin reset user password
exports.adminResetPassword = async (req, res) => {
  try {
    const userId = req.params.id;
    const { newPassword, confirmPassword } = req.body;
    
    console.log('Admin reset password request for user ID:', userId);
    console.log('Request user role:', req.user?.role);
    
    // Only admins can reset passwords
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to reset passwords'
      });
    }

    // Validate password input
    if (!newPassword || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Both password fields are required'
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Passwords do not match'
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 8 characters long'
      });
    }

    // Validate ObjectId format
    try {
      validateObjectId(userId, 'User ID');
    } catch (validationError) {
      console.error('Invalid user ID format:', validationError.message);
      return res.status(400).json({
        success: false,
        message: validationError.message
      });
    }

    // Find the user
    const user = await User.findById(userId);
    console.log('Found user:', user ? `${user.name} (${user.email})` : 'Not found');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Update user's password with the custom password
    user.password = newPassword;
    await user.save();
    console.log('Password updated successfully for user:', user.email);

    // Create notification for the user
    try {
      const Notification = require('../models/notification.model');
      await Notification.create({
        recipient: user._id,
        type: 'system',
        title: 'Password Reset by Administrator',
        message: `Your password has been reset by an administrator. Please use your new password to log in. For security reasons, consider changing your password after logging in.`,
        priority: 'high'
      });
      console.log('Notification created successfully for user:', user.email);
    } catch (notificationError) {
      console.error('Failed to create notification:', notificationError);
      // Continue even if notification fails
    }

    // Try to send email notification if email service is available
    try {
      const emailService = require('../utils/emailService');
      await emailService.sendPasswordResetNotification(user, newPassword);
    } catch (emailError) {
      console.error('Email notification failed:', emailError);
      // Continue even if email fails
    }

    res.status(200).json({
      success: true,
      message: 'Password updated successfully',
      data: {
        userId: user._id,
        email: user.email,
        name: user.name
      }
    });
  } catch (error) {
    console.error('Admin reset password error:', error);
    res.status(500).json({
      success: false,
      message: 'Could not reset password',
      error: error.message
    });
  }
};

// Send credentials to user
exports.sendCredentials = async (req, res) => {
  try {
    const { email, name, password, role, loginUrl } = req.body;

    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Only admins can send credentials
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to send credentials'
      });
    }

    // Create notification for the user
    const Notification = require('../models/notification.model');
    await Notification.create({
      recipient: user._id,
      type: 'credentials',
      title: 'Your Login Credentials',
      message: `Your account has been created. Use the following credentials to log in:
Email: ${email}
Password: ${password}
Login URL: ${loginUrl}`,
      priority: 'high'
    });

    // In a real-world scenario, you would send an email here
    // For this implementation, we'll just return success

    res.status(200).json({
      success: true,
      message: 'Credentials sent successfully'
    });
  } catch (error) {
    console.error('Send credentials error:', error);
    res.status(500).json({
      success: false,
      message: 'Could not send credentials',
      error: error.message
    });
  }
};

// Get consultant analytics with performance metrics
exports.getConsultantAnalytics = async (req, res) => {
  try {
    // Get all consultants
    const consultants = await User.find({ role: 'consultant' })
      .select('-password')
      .sort({ name: 1 });
    // ... (rest of the code remains the same)
    
    // Get analytics for each consultant
    const consultantsWithAnalytics = await Promise.all(
      consultants.map(async (consultant) => {
        // Count assigned vendors
        const assignedVendors = await User.countDocuments({
          role: 'vendor',
          assignedConsultant: consultant._id
        });
        
        // Get document metrics
        const processedDocuments = await DocModel.countDocuments({
          reviewer: consultant._id
        });
        
        const approvedDocuments = await DocModel.countDocuments({
          reviewer: consultant._id,
          status: { $in: ['approved', 'consultant_approved', 'final_approved'] }
        });
        
        const rejectedDocuments = await DocModel.countDocuments({
          reviewer: consultant._id,
          status: { $in: ['rejected', 'consultant_rejected', 'final_rejected'] }
        });
        
        // Calculate approval rate
        const approvalRate = processedDocuments > 0 ? 
          Math.round((approvedDocuments / processedDocuments) * 100) : 0;
        
        // Calculate average response time (in hours)
        const documents = await DocModel.find({
          reviewer: consultant._id,
          reviewDate: { $exists: true }
        }).select('submissionDate reviewDate');
        
        let avgResponseTime = 0;
        
        if (documents.length > 0) {
          const totalResponseTime = documents.reduce((total, doc) => {
            const submissionDate = new Date(doc.submissionDate);
            const reviewDate = new Date(doc.reviewDate);
            return total + ((reviewDate - submissionDate) / (1000 * 60 * 60)); // Convert to hours
          }, 0);
          
          avgResponseTime = Math.round(totalResponseTime / documents.length);
        }
        
        // Return consultant with analytics
        return {
          ...consultant.toObject(),
          metrics: {
            assignedVendors,
            processedDocuments,
            approvedDocuments,
            rejectedDocuments,
            approvalRate,
            avgResponseTime
          }
        };
      })
    );
    
    res.status(200).json({
      success: true,
      count: consultantsWithAnalytics.length,
      data: consultantsWithAnalytics
    });
  } catch (error) {
    console.error('Get consultant analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Could not fetch consultant analytics',
      error: error.message
    });
  }
};

// Get vendor analytics with document compliance status
exports.getVendorAnalytics = async (req, res) => {
  try {
    // Get all vendors
    const vendors = await User.find({ role: 'vendor' })
      .select('-password')
      .populate('assignedConsultant', 'name email')
      .sort({ name: 1 });
    
    // Get analytics for each vendor
    const vendorsWithAnalytics = await Promise.all(
      vendors.map(async (vendor) => {
        // Get document stats
        const totalDocuments = await DocModel.countDocuments({
          vendor: vendor._id
        });
        
        const approvedDocuments = await DocModel.countDocuments({
          vendor: vendor._id,
          status: { $in: ['approved', 'consultant_approved', 'final_approved'] }
        });
        
        const pendingDocuments = await DocModel.countDocuments({
          vendor: vendor._id,
          status: { $in: ['pending', 'under_review'] }
        });
        
        const rejectedDocuments = await DocModel.countDocuments({
          vendor: vendor._id,
          status: { $in: ['rejected', 'consultant_rejected', 'final_rejected'] }
        });
        
        // Calculate compliance rate
        const complianceRate = totalDocuments > 0 ? 
          Math.round((approvedDocuments / totalDocuments) * 100) : 0;
        
        // Get last activity (latest document submission or update)
        const latestDoc = await DocModel.findOne({
          vendor: vendor._id
        })
        .sort({ updatedAt: -1 })
        .select('updatedAt');
        
        const lastActivity = latestDoc ? latestDoc.updatedAt : vendor.updatedAt;
        
        // Return vendor with analytics
        return {
          ...vendor.toObject(),
          analytics: {
            totalDocuments,
            approvedDocuments,
            pendingDocuments,
            rejectedDocuments,
            complianceRate,
            lastActivity
          }
        };
      })
    );
    
    res.status(200).json({
      success: true,
      count: vendorsWithAnalytics.length,
      data: vendorsWithAnalytics
    });
  } catch (error) {
    console.error('Get vendor analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Could not fetch vendor analytics',
      error: error.message
    });
  }
};

// Get dashboard analytics and overview
exports.getDashboardAnalytics = async (req, res) => {
  try {
    // Get counts
    const totalVendors = await User.countDocuments({ role: 'vendor' });
    const totalConsultants = await User.countDocuments({ role: 'consultant' });
    const totalDocuments = await DocModel.countDocuments();
    const activeUsers = await User.countDocuments({ isActive: true });
    const pendingApprovals = await User.countDocuments({ 
      role: 'vendor', 
      requiresLoginApproval: true 
    });
    
    // Get document stats by status
    const documentsByStatus = await DocModel.aggregate([
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
    
    // Get documents by month (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    
    const documentsByMonth = await DocModel.aggregate([
      {
        $match: {
          createdAt: { $gte: sixMonthsAgo }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      {
        $sort: {
          '_id.year': 1,
          '_id.month': 1
        }
      },
      {
        $project: {
          _id: 0,
          month: {
            $let: {
              vars: {
                monthsInString: [
                  '', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
                ]
              },
              in: {
                $concat: [
                  { $arrayElemAt: ['$$monthsInString', '$_id.month'] },
                  ' ',
                  { $toString: '$_id.year' }
                ]
              }
            }
          },
          count: 1
        }
      }
    ]);
    
    // Get user activity (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const userActivityData = await User.aggregate([
      {
        $match: {
          createdAt: { $gte: sevenDaysAgo }
        }
      },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            role: '$role'
          },
          count: { $sum: 1 }
        }
      },
      {
        $group: {
          _id: '$_id.date',
          roles: {
            $push: {
              role: '$_id.role',
              count: '$count'
            }
          }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);
    
    // Format user activity data
    const userActivity = userActivityData.map(day => {
      const activity = {
        date: day._id,
        vendors: 0,
        consultants: 0
      };
      
      day.roles.forEach(roleData => {
        if (roleData.role === 'vendor') {
          activity.vendors = roleData.count;
        } else if (roleData.role === 'consultant') {
          activity.consultants = roleData.count;
        }
      });
      
      return activity;
    });
    
    res.status(200).json({
      success: true,
      data: {
        totalVendors,
        totalConsultants,
        totalDocuments,
        activeUsers,
        pendingApprovals,
        documentsByStatus,
        documentsByMonth,
        userActivity
      }
    });
  } catch (error) {
    console.error('Get dashboard analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Could not fetch dashboard analytics',
      error: error.message
    });
  }
};

// Bulk update users (for bulk actions)
exports.bulkUpdateUsers = async (req, res) => {
  try {
    const { userIds, action, data } = req.body;
    
    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid array of user IDs'
      });
    }
    
    if (!action) {
      return res.status(400).json({
        success: false,
        message: 'Please specify an action to perform'
      });
    }
    
    let result;
    
    switch (action) {
      case 'activate':
        result = await User.updateMany(
          { _id: { $in: userIds } },
          { isActive: true }
        );
        break;
        
      case 'deactivate':
        result = await User.updateMany(
          { _id: { $in: userIds } },
          { isActive: false }
        );
        break;
        
      case 'delete':
        result = await User.deleteMany(
          { _id: { $in: userIds } }
        );
        break;
        
      case 'assignConsultant':
        if (!data || !data.consultantId) {
          return res.status(400).json({
            success: false,
            message: 'Please provide a consultant ID for assignment'
          });
        }
        
        result = await User.updateMany(
          { _id: { $in: userIds }, role: 'vendor' },
          { assignedConsultant: data.consultantId }
        );
        break;
        
      default:
        return res.status(400).json({
          success: false,
          message: 'Invalid action specified'
        });
    }
    
    res.status(200).json({
      success: true,
      message: `Bulk update successful for ${action} action`,
      result
    });
  } catch (error) {
    console.error('Bulk update users error:', error);
    res.status(500).json({
      success: false,
      message: 'Could not perform bulk update',
      error: error.message
    });
  }
};

// Export users data to CSV
exports.exportUsers = async (req, res) => {
  try {
    const { role, format } = req.query;
    
    // Validate role
    if (role && !['vendor', 'consultant'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role specified'
      });
    }
    
    // Validate format
    if (!format || !['csv', 'excel'].includes(format)) {
      return res.status(400).json({
        success: false,
        message: 'Supported formats are csv and excel'
      });
    }
    
    // Build query
    const query = role ? { role } : {};
    
    // Get users
    const users = await User.find(query)
      .select('-password -resetPasswordToken -resetPasswordExpire')
      .lean();
    
    // Format data for export based on requested format
    if (format === 'csv') {
      // Implementation for CSV format
      // This would typically use a CSV library like fast-csv or json2csv
      
      res.status(200).send({
        success: true,
        message: 'CSV export successful',
        data: `data:text/csv;charset=utf-8,${encodeURIComponent(
          // Mock CSV content - in a real implementation, use a proper CSV library
          `ID,Name,Email,Role,Company,Active\n${
            users.map(user => 
              `${user._id},${user.name},${user.email},${user.role},${user.company || ''},${user.isActive}`
            ).join('\n')
          }`
        )}`
      });
    } else {
      // Implementation for Excel format
      // This would typically use an Excel library like exceljs or xlsx
      
      res.status(200).send({
        success: true,
        message: 'Excel export successful',
        data: `data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64,${
          // Mock Excel content - in a real implementation, use a proper Excel library
          Buffer.from(JSON.stringify(users)).toString('base64')
        }`
      });
    }
  } catch (error) {
    console.error('Export users error:', error);
    res.status(500).json({
      success: false,
      message: 'Could not export users data',
      error: error.message
    });
  }
};



