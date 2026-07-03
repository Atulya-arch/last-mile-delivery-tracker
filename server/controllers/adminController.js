import adminService from '../services/adminService.js';
import { createZoneSchema, createAreaSchema, createRateCardSchema } from '../validators/adminValidator.js';
import { successResponse } from '../utils/responseFormatter.js';
import { UnprocessableEntityError } from '../middleware/errorHandler.js';

export class AdminController {
  // === ZONE CONTROLLERS ===

  async createZone(req, res, next) {
    try {
      const parsed = createZoneSchema.safeParse(req.body);
      if (!parsed.success) {
        return next(new UnprocessableEntityError('Zone validation failed', parsed.error.format()));
      }

      const zone = await adminService.createZone(parsed.data.name);
      res.status(201).json(successResponse('Zone created successfully', { zone }));
    } catch (error) {
      next(error);
    }
  }

  async getZones(req, res, next) {
    try {
      const zones = await adminService.listZones();
      res.status(200).json(successResponse('Zones retrieved successfully', { zones }));
    } catch (error) {
      next(error);
    }
  }

  async deleteZone(req, res, next) {
    try {
      const { id } = req.params;
      await adminService.deleteZone(id);
      res.status(200).json(successResponse('Zone and its dependent areas/rates soft deleted successfully'));
    } catch (error) {
      next(error);
    }
  }

  // === AREA CONTROLLERS ===

  async createArea(req, res, next) {
    try {
      const parsed = createAreaSchema.safeParse(req.body);
      if (!parsed.success) {
        return next(new UnprocessableEntityError('Area validation failed', parsed.error.format()));
      }

      const { name, zoneId } = parsed.data;
      const area = await adminService.createArea(name, zoneId);
      res.status(201).json(successResponse('Area created successfully', { area }));
    } catch (error) {
      next(error);
    }
  }

  async getAreas(req, res, next) {
    try {
      const areas = await adminService.listAreas();
      res.status(200).json(successResponse('Areas retrieved successfully', { areas }));
    } catch (error) {
      next(error);
    }
  }

  async deleteArea(req, res, next) {
    try {
      const { id } = req.params;
      await adminService.deleteArea(id);
      res.status(200).json(successResponse('Area soft deleted successfully'));
    } catch (error) {
      next(error);
    }
  }

  // === RATE CARD CONTROLLERS ===

  async createRateCard(req, res, next) {
    try {
      const parsed = createRateCardSchema.safeParse(req.body);
      if (!parsed.success) {
        return next(new UnprocessableEntityError('Rate card validation failed', parsed.error.format()));
      }

      const rateCard = await adminService.createRateCard(parsed.data);
      res.status(201).json(successResponse('Rate card configured successfully', { rateCard }));
    } catch (error) {
      next(error);
    }
  }

  async getRateCards(req, res, next) {
    try {
      const rateCards = await adminService.listRateCards();
      res.status(200).json(successResponse('Rate cards retrieved successfully', { rateCards }));
    } catch (error) {
      next(error);
    }
  }

  async deleteRateCard(req, res, next) {
    try {
      const { id } = req.params;
      await adminService.deleteRateCard(id);
      res.status(200).json(successResponse('Rate card soft deleted successfully'));
    } catch (error) {
      next(error);
    }
  }

  // === AGENT LOOKUPS & MANAGEMENT ===

  async getAgents(req, res, next) {
    try {
      const agents = await adminService.listAgents();
      res.status(200).json(successResponse('Agents list retrieved successfully', { agents }));
    } catch (error) {
      next(error);
    }
  }

  async updateAgent(req, res, next) {
    try {
      const { id } = req.params;
      const profile = await adminService.updateAgentProfile(id, req.body);
      res.status(200).json(successResponse('Agent profile updated successfully', { profile }));
    } catch (error) {
      next(error);
    }
  }

  async deleteAgent(req, res, next) {
    try {
      const { id } = req.params;
      await adminService.deleteAgent(id);
      res.status(200).json(successResponse('Agent profile deactivated successfully'));
    } catch (error) {
      next(error);
    }
  }

  async getCustomers(req, res, next) {
    try {
      const customers = await adminService.listCustomers();
      res.status(200).json(successResponse('Customers list retrieved successfully', { customers }));
    } catch (error) {
      next(error);
    }
  }
}

export default new AdminController();
