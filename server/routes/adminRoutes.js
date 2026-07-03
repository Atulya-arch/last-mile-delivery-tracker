import { Router } from 'express';
import adminController from '../controllers/adminController.js';
import { authenticate, authorize } from '../middleware/authMiddleware.js';

const router = Router();

// Zone routes
router.post('/zones', authenticate, authorize('ADMIN'), adminController.createZone);
router.get('/zones', authenticate, adminController.getZones); // shared lookup
router.delete('/zones/:id', authenticate, authorize('ADMIN'), adminController.deleteZone);

// Area routes
router.post('/areas', authenticate, authorize('ADMIN'), adminController.createArea);
router.get('/areas', authenticate, adminController.getAreas); // shared lookup
router.delete('/areas/:id', authenticate, authorize('ADMIN'), adminController.deleteArea);

// Rate Card routes
router.post('/rate-cards', authenticate, authorize('ADMIN'), adminController.createRateCard);
router.get('/rate-cards', authenticate, authorize('ADMIN'), adminController.getRateCards);
router.delete('/rate-cards/:id', authenticate, authorize('ADMIN'), adminController.deleteRateCard);

// Agent lookup routes
router.get('/agents', authenticate, authorize('ADMIN'), adminController.getAgents);

export default router;
