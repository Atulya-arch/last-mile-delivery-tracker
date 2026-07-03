import agentRepository from '../repositories/agentRepository.js';
import zoneRepository from '../repositories/zoneRepository.js';
import orderService from '../services/orderService.js';
import assignmentService from '../services/assignmentService.js';
import { updateStatusSchema, updateZoneSchema, agentOrderUpdateSchema } from '../validators/agentValidator.js';
import { successResponse } from '../utils/responseFormatter.js';
import { UnprocessableEntityError, NotFoundError } from '../middleware/errorHandler.js';

export class AgentController {
  /**
   * Update the availability status of the authenticated agent.
   */
  async updateProfileStatus(req, res, next) {
    try {
      const parsed = updateStatusSchema.safeParse(req.body);
      if (!parsed.success) {
        return next(new UnprocessableEntityError('Status update validation failed', parsed.error.format()));
      }

      const { status } = parsed.data;
      const profile = await agentRepository.updateProfile(req.user.id, { status });

      // Run auto-assignment checking if agent sets status to AVAILABLE
      if (status === 'AVAILABLE') {
        assignmentService.autoAssignPendingOrdersForAgent(req.user.id).catch(err => {
          console.error('⚠️ [AgentController] Post-availability matching error:', err.message);
        });
      }

      res.status(200).json(successResponse('Agent availability status updated successfully', { profile }));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update the operating zone of the authenticated agent.
   */
  async updateProfileZone(req, res, next) {
    try {
      const parsed = updateZoneSchema.safeParse(req.body);
      if (!parsed.success) {
        return next(new UnprocessableEntityError('Zone update validation failed', parsed.error.format()));
      }

      const { zoneId } = parsed.data;

      // Ensure target zone exists
      const zone = await zoneRepository.findById(zoneId);
      if (!zone) {
        throw new NotFoundError('Target Zone not found or is inactive');
      }

      const profile = await agentRepository.updateProfile(req.user.id, { zoneId });

      // Run auto-assignment checking if agent is now available in this zone
      if (profile.status === 'AVAILABLE') {
        assignmentService.autoAssignPendingOrdersForAgent(req.user.id).catch(err => {
          console.error('⚠️ [AgentController] Post-zone-change matching error:', err.message);
        });
      }

      res.status(200).json(successResponse('Agent operating zone updated successfully', { profile }));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Assigned agent progresses the order delivery lifecycle status.
   */
  async updateOrderStatus(req, res, next) {
    try {
      const { id: orderId } = req.params;
      const agentId = req.user.id;

      const parsed = agentOrderUpdateSchema.safeParse(req.body);
      if (!parsed.success) {
        return next(new UnprocessableEntityError('Order update validation failed', parsed.error.format()));
      }

      const order = await orderService.updateOrderStatusByAgent(orderId, agentId, parsed.data);
      res.status(200).json(successResponse('Order status updated successfully', { order }));
    } catch (error) {
      next(error);
    }
  }
}

export default new AgentController();
