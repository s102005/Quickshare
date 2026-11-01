import mongoose from 'mongoose';

/**
 * File Metadata Schema
 * Defines the structure for file records stored in MongoDB.
 * 
 * Why this is needed:
 * - We NEVER store heavy binary file chunks inside MongoDB.
 * - MongoDB stores lightweight metadata (filenames, byte sizes, short codes, expiration dates, restrictions).
 */
const fileSchema = new mongoose.Schema(
  {
    // Original name of the uploaded file (e.g. "presentation.pdf")
    originalName: {
      type: String,
      required: [true, 'Original file name is required'],
      trim: true,
    },
    // Unique name saved on the server's disk storage (e.g. "17189021-9872-presentation.pdf")
    diskFileName: {
      type: String,
      required: true,
    },
    // Absolute or relative storage path on disk
    filePath: {
      type: String,
      required: true,
    },
    // Exact file size in bytes (e.g. 1048576 = 1MB)
    fileSize: {
      type: Number,
      required: true,
    },
    // MIME type format (e.g. "application/pdf", "image/png", "application/zip")
    mimeType: {
      type: String,
      required: true,
    },
    // Short unique code for the shareable download URL (e.g. "qs-7k9p2q")
    uniqueCode: {
      type: String,
      required: true,
      unique: true, // MongoDB unique index guarantees fast O(1) lookups and collision prevention
      trim: true,
    },
    // Reference to the registered user who uploaded the file (null if guest upload)
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    // Hashed password if sender added passcode protection (bcrypt hash)
    passwordHash: {
      type: String,
      default: null,
    },
    // Flag indicating if the file requires a password to download
    isPasswordProtected: {
      type: Boolean,
      default: false,
    },
    // Expiration timestamp when file becomes inaccessible (e.g. in 24 hours)
    expiresAt: {
      type: Date,
      required: true,
    },
    // Maximum allowed downloads before auto-expiration (null = unlimited)
    maxDownloads: {
      type: Number,
      default: null,
    },
    // Number of times this file has been downloaded so far
    downloadCount: {
      type: Number,
      default: 0,
    },
    // Current status of the transfer ('ACTIVE' or 'EXPIRED')
    status: {
      type: String,
      enum: ['ACTIVE', 'EXPIRED'],
      default: 'ACTIVE',
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt
  }
);

// Method to safely return public file information without exposing private server paths or password hashes
fileSchema.methods.toPublicJSON = function () {
  return {
    id: this._id,
    originalName: this.originalName,
    fileSize: this.fileSize,
    mimeType: this.mimeType,
    uniqueCode: this.uniqueCode,
    isPasswordProtected: this.isPasswordProtected,
    expiresAt: this.expiresAt,
    maxDownloads: this.maxDownloads,
    downloadCount: this.downloadCount,
    status: this.status,
    createdAt: this.createdAt,
  };
};

const File = mongoose.model('File', fileSchema);
export default File;
