const multer = require('multer');
const path = require('path');
const fs = require('fs');
const config = require('../config/env');

// Ensure upload directories exist
const createDir = (dirPath) => {
  const fullPath = path.resolve(config.uploadDir, dirPath);
  if (!fs.existsSync(fullPath)) {
    fs.mkdirSync(fullPath, { recursive: true });
  }
  return fullPath;
};

// Configure storage
const storage = (subDir) => multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = createDir(subDir);
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `${subDir}-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

// File filter (Images only)
const imageFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);
  
  if (extname && mimetype) {
    return cb(null, true);
  }
  cb(new Error('Only image files are allowed (jpeg, jpg, png, webp)'));
};

// Limits
const limits = {
  fileSize: 5 * 1024 * 1024 // 5MB
};

// Export middleware instances
exports.uploadSlip = multer({
  storage: storage('slips'),
  fileFilter: imageFilter,
  limits: limits
});

exports.uploadMenu = multer({
  storage: storage('menu'),
  fileFilter: imageFilter,
  limits: limits
});
