import rateService from '../services/rateService.js';
import { quoteSchema } from '../validators/rateValidator.js';
import { successResponse } from '../utils/responseFormatter.js';
import { UnprocessableEntityError } from '../middleware/errorHandler.js';

export class RateController {
  /**
   * Calculate a pricing quote for a delivery order.
   */
  async getQuote(req, res, next) {
    try {
      const parsed = quoteSchema.safeParse(req.body);
      if (!parsed.success) {
        return next(new UnprocessableEntityError('Quote calculation validation failed', parsed.error.format()));
      }

      const quote = await rateService.calculateRate(parsed.data);
      res.status(200).json(successResponse('Pricing quote calculated successfully', { quote }));
    } catch (error) {
      next(error);
    }
  }
}

export default new RateController();
