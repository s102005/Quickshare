import express from 'express';
import { 
  uploadFile, 
  getFileInfo, 
  downloadFile, 
  getUserFiles, 
  deleteFile 
} from '../controllers/fileController.js';
import { upload } from '../middleware/uploadMiddleware.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// 1. Mandatory Authenticated File Upload (Must be signed in to upload)
router.post('/upload', protect, upload.single('file'), uploadFile);

// 2. Fetch public file metadata (Accessible to link recipients)
router.get('/:code/info', getFileInfo);

// 3. Download endpoint (Public access for shared link recipients)
router.post('/:code/download', downloadFile);
router.get('/:code/download', downloadFile);

// 4. Authenticated user file management
router.get('/my/files', protect, getUserFiles);
router.delete('/:id', protect, deleteFile);

export default router;
