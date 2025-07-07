// utils/uploadConfig.ts
import multer from 'multer';
import path from 'path';

import { Request,Response } from 'express';
import { v4 as uuidv4 } from 'uuid';

// Define allowed MIME types for images
const allowedMimeTypes = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/svg+xml'
];

// Configure storage
const storage = multer.diskStorage({
  destination: (req: Request, file: Express.Multer.File, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads/avatars');
    
    // Create directory if it doesn't exist
    const fs = require('fs');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req: Request, file: Express.Multer.File, cb) => {
    const ext = path.extname(file.originalname);
    const filename = `${uuidv4()}${ext}`;
    cb(null, filename);
  }
});

// File filter function
const fileFilter = (
  req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only images are allowed.'));
  }
};

// Configure multer upload
const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
    files: 1 // Single file
  },
  fileFilter
});

// Error handling middleware for uploads
const handleUploadErrors = (err: Error, req: Request, res: Response, next: Function) => {
  if (err instanceof multer.MulterError) {
    // A Multer error occurred when uploading
    return res.status(400).json({
      error: 'Upload Error',
      message: err.message,
      code: err.code
    });
  } else if (err) {
    // An unknown error occurred
    return res.status(500).json({
      error: 'Server Error',
      message: err.message || 'Something went wrong during upload'
    });
  }
  next();
};

export { upload, handleUploadErrors };