import { Router } from 'express';
import rateController from '../controllers/rateController.js';
import orderController from '../controllers/orderController.js';
import { authenticate, authorize } from '../middleware/authMiddleware.js';

const router = Router();

// Pricing quote calculations (shared authenticated route)
router.post('/quote', authenticate, rateController.getQuote);

// Order placement & management
router.post('/', authenticate, orderController.placeOrder);
router.get('/', authenticate, orderController.getOrders);
router.get('/:id', authenticate, orderController.getOrderDetails);
router.post('/:id/reschedule', authenticate, orderController.rescheduleOrder);

// Administrative action overrides
router.post('/:id/override', authenticate, authorize('ADMIN'), orderController.overrideOrder);

export default router;
