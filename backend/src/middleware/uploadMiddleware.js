import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

// Resolve directory path for ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsDir = path.join(__dirname, '../../uploads');

// Ensure destination upload folder exists
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

/**
 * Configure Multer Disk Storage Engine
 * 
 * Why diskStorage:
 * - Writes file chunks directly to disk instead of holding entire large files in server RAM (MemoryStorage).
 * - Generates unique filenames to prevent accidental overwrites if two users upload 'report.pdf'.
 */
const storage = multer.diskStorage({
  // Define destination directory on disk
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  // Generate a collision-resistant unique filename
  filename: (req, file, cb) => {
    // 1. Sanitize original filename: remove spaces and special characters
    const sanitizedOriginalName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
    
    // 2. Generate timestamp + random string prefix (e.g. 17189021-9872-report.pdf)
    const uniquePrefix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const finalFilename = `${uniquePrefix}-${sanitizedOriginalName}`;

    cb(null, finalFilename);
  },
});

/**
 * Multer File Filter (Allows safe standard files)
 */
const fileFilter = (req, file, cb) => {
  // Allow all standard file types (images, videos, archives, pdfs, documents, audio)
  cb(null, true);
};

/**
 * Export configured Multer instance
 * - Max file size: 500MB (can be customized)
 */
export const upload = multer({
  storage,
  limits: {
    fileSize: 500 * 1024 * 1024, // 500 Megabytes in bytes
  },
  fileFilter,
});
