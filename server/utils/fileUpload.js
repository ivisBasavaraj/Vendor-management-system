const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Create upload directory if it doesn't exist
const createUploadDir = () => {
  const uploadPath = path.join(__dirname, '../uploads');
  if (!fs.existsSync(uploadPath)) {
    fs.mkdirSync(uploadPath, { recursive: true });
  }
  return uploadPath;
};

// Configure storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = createUploadDir();
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    // Create unique filename with original extension
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const fileExt = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + fileExt);
  }
});

// File filter
const fileFilter = (req, file, cb) => {
  // Define allowed file types
  const allowedFileTypes = [
    // Documents
    '.pdf', '.doc', '.docx', '.txt', '.rtf', '.odt',
    // Spreadsheets
    '.xls', '.xlsx', '.csv', '.ods',
    // Presentations
    '.ppt', '.pptx', '.odp',
    // Images
    '.jpg', '.jpeg', '.png', '.gif', '.bmp',
    // Archives
    '.zip', '.rar', '.7z',
    // Others
    '.xml', '.json'
  ];

  // Check if file extension is allowed
  const fileExt = path.extname(file.originalname).toLowerCase();
  if (allowedFileTypes.includes(fileExt)) {
    cb(null, true);
  } else {
    cb(new Error(`File type ${fileExt} is not allowed`), false);
  }
};

// Size limits (10MB)
const limits = {
  fileSize: 10 * 1024 * 1024
};

// Create multer upload instance
const upload = multer({
  storage,
  fileFilter,
  limits
});

// Helper function to delete a file
const deleteFile = async (filePath) => {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error deleting file:', error);
    return false;
  }
};

// Export utilities
module.exports = {
  upload,
  deleteFile,
  getFilePath: (filename) => path.join(createUploadDir(), filename)
}; 