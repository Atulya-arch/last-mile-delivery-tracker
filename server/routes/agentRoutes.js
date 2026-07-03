import { Router } from 'express';
import agentController from '../controllers/agentController.js';
import { authenticate, authorize } from '../middleware/authMiddleware.js';

const router = Router();

// Agent Profile configurations
router.put('/profile/status', authenticate, authorize('AGENT'), agentController.updateProfileStatus);
router.put('/profile/zone', authenticate, authorize('AGENT'), agentController.updateProfileZone);

// Order status updates
router.put('/orders/:id/status', authenticate, authorize('AGENT'), agentController.updateOrderStatus);

export default router;
