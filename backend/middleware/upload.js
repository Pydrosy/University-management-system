// backend/middleware/upload.js
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure upload directories exist
const createUploadDirs = () => {
  const dirs = [
    'uploads/assignments',
    'uploads/profiles',
    'uploads/submissions',
    'uploads/announcements',
    'uploads/others'
  ];

  dirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      console.log(`Created directory: ${dir}`);
    }
  });
};

createUploadDirs();

// Configure storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let uploadPath = 'uploads/';
    
    if (file.fieldname === 'assignment') {
      uploadPath += 'assignments';
    } else if (file.fieldname === 'profile') {
      uploadPath += 'profiles';
    } else if (file.fieldname === 'submission') {
      uploadPath += 'submissions';
    } else if (file.fieldname === 'media') {
      uploadPath += 'announcements';
    } else {
      uploadPath += 'others';
    }
    
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    const filename = file.fieldname + '-' + uniqueSuffix + ext;
    console.log(`Saving file: ${filename}`);
    cb(null, filename);
  }
});

// File filter
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp|mp3|wav|ogg|mp4|webm|pdf|doc|docx|txt|zip|rar/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  console.log(`File upload attempt: ${file.originalname}, MIME: ${file.mimetype}, Valid: ${mimetype || extname}`);

  if (mimetype || extname) {
    return cb(null, true);
  } else {
    cb(new Error('Only image, audio, video, and document files are allowed'));
  }
};

// Create the base multer instance
const multerInstance = multer({
  storage: storage,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB default
  },
  fileFilter: fileFilter
});

// Export different upload methods
const upload = {
  // Single file uploads
  single: (fieldName) => multerInstance.single(fieldName),
  
  // Multiple files upload
  array: (fieldName, maxCount) => multerInstance.array(fieldName, maxCount),
  
  // For backward compatibility - direct multer instance
  any: () => multerInstance.any(),
  
  // Media upload for announcements (multiple files)
  media: multerInstance.array('media', 10),
  
  // Assignment upload (single file)
  assignment: multerInstance.single('assignment'),
  
  // Profile upload (single file)
  profile: multerInstance.single('profile'),
  
  // Submission upload (single file)
  submission: multerInstance.single('submission')
};

module.exports = upload;