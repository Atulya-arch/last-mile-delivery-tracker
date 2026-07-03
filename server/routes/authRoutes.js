import { Router } from 'express';
import authController from '../controllers/authController.js';
import { authenticate } from '../middleware/authMiddleware.js';

const router = Router();

// Public routes
router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/verify-otp', authController.verifyOtp);
router.post('/resend-otp', authController.resendOtp);

// Protected routes
router.get('/me', authenticate, authController.me);

export default router;
