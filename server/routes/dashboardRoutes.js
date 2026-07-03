import { Router } from 'express';
import dashboardController from '../controllers/dashboardController.js';
import { authenticate } from '../middleware/authMiddleware.js';

const router = Router();

// Retrieve dashboard aggregates scoped to user role context
router.get('/summary', authenticate, dashboardController.getSummary);

export default router;
