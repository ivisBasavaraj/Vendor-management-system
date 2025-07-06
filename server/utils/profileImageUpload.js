const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Create profile images directory if it doesn't exist
const createProfileImageDir = () => {
  const uploadPath = path.join(__dirname, '../uploads/profile-images');
  if (!fs.existsSync(uploadPath)) {
    fs.mkdirSync(uploadPath, { recursive: true });
  }
  return uploadPath;
};

// Configure storage for profile images
const profileImageStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = createProfileImageDir();
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    // Create unique filename with original extension
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const fileExt = path.extname(file.originalname);
    cb(null, 'profile-' + uniqueSuffix + fileExt);
  }
});

// File filter for profile images
const profileImageFilter = (req, file, cb) => {
  // Only allow image files
  const allowedImageTypes = ['.jpg', '.jpeg', '.png', '.gif'];
  const fileExt = path.extname(file.originalname).toLowerCase();
  
  if (allowedImageTypes.includes(fileExt)) {
    cb(null, true);
  } else {
    cb(new Error('Only image files (JPG, JPEG, PNG, GIF) are allowed for profile pictures'), false);
  }
};

// Size limits for profile images (5MB)
const profileImageLimits = {
  fileSize: 5 * 1024 * 1024
};

// Create multer upload instance for profile images
const profileImageUpload = multer({
  storage: profileImageStorage,
  fileFilter: profileImageFilter,
  limits: profileImageLimits
});

// Helper function to delete a profile image
const deleteProfileImage = async (filePath) => {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error deleting profile image:', error);
    return false;
  }
};

// Helper function to get profile image URL
const getProfileImageUrl = (filename) => {
  if (!filename) return null;
  return `/uploads/profile-images/${filename}`;
};

// Export utilities
module.exports = {
  profileImageUpload,
  deleteProfileImage,
  getProfileImageUrl,
  getProfileImagePath: (filename) => path.join(createProfileImageDir(), filename)
};