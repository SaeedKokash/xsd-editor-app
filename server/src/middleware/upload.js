const multer = require('multer');
const path = require('path');

// Use memory storage to access file buffer directly
const storage = multer.memoryStorage();

// Initialize multer with memory storage and file filtering
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB limit
  },
  fileFilter: (req, file, cb) => {
    // Accept XML and XSD files
    const allowedMimeTypes = [
      'text/xml',
      'application/xml',
      'application/x-xml',
      'text/plain'
    ];
    
    const allowedExtensions = ['.xml', '.xsd'];
    const fileExtension = path.extname(file.originalname).toLowerCase();
    
    if (allowedMimeTypes.includes(file.mimetype) || allowedExtensions.includes(fileExtension)) {
      return cb(null, true);
    }
    
    cb(new Error('Error: File upload only supports XML/XSD files!'));
  }
});

// Export the upload middleware
module.exports = upload;