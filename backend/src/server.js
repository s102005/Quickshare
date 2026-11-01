import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import os from 'os';
import { fileURLToPath } from 'url';
import { connectDB } from './config/db.js';
import authRoutes from './routes/authRoutes.js';
import fileRoutes from './routes/fileRoutes.js';
import { startCleanupService } from './services/cleanupService.js';
import { getLocalIpAddresses, getPrimaryLocalIp } from './utils/networkUtils.js';

// 1. Load environment variables
dotenv.config();

// 2. Resolve directory paths for ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 3. Initialize Express app
const app = express();

// 4. Connect to MongoDB (with zero-config fallback)
connectDB();

// 5. Ensure uploads storage directory exists
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// 6. Start Background File Cleanup Service
startCleanupService(10);

// 7. Enable CORS for all origins
app.use(cors({ origin: true, credentials: true }));

// 8. Body parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ==========================================
// API ROUTES
// ==========================================

// Authentication routes (Register, Login, Me)
app.use('/api/auth', authRoutes);

// File Upload & Metadata routes (Upload, Download, Info, My-Files)
app.use('/api/files', fileRoutes);

/**
 * Health Check & Status Endpoint
 */
app.get('/api/health', (req, res) => {
  const primaryIp = getPrimaryLocalIp();
  const allIps = getLocalIpAddresses();
  res.status(200).json({
    status: 'OK',
    message: 'QuickShare Backend API is running smoothly 🚀',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    serverIp: primaryIp,
    serverIps: allIps,
  });
});

// ==========================================
// SERVE FRONTEND STATIC FILES DIRECTLY (Unified Single-Server)
// ==========================================
const frontendDistPath = path.join(__dirname, '../../frontend/dist');

if (fs.existsSync(frontendDistPath)) {
  // Serve static assets from built frontend
  app.use(express.static(frontendDistPath));

  // Catch-all route to support client-side routing (e.g. /download/:code)
  app.get('*', (req, res) => {
    res.sendFile(path.join(frontendDistPath, 'index.html'));
  });
} else {
  app.get('/', (req, res) => {
    res.send('QuickShare API is running. Build frontend with `npm run build` in frontend folder.');
  });
}

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('💥 [Server Error]:', err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error'
  });
});

// ==========================================
// START SERVER ON ALL NETWORK INTERFACES
// ==========================================
const PORT = process.env.PORT || 5000;

app.listen(PORT, '0.0.0.0', () => {
  const primaryIp = getPrimaryLocalIp();
  const allIps = getLocalIpAddresses();
  console.log(`================================================`);
  console.log(`🚀 QuickShare Server is LIVE on All Interfaces:`);
  console.log(`💻 Local PC:        http://localhost:${PORT}`);
  console.log(`📱 Mobile (Wi-Fi):  http://${primaryIp}:${PORT}`);
  if (allIps.length > 1) {
    allIps.forEach(ip => {
      if (ip.address !== primaryIp) {
        console.log(`   Alt Interface:   http://${ip.address}:${PORT} (${ip.name})`);
      }
    });
  }
  console.log(`🌐 Anywhere Access: npm run tunnel`);
  console.log(`================================================`);
});
