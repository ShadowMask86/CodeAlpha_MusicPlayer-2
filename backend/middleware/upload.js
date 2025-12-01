/**
 * FILE UPLOAD MIDDLEWARE
 * Uses Multer to handle audio file uploads
 * Validates file types and saves to /uploads/music/
 */

const multer = require('multer');
const path = require('path');

// Configure storage settings
const storage = multer.diskStorage({
  // Destination folder for uploaded files
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../uploads/music'));
  },
  
  // Generate unique filename: timestamp + original name
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    const name = path.basename(file.originalname, ext).replace(/\s+/g, '-');
    cb(null, `${name}-${uniqueSuffix}${ext}`);
  }
});

// File filter: Only accept audio files
const fileFilter = (req, file, cb) => {
  const allowedTypes = /mp3|wav|ogg|m4a|flac|aac/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);
  
  if (extname && mimetype) {
    cb(null, true);
  } else {
    cb(new Error('Only audio files are allowed! (mp3, wav, ogg, m4a, flac, aac)'));
  }
};

// Configure multer
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB max file size
  }
});

module.exports = upload;