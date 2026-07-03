import prisma from '../config/prismaClient.js';
import zoneRepository from '../repositories/zoneRepository.js';
import areaRepository from '../repositories/areaRepository.js';
import rateCardRepository from '../repositories/rateCardRepository.js';
import { ConflictError, NotFoundError } from '../middleware/errorHandler.js';

export class AdminService {
  // === ZONE SERVICES ===

  async createZone(name) {
    const existing = await zoneRepository.findByName(name);
    if (existing) {
      throw new ConflictError(`Zone with name "${name}" already exists`);
    }
    return zoneRepository.create(name);
  }

  async listZones() {
    return zoneRepository.findAll();
  }

  async deleteZone(zoneId) {
    const zone = await zoneRepository.findById(zoneId);
    if (!zone) {
      throw new NotFoundError('Zone not found or already deleted');
    }

    // Cascade soft-delete within database transaction
    await prisma.$transaction(async (tx) => {
      await zoneRepository.softDelete(zoneId, tx);
      await areaRepository.softDeleteByZoneId(zoneId, tx);
      await rateCardRepository.softDeleteByZoneId(zoneId, tx);
    });

    return { id: zoneId };
  }

  // === AREA SERVICES ===

  async createArea(name, zoneId) {
    // 1. Ensure target zone exists and is active
    const zone = await zoneRepository.findById(zoneId);
    if (!zone) {
      throw new NotFoundError('Target zone not found or is inactive');
    }

    // 2. Ensure area name is unique
    const existing = await areaRepository.findByName(name);
    if (existing) {
      throw new ConflictError(`Area with name "${name}" already exists`);
    }

    return areaRepository.create(name, zoneId);
  }

  async listAreas() {
    return areaRepository.findAll();
  }

  async deleteArea(areaId) {
    const area = await areaRepository.findById(areaId);
    if (!area) {
      throw new NotFoundError('Area not found or already deleted');
    }
    return areaRepository.softDelete(areaId);
  }

  // === RATE CARD SERVICES ===

  async createRateCard(data) {
    const { pickupZoneId, dropZoneId, orderType } = data;

    // 1. Verify pickup and drop zones exist
    const pickupZone = await zoneRepository.findById(pickupZoneId);
    if (!pickupZone) {
      throw new NotFoundError('Pickup zone not found or is inactive');
    }

    const dropZone = await zoneRepository.findById(dropZoneId);
    if (!dropZone) {
      throw new NotFoundError('Drop zone not found or is inactive');
    }

    // 2. Prevent duplicate routes for the same orderType
    const existing = await rateCardRepository.findByRoute(pickupZoneId, dropZoneId, orderType);
    if (existing) {
      throw new ConflictError(`A Rate Card configuration already exists for route from ${pickupZone.name} to ${dropZone.name} with type ${orderType}`);
    }

    return rateCardRepository.create(data);
  }

  async listRateCards() {
    return rateCardRepository.findAll();
  }

  async deleteRateCard(id) {
    const card = await rateCardRepository.findById(id);
    if (!card) {
      throw new NotFoundError('Rate card not found or already deleted');
    }
    return rateCardRepository.softDelete(id);
  }

  // === AGENT LOOKUPS & MANAGEMENT ===

  async listAgents() {
    return prisma.user.findMany({
      where: {
        role: 'AGENT',
        deletedAt: null
      },
      include: {
        agentProfile: {
          include: {
            zone: true
          }
        }
      },
      orderBy: { name: 'asc' }
    });
  }

  async updateAgentProfile(agentUserId, data) {
    const user = await prisma.user.findFirst({
      where: { id: agentUserId, role: 'AGENT', deletedAt: null }
    });
    if (!user) {
      throw new NotFoundError('Agent user not found or is inactive');
    }

    const { zoneId, status } = data;
    const updatePayload = {};
    if (zoneId !== undefined) {
      if (zoneId !== null) {
        const zone = await prisma.zone.findFirst({ where: { id: zoneId, deletedAt: null } });
        if (!zone) throw new NotFoundError('Target zone not found');
      }
      updatePayload.zoneId = zoneId;
    }
    if (status !== undefined) {
      updatePayload.status = status;
    }

    const profile = await prisma.agentProfile.update({
      where: { userId: agentUserId },
      data: updatePayload
    });

    // Trigger retroactive matching if status becomes AVAILABLE or zoneId changes
    if (status === 'AVAILABLE' || zoneId !== undefined) {
      try {
        const assignmentService = (await import('./assignmentService.js')).default;
        await assignmentService.autoAssignPendingOrdersForAgent(agentUserId);
      } catch (err) {
        console.error('⚠️ [AdminAgentUpdate] AutoAssign trigger error:', err.message);
      }
    }

    return profile;
  }

  async deleteAgent(agentUserId) {
    const user = await prisma.user.findFirst({
      where: { id: agentUserId, role: 'AGENT', deletedAt: null }
    });
    if (!user) {
      throw new NotFoundError('Agent user not found or already deactivated');
    }

    await prisma.$transaction(async (tx) => {
      const now = new Date();
      // Soft delete user
      await tx.user.update({
        where: { id: agentUserId },
        data: { deletedAt: now }
      });

      // Soft delete agent profile
      await tx.agentProfile.update({
        where: { userId: agentUserId },
        data: { deletedAt: now }
      });

      // Release any active orders assigned to this agent back to CREATED pool
      const activeOrders = await tx.deliveryOrder.findMany({
        where: { 
          agentId: agentUserId, 
          status: { in: ['ASSIGNED', 'PICKED_UP', 'IN_TRANSIT', 'OUT_FOR_DELIVERY'] }, 
          deletedAt: null 
        }
      });

      for (const order of activeOrders) {
        await tx.deliveryOrder.update({
          where: { id: order.id },
          data: { agentId: null, status: 'CREATED' }
        });
        await tx.trackingHistory.create({
          data: {
            orderId: order.id,
            status: 'CREATED',
            changedById: agentUserId,
            notes: 'Agent profile deactivated by administrator. Order returned to pool.'
          }
        });
      }
    });

    return { id: agentUserId };
  }

  async listCustomers() {
    return prisma.user.findMany({
      where: {
        role: 'CUSTOMER',
        deletedAt: null
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true
      },
      orderBy: { name: 'asc' }
    });
  }
}

export default new AdminService();
