import express from 'express';
import { registerUser, loginUser, getMe } from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public routes for user onboarding & authentication
router.post('/register', registerUser);
router.post('/login', loginUser);

// Protected route to fetch current logged-in user profile
router.get('/me', protect, getMe);

export default router;
