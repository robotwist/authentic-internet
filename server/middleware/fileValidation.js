import path from 'path';
import fs from 'fs';

/**
 * Enhanced file validation middleware
 * Provides additional security checks beyond basic multer filtering
 */

// Allowed MIME types with their corresponding file extensions
const ALLOWED_FILE_TYPES = {
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
  'image/gif': ['.gif'],
  'image/svg+xml': ['.svg'],
  'audio/mpeg': ['.mp3'],
  'audio/wav': ['.wav'],
  'audio/ogg': ['.ogg'],
  'video/mp4': ['.mp4'],
  'video/webm': ['.webm'],
  'application/pdf': ['.pdf'],
  'text/plain': ['.txt']
};

// Dangerous file extensions that should never be allowed
const DANGEROUS_EXTENSIONS = [
  '.exe', '.bat', '.cmd', '.com', '.pif', '.scr', '.vbs', '.js', '.jar',
  '.php', '.py', '.pl', '.sh', '.ps1', '.asp', '.aspx', '.jsp'
];

/**
 * Validates file uploads for security
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object  
 * @param {Function} next - Express next middleware function
 */
export const validateFileUpload = (req, res, next) => {
  try {
    if (!req.files || Object.keys(req.files).length === 0) {
      return next(); // No files to validate
    }

    const errors = [];

    // Validate each uploaded file
    Object.keys(req.files).forEach(fieldName => {
      const files = Array.isArray(req.files[fieldName]) ? req.files[fieldName] : [req.files[fieldName]];
      
      files.forEach(file => {
        // Check file extension against MIME type
        const fileExt = path.extname(file.originalname).toLowerCase();
        const allowedExtensions = ALLOWED_FILE_TYPES[file.mimetype];
        
        if (!allowedExtensions || !allowedExtensions.includes(fileExt)) {
          errors.push(`File ${file.originalname}: MIME type and extension mismatch`);
        }

        // Check for dangerous extensions
        if (DANGEROUS_EXTENSIONS.includes(fileExt)) {
          errors.push(`File ${file.originalname}: Dangerous file type not allowed`);
        }

        // Additional size validation per file type
        const maxSizes = {
          'image': 5 * 1024 * 1024,    // 5MB for images
          'audio': 10 * 1024 * 1024,   // 10MB for audio
          'video': 25 * 1024 * 1024,   // 25MB for video  
          'document': 2 * 1024 * 1024  // 2MB for documents
        };

        let fileType = 'document'; // default
        if (file.mimetype.startsWith('image/')) fileType = 'image';
        else if (file.mimetype.startsWith('audio/')) fileType = 'audio';
        else if (file.mimetype.startsWith('video/')) fileType = 'video';

        if (file.size > maxSizes[fileType]) {
          errors.push(`File ${file.originalname}: Exceeds size limit for ${fileType} files`);
        }

        // Check filename for suspicious patterns
        if (/[<>:"\/\\|?*\x00-\x1F]/.test(file.originalname)) {
          errors.push(`File ${file.originalname}: Contains invalid characters`);
        }

        // Check for null bytes (potential directory traversal)
        if (file.originalname.includes('\0')) {
          errors.push(`File ${file.originalname}: Contains null bytes`);
        }
      });
    });

    if (errors.length > 0) {
      // Clean up uploaded files if validation fails
      Object.keys(req.files).forEach(fieldName => {
        const files = Array.isArray(req.files[fieldName]) ? req.files[fieldName] : [req.files[fieldName]];
        files.forEach(file => {
          if (fs.existsSync(file.path)) {
            fs.unlinkSync(file.path);
          }
        });
      });

      return res.status(400).json({
        success: false,
        error: 'FILE_VALIDATION_ERROR',
        message: 'File validation failed',
        details: errors
      });
    }

    next();
  } catch (error) {
    console.error('File validation error:', error);
    res.status(500).json({
      success: false,
      error: 'FILE_VALIDATION_ERROR',
      message: 'File validation failed due to server error'
    });
  }
};

/**
 * Sanitizes filenames by removing or replacing unsafe characters
 * @param {string} filename - Original filename
 * @returns {string} - Sanitized filename
 */
export const sanitizeFilename = (filename) => {
  return filename
    .replace(/[<>:"\/\\|?*\x00-\x1F]/g, '_') // Replace unsafe chars with underscore
    .replace(/\.+/g, '.') // Replace multiple dots with single dot
    .replace(/^\./, '') // Remove leading dot
    .substring(0, 100); // Limit length to 100 chars
};

export default { validateFileUpload, sanitizeFilename };