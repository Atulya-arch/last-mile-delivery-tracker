import orderService from '../services/orderService.js';
import { createOrderSchema, overrideOrderSchema } from '../validators/orderValidator.js';
import { rescheduleSchema } from '../validators/rescheduleValidator.js';
import { successResponse } from '../utils/responseFormatter.js';
import { UnprocessableEntityError } from '../middleware/errorHandler.js';

export class OrderController {
  /**
   * Controller to place a new delivery order.
   */
  async placeOrder(req, res, next) {
    try {
      const parsed = createOrderSchema.safeParse(req.body);
      if (!parsed.success) {
        return next(new UnprocessableEntityError('Order placement validation failed', parsed.error.format()));
      }

      const order = await orderService.placeOrder(parsed.data, req.user);
      res.status(201).json(successResponse('Order placed successfully', { order }));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Controller to list delivery orders according to role scoping.
   */
  async getOrders(req, res, next) {
    try {
      const queryFilters = {
        status: req.query.status,
        customerId: req.query.customerId,
        agentId: req.query.agentId
      };

      const orders = await orderService.listOrders(queryFilters, req.user);
      res.status(200).json(successResponse('Orders retrieved successfully', { orders }));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Controller to retrieve a single order's full details and tracking timeline.
   */
  async getOrderDetails(req, res, next) {
    try {
      const { id } = req.params;
      const order = await orderService.getOrderDetails(id, req.user);
      res.status(200).json(successResponse('Order details retrieved successfully', { order }));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Controller to execute administrative overrides.
   */
  async overrideOrder(req, res, next) {
    try {
      const { id } = req.params;
      const parsed = overrideOrderSchema.safeParse(req.body);
      if (!parsed.success) {
        return next(new UnprocessableEntityError('Admin override validation failed', parsed.error.format()));
      }

      const order = await orderService.overrideOrder(id, parsed.data, req.user);
      res.status(200).json(successResponse('Order updated successfully via override', { order }));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Controller to reschedule failed delivery order.
   */
  async rescheduleOrder(req, res, next) {
    try {
      const { id } = req.params;
      const parsed = rescheduleSchema.safeParse(req.body);
      if (!parsed.success) {
        return next(new UnprocessableEntityError('Reschedule validation failed', parsed.error.format()));
      }

      const order = await orderService.rescheduleOrder(id, req.user.id, parsed.data);
      res.status(200).json(successResponse('Order rescheduled successfully', { order }));
    } catch (error) {
      next(error);
    }
  }
}

export default new OrderController();
