import prisma from '../config/prismaClient.js';
import orderRepository from '../repositories/orderRepository.js';
import userRepository from '../repositories/userRepository.js';
import rateService from './rateService.js';
import { BadRequestError, NotFoundError, ForbiddenError } from '../middleware/errorHandler.js';

export class OrderService {
  /**
   * Validate order lifecycle transitions.
   * @param {string} currentStatus 
   * @param {string} nextStatus 
   * @returns {boolean}
   */
  isValidTransition(currentStatus, nextStatus) {
    const rules = {
      CREATED: ['ASSIGNED'],
      ASSIGNED: ['PICKED_UP', 'FAILED'],
      PICKED_UP: ['IN_TRANSIT', 'FAILED'],
      IN_TRANSIT: ['OUT_FOR_DELIVERY', 'FAILED'],
      OUT_FOR_DELIVERY: ['DELIVERED', 'FAILED'],
      FAILED: ['RESCHEDULED'],
      RESCHEDULED: ['CREATED', 'ASSIGNED']
    };
    return rules[currentStatus]?.includes(nextStatus) || false;
  }

  /**
   * Place a new order, calculate rate, and trigger auto-assignment.
   * @param {object} input 
   * @param {object} currentUser 
   * @returns {Promise<object>}
   */
  async placeOrder(input, currentUser) {
    let customerId;

    if (currentUser.role === 'CUSTOMER') {
      customerId = currentUser.id;
    } else if (currentUser.role === 'ADMIN') {
      if (!input.customerId) {
        throw new BadRequestError('Customer ID is required when order is placed by administrator.');
      }
      customerId = input.customerId;
      // Validate customer exists
      const cust = await userRepository.findById(customerId);
      if (!cust || cust.role !== 'CUSTOMER') {
        throw new NotFoundError('Target customer user not found or inactive');
      }
    } else {
      throw new ForbiddenError('Agents cannot place delivery orders.');
    }

    // 1. Calculate rate dynamically
    const rateData = await rateService.calculateRate(input);

    // 2. Create order record
    const order = await orderRepository.create(input, rateData, customerId);

    // 3. Trigger Auto Assignment Engine dynamically if enabled
    const autoAssignConfig = await prisma.systemConfig.findUnique({
      where: { key: 'AUTO_ASSIGN_ENABLE' }
    });
    
    if (autoAssignConfig && autoAssignConfig.value === 'true') {
      try {
        const assignmentService = (await import('./assignmentService.js')).default;
        await assignmentService.autoAssignOrder(order.id);
      } catch (err) {
        console.error('⚠️ [AutoAssign] Failed to run assignment engine:', err.message);
      }
    }

    return orderRepository.findById(order.id);
  }

  /**
   * Fetch active orders filtered by user context and optional query attributes.
   * @param {object} queryFilters 
   * @param {object} currentUser 
   * @returns {Promise<object[]>}
   */
  async listOrders(queryFilters, currentUser) {
    const filters = {};

    // Filter by role
    if (currentUser.role === 'CUSTOMER') {
      filters.customerId = currentUser.id;
    } else if (currentUser.role === 'AGENT') {
      filters.agentId = currentUser.id;
    } else if (currentUser.role === 'ADMIN') {
      if (queryFilters.customerId) filters.customerId = queryFilters.customerId;
      if (queryFilters.agentId) filters.agentId = queryFilters.agentId;
    }

    // Common query filter
    if (queryFilters.status) {
      filters.status = queryFilters.status;
    }

    return orderRepository.findAll(filters);
  }

  /**
   * Retrieve single order details including full tracking timeline.
   * @param {string} orderId 
   * @param {object} currentUser 
   * @returns {Promise<object>}
   */
  async getOrderDetails(orderId, currentUser) {
    const order = await orderRepository.findById(orderId);
    if (!order) {
      throw new NotFoundError('Order not found or has been deleted');
    }

    // Verify access
    if (currentUser.role === 'CUSTOMER' && order.customerId !== currentUser.id) {
      throw new ForbiddenError('You are not authorized to view this order.');
    }
    if (currentUser.role === 'AGENT' && order.agentId !== currentUser.id) {
      throw new ForbiddenError('You are not authorized to view this order.');
    }

    return order;
  }

  /**
   * Admin-only status/agent force override logic.
   * @param {string} orderId 
   * @param {object} overrideData 
   * @param {object} adminUser 
   * @returns {Promise<object>}
   */
  async overrideOrder(orderId, overrideData, adminUser) {
    const { status, agentId, notes } = overrideData;

    const order = await orderRepository.findById(orderId);
    if (!order) {
      throw new NotFoundError('Order not found or has been deleted');
    }

    // 1. If agent assignment change is requested
    if (agentId !== undefined) {
      if (agentId === null) {
        // Unassign agent
        await orderRepository.assignAgent(orderId, null, adminUser.id, `Admin Override: Unassigned Agent. Reason: ${notes}`);
      } else {
        // Validate agent exists
        const agent = await userRepository.findById(agentId);
        if (!agent || agent.role !== 'AGENT') {
          throw new NotFoundError('Target agent user not found or is inactive');
        }
        await orderRepository.assignAgent(orderId, agentId, adminUser.id, `Admin Override: Assigned Agent ${agent.name}. Reason: ${notes}`);
      }
    }

    // 2. If status change is requested
    if (status !== undefined) {
      await orderRepository.updateStatus(orderId, status, adminUser.id, `Admin Override: Force Status Update. Reason: ${notes}`);
    }

    // Trigger Notification dynamically on override changes
    if (status !== undefined || agentId !== undefined) {
      try {
        const notificationService = (await import('./notificationService.js')).default;
        await notificationService.sendOrderStatusEmail(orderId);
      } catch (err) {
        console.error('⚠️ [AdminOverride] Notification trigger error:', err.message);
      }
    }

    return orderRepository.findById(orderId);
  }

  /**
   * Agent order status progression logic with transition validation.
   * @param {string} orderId 
   * @param {string} agentId 
   * @param {object} updateData 
   * @returns {Promise<object>}
   */
  async updateOrderStatusByAgent(orderId, agentId, updateData) {
    const { status: nextStatus, notes, failedReason } = updateData;

    const order = await orderRepository.findById(orderId);
    if (!order) {
      throw new NotFoundError('Order not found or has been deleted');
    }

    // 1. Verify ownership/assignment check
    if (order.agentId !== agentId) {
      throw new ForbiddenError('You are not authorized to update status for this order as you are not the assigned agent.');
    }

    // 2. Validate transition legality
    if (!this.isValidTransition(order.status, nextStatus)) {
      throw new BadRequestError(`Invalid status transition from "${order.status}" to "${nextStatus}".`);
    }

    // 3. Perform update inside transaction
    await prisma.$transaction(async (tx) => {
      const updatePayload = { status: nextStatus };
      if (nextStatus === 'DELIVERED') {
        updatePayload.actualDeliveryTime = new Date();
      }
      if (nextStatus === 'FAILED') {
        updatePayload.failedReason = failedReason;
      }

      await tx.deliveryOrder.update({
        where: { id: orderId },
        data: updatePayload
      });

      await tx.trackingHistory.create({
        data: {
          orderId,
          status: nextStatus,
          changedById: agentId,
          notes: notes || `Order progressed to ${nextStatus}.`
        }
      });
    });

    // Trigger Notification dynamically if implemented
    try {
      const notificationService = (await import('./notificationService.js')).default;
      notificationService.sendOrderStatusEmail(orderId);
    } catch (err) {
      console.error('⚠️ [AgentStatusUpdate] Notification trigger error:', err.message);
    }

    return orderRepository.findById(orderId);
  }

  /**
   * Reschedule failed delivery order back to CREATED status.
   * @param {string} orderId 
   * @param {string} customerId 
   * @param {object} rescheduleData 
   * @returns {Promise<object>}
   */
  async rescheduleOrder(orderId, customerId, rescheduleData) {
    const { notes } = rescheduleData;

    const order = await orderRepository.findById(orderId);
    if (!order) {
      throw new NotFoundError('Order not found or has been deleted');
    }

    // 1. Verify ownership
    if (order.customerId !== customerId) {
      throw new ForbiddenError('You do not have permission to reschedule this order.');
    }

    // 2. Enforce only failed orders can be rescheduled
    if (order.status !== 'FAILED') {
      throw new BadRequestError('Only failed orders can be rescheduled.');
    }

    // 3. Update order in transaction
    await prisma.$transaction(async (tx) => {
      // Clear agent assignment, reset failed reason, reset status to CREATED, increment reschedule count
      await tx.deliveryOrder.update({
        where: { id: orderId },
        data: {
          status: 'CREATED',
          agentId: null,
          failedReason: null,
          rescheduledCount: { increment: 1 }
        }
      });

      // Write RESCHEDULED status history entry
      await tx.trackingHistory.create({
        data: {
          orderId,
          status: 'RESCHEDULED',
          changedById: customerId,
          notes: notes || 'Delivery rescheduled by customer.'
        }
      });

      // Write CREATED status history entry (signifies it is back in pool)
      await tx.trackingHistory.create({
        data: {
          orderId,
          status: 'CREATED',
          changedById: customerId,
          notes: 'Order returned to dispatch queue.'
        }
      });
    });

    // 4. Trigger auto assignment dynamically
    const autoAssignConfig = await prisma.systemConfig.findUnique({
      where: { key: 'AUTO_ASSIGN_ENABLE' }
    });
    
    if (autoAssignConfig && autoAssignConfig.value === 'true') {
      try {
        const assignmentService = (await import('./assignmentService.js')).default;
        await assignmentService.autoAssignOrder(orderId);
      } catch (err) {
        console.error('⚠️ [RescheduleAutoAssign] Auto matching trigger failed:', err.message);
      }
    }

    // Trigger Notification dynamically
    try {
      const notificationService = (await import('./notificationService.js')).default;
      notificationService.sendOrderStatusEmail(orderId);
    } catch (err) {
      console.error('⚠️ [RescheduleNotification] Email notification failed:', err.message);
    }

    return orderRepository.findById(orderId);
  }
}

export default new OrderService();
