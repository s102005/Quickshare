import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { isMongoConnected } from '../config/db.js';
import { localDb } from '../config/localDb.js';

export const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'quickshare_super_secret_jwt_key_2026');

      if (isMongoConnected) {
        req.user = await User.findById(decoded.id).select('-passwordHash');
      } else {
        const u = localDb.users.findById(decoded.id);
        if (u) {
          const userCopy = { ...u };
          delete userCopy.passwordHash;
          req.user = userCopy;
        }
      }

      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'User belonging to this token no longer exists',
        });
      }

      return next();
    } catch (error) {
      console.error('JWT Verification Error:', error.message);
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired authentication token',
      });
    }
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Access denied. No authorization token provided.',
    });
  }
};

export const optionalAuth = async (req, res, next) => {
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      const token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'quickshare_super_secret_jwt_key_2026');
      
      if (isMongoConnected) {
        req.user = await User.findById(decoded.id).select('-passwordHash');
      } else {
        const u = localDb.users.findById(decoded.id);
        if (u) {
          const userCopy = { ...u };
          delete userCopy.passwordHash;
          req.user = userCopy;
        }
      }
    } catch (error) {
      req.user = null;
    }
  } else {
    req.user = null;
  }
  next();
};
