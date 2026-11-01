import fs from 'fs';
import File from '../models/File.js';
import { isMongoConnected } from '../config/db.js';
import { localDb } from '../config/localDb.js';

export const runCleanupTask = async () => {
  try {
    const now = new Date();

    let expiredFiles = [];
    if (isMongoConnected) {
      expiredFiles = await File.find({
        status: 'ACTIVE',
        $or: [
          { expiresAt: { $lte: now } },
          {
            $and: [
              { maxDownloads: { $ne: null } },
              { $expr: { $gte: ['$downloadCount', '$maxDownloads'] } },
            ],
          },
        ],
      });
    } else {
      const allFiles = localDb.files.find({ status: 'ACTIVE' });
      expiredFiles = allFiles.filter((f) => {
        const isTimeExpired = now > new Date(f.expiresAt);
        const isLimitExpired = f.maxDownloads && (f.downloadCount || 0) >= f.maxDownloads;
        return isTimeExpired || isLimitExpired;
      });
    }

    if (expiredFiles.length === 0) {
      return;
    }

    console.log(`🧹 [Cleanup Service] Found ${expiredFiles.length} expired file(s) to clean up...`);

    for (const file of expiredFiles) {
      if (fs.existsSync(file.filePath)) {
        try {
          fs.unlinkSync(file.filePath);
          console.log(`   🗑️ Deleted raw disk file: ${file.filePath}`);
        } catch (unlinkErr) {
          console.error(`   ⚠️ Could not delete disk file (${file.filePath}):`, unlinkErr.message);
        }
      }

      if (isMongoConnected) {
        file.status = 'EXPIRED';
        await file.save();
      } else {
        localDb.files.updateOne({ _id: file._id }, { status: 'EXPIRED' });
      }
    }

    console.log(`✅ [Cleanup Service] Processed ${expiredFiles.length} expired files.`);
  } catch (error) {
    console.error('❌ [Cleanup Service Error]:', error.message);
  }
};

export const startCleanupService = (intervalMinutes = 10) => {
  console.log(`⚙️ [Cleanup Service] Initialized to run every ${intervalMinutes} minute(s).`);
  runCleanupTask();
  const intervalMs = intervalMinutes * 60 * 1000;
  setInterval(runCleanupTask, intervalMs);
};
