import mongoose from 'mongoose';

export let isMongoConnected = false;

export const connectDB = async () => {
  try {
    const connUri = process.env.MONGO_URI || 'mongodb://localhost:27017/quickshare';

    // Set connection timeout to 2.5s so we don't stall the server if MongoDB isn't running
    mongoose.set('bufferCommands', false); // Disable query buffering when disconnected

    const conn = await mongoose.connect(connUri, {
      serverSelectionTimeoutMS: 2500,
    });

    isMongoConnected = true;
    console.log(`✅ [Database] MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    isMongoConnected = false;
    console.warn(`⚠️ [Database Info] MongoDB not active on port 27017.`);
    console.log(`🚀 [Database] Seamlessly activated Local Storage Engine (data/db.json) for 100% zero-config operation!`);
  }
};
