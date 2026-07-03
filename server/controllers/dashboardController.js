import dashboardService from '../services/dashboardService.js';
import { successResponse } from '../utils/responseFormatter.js';
import { BadRequestError } from '../middleware/errorHandler.js';

export class DashboardController {
  /**
   * Fetch aggregated summary stats scoped dynamically to the requester's role.
   */
  async getSummary(req, res, next) {
    try {
      const { id: userId, role } = req.user;
      let summary;
      let message;

      if (role === 'ADMIN') {
        summary = await dashboardService.getAdminSummary();
        message = 'Admin dashboard summary retrieved successfully';
      } else if (role === 'CUSTOMER') {
        summary = await dashboardService.getCustomerSummary(userId);
        message = 'Customer dashboard summary retrieved successfully';
      } else if (role === 'AGENT') {
        summary = await dashboardService.getAgentSummary(userId);
        message = 'Agent dashboard summary retrieved successfully';
      } else {
        throw new BadRequestError('Invalid or unsupported user role');
      }

      res.status(200).json(successResponse(message, { summary }));
    } catch (error) {
      next(error);
    }
  }
}

export default new DashboardController();
