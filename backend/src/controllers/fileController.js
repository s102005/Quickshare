import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import File from '../models/File.js';
import { localDb } from '../config/localDb.js';
import { isMongoConnected } from '../config/db.js';
import { getPrimaryLocalIp } from '../utils/networkUtils.js';

// Safe inline unique code generator (qs-xxxx)
const generateUniqueCode = () => {
  return `qs-${crypto.randomBytes(4).toString('hex')}`;
};

export const uploadFile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file provided. Please attach a valid file.',
      });
    }

    const { expiryHours = 24, password, maxDownloads } = req.body;
    const senderId = req.user ? (req.user._id || req.user.id) : null;

    let uniqueCode = generateUniqueCode();
    let isCodeUnique = false;
    let attempts = 0;

    while (!isCodeUnique && attempts < 10) {
      attempts++;
      const existing = isMongoConnected 
        ? await File.findOne({ uniqueCode })
        : localDb.files.findOne({ uniqueCode });

      if (!existing) {
        isCodeUnique = true;
      } else {
        uniqueCode = generateUniqueCode();
      }
    }

    let passwordHash = null;
    let isPasswordProtected = false;
    if (password && password.trim().length > 0) {
      const salt = await bcrypt.genSalt(10);
      passwordHash = await bcrypt.hash(password.trim(), salt);
      isPasswordProtected = true;
    }

    const hours = parseInt(expiryHours, 10) || 24;
    const expiresAt = new Date(Date.now() + hours * 60 * 60 * 1000);

    const parsedMaxDownloads = maxDownloads && parseInt(maxDownloads, 10) > 0 
      ? parseInt(maxDownloads, 10) 
      : null;

    let newFile;

    if (isMongoConnected) {
      newFile = await File.create({
        originalName: req.file.originalname,
        diskFileName: req.file.filename,
        filePath: req.file.path,
        fileSize: req.file.size,
        mimeType: req.file.mimetype || 'application/octet-stream',
        uniqueCode,
        senderId,
        passwordHash,
        isPasswordProtected,
        expiresAt,
        maxDownloads: parsedMaxDownloads,
      });
    } else {
      newFile = localDb.files.insertOne({
        originalName: req.file.originalname,
        diskFileName: req.file.filename,
        filePath: req.file.path,
        fileSize: req.file.size,
        mimeType: req.file.mimetype || 'application/octet-stream',
        uniqueCode,
        senderId,
        passwordHash,
        isPasswordProtected,
        expiresAt: expiresAt.toISOString(),
        maxDownloads: parsedMaxDownloads,
        downloadCount: 0,
        status: 'ACTIVE',
      });
    }

    const host = req.get('host');
    const protocol = req.protocol;
    const downloadUrl = `${protocol}://${host}/download/${uniqueCode}`;
    const serverIp = getPrimaryLocalIp();

    return res.status(201).json({
      success: true,
      message: 'File uploaded successfully 🚀',
      data: {
        file: isMongoConnected ? newFile.toPublicJSON() : newFile,
        downloadUrl,
        uniqueCode,
        serverIp,
      },
    });
  } catch (error) {
    console.error('File Upload Error:', error);
    if (req.file && fs.existsSync(req.file.path)) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (err) {
        console.error('Failed to remove temp file after upload error:', err);
      }
    }

    return res.status(500).json({
      success: false,
      message: error.message || 'Server error processing file upload',
    });
  }
};

export const getFileInfo = async (req, res) => {
  try {
    const { code } = req.params;

    const file = isMongoConnected
      ? await File.findOne({ uniqueCode: code })
      : localDb.files.findOne({ uniqueCode: code });

    if (!file) {
      return res.status(404).json({
        success: false,
        message: 'File transfer link not found or invalid.',
      });
    }

    const isTimeExpired = new Date() > new Date(file.expiresAt);
    const isCountExpired = file.maxDownloads && file.downloadCount >= file.maxDownloads;

    if (file.status === 'EXPIRED' || isTimeExpired || isCountExpired) {
      if (file.status !== 'EXPIRED') {
        if (isMongoConnected) {
          file.status = 'EXPIRED';
          await file.save();
        } else {
          localDb.files.updateOne({ uniqueCode: code }, { status: 'EXPIRED' });
          file.status = 'EXPIRED';
        }
      }

      return res.status(410).json({
        success: false,
        message: 'This file transfer has expired or reached its maximum download limit.',
        file: isMongoConnected ? file.toPublicJSON() : file,
      });
    }

    return res.status(200).json({
      success: true,
      file: isMongoConnected ? file.toPublicJSON() : file,
    });
  } catch (error) {
    console.error('Get File Info Error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Error fetching file metadata',
    });
  }
};

export const downloadFile = async (req, res) => {
  try {
    const { code } = req.params;
    // Support password from JSON body, URL query param, or form body
    const password = req.body?.password || req.query?.password || '';

    let file = isMongoConnected 
      ? await File.findOne({ uniqueCode: code })
      : localDb.files.findOne({ uniqueCode: code });

    if (!file) {
      return res.status(404).json({
        success: false,
        message: 'File transfer not found or invalid link.',
      });
    }

    const isTimeExpired = new Date() > new Date(file.expiresAt);
    if (file.status === 'EXPIRED' || isTimeExpired) {
      if (isMongoConnected) {
        file.status = 'EXPIRED';
        await file.save();
      } else {
        localDb.files.updateOne({ uniqueCode: code }, { status: 'EXPIRED' });
      }
      return res.status(410).json({
        success: false,
        message: 'This transfer link has expired and is no longer available.',
      });
    }

    if (file.maxDownloads && file.downloadCount >= file.maxDownloads) {
      if (isMongoConnected) {
        file.status = 'EXPIRED';
        await file.save();
      } else {
        localDb.files.updateOne({ uniqueCode: code }, { status: 'EXPIRED' });
      }
      return res.status(410).json({
        success: false,
        message: `This file has reached its maximum download limit of ${file.maxDownloads} download(s).`,
      });
    }

    if (file.isPasswordProtected) {
      if (!password || !password.trim()) {
        return res.status(401).json({
          success: false,
          isPasswordRequired: true,
          message: 'This file is password-protected. Please enter the passcode.',
        });
      }

      const isPasswordValid = await bcrypt.compare(password.trim(), file.passwordHash);
      if (!isPasswordValid) {
        return res.status(401).json({
          success: false,
          isPasswordRequired: true,
          message: 'Incorrect passcode. Access denied.',
        });
      }
    }

    if (!fs.existsSync(file.filePath)) {
      return res.status(404).json({
        success: false,
        message: 'The physical file was not found on the server storage.',
      });
    }

    const newCount = (file.downloadCount || 0) + 1;
    const newStatus = (file.maxDownloads && newCount >= file.maxDownloads) ? 'EXPIRED' : file.status;

    if (isMongoConnected) {
      file.downloadCount = newCount;
      file.status = newStatus;
      await file.save();
    } else {
      localDb.files.updateOne({ uniqueCode: code }, { downloadCount: newCount, status: newStatus });
    }

    // Set clean attachment headers for universal browser downloads
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(file.originalName)}"`);
    res.setHeader('Content-Type', file.mimeType || 'application/octet-stream');

    res.download(file.filePath, file.originalName, (err) => {
      if (err) {
        console.error('File streaming error:', err);
        if (!res.headersSent) {
          res.status(500).json({ success: false, message: 'Error streaming file' });
        }
      }
    });

  } catch (error) {
    console.error('Download Error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error processing file download',
    });
  }
};

export const getUserFiles = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    let files;
    if (isMongoConnected) {
      files = await File.find({ senderId: userId }).sort({ createdAt: -1 });
      files = files.map((f) => f.toPublicJSON());
    } else {
      files = localDb.files.find({ senderId: userId }).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }

    return res.status(200).json({
      success: true,
      count: files.length,
      files,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Error fetching user files',
    });
  }
};

export const deleteFile = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id || req.user.id;

    const file = isMongoConnected 
      ? await File.findOne({ _id: id, senderId: userId })
      : localDb.files.findOne({ _id: id, senderId: userId });

    if (!file) {
      return res.status(404).json({
        success: false,
        message: 'File not found or you are not authorized to delete this transfer.',
      });
    }

    if (fs.existsSync(file.filePath)) {
      try {
        fs.unlinkSync(file.filePath);
      } catch (err) {
        console.error('Failed to unlink disk file:', err);
      }
    }

    if (isMongoConnected) {
      await File.deleteOne({ _id: id });
    } else {
      localDb.files.deleteOne({ _id: id });
    }

    return res.status(200).json({
      success: true,
      message: 'File transfer deleted permanently.',
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Error deleting file',
    });
  }
};
