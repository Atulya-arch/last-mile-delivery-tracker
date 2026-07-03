import prisma from '../config/prismaClient.js';

export class RateCardRepository {
  /**
   * Create a new Rate Card pricing mapping between two Zones.
   * @param {object} rateCardData 
   * @returns {Promise<object>}
   */
  async create(rateCardData) {
    return prisma.rateCard.create({
      data: {
        pickupZoneId: rateCardData.pickupZoneId,
        dropZoneId: rateCardData.dropZoneId,
        orderType: rateCardData.orderType,
        baseWeightLimit: rateCardData.baseWeightLimit,
        basePrice: rateCardData.basePrice,
        pricePerKg: rateCardData.pricePerKg,
        codSurcharge: rateCardData.codSurcharge
      }
    });
  }

  /**
   * Find all active Rate Cards.
   * @returns {Promise<object[]>}
   */
  async findAll() {
    return prisma.rateCard.findMany({
      where: {
        deletedAt: null,
        pickupZone: { deletedAt: null },
        dropZone: { deletedAt: null }
      },
      include: {
        pickupZone: { select: { id: true, name: true } },
        dropZone: { select: { id: true, name: true } }
      }
    });
  }

  /**
   * Find an active Rate Card by its ID.
   * @param {string} id 
   * @returns {Promise<object|null>}
   */
  async findById(id) {
    return prisma.rateCard.findFirst({
      where: {
        id,
        deletedAt: null,
        pickupZone: { deletedAt: null },
        dropZone: { deletedAt: null }
      }
    });
  }

  /**
   * Find an active Rate Card matching a specific route and order type.
   * @param {string} pickupZoneId 
   * @param {string} dropZoneId 
   * @param {string} orderType 
   * @returns {Promise<object|null>}
   */
  async findByRoute(pickupZoneId, dropZoneId, orderType) {
    return prisma.rateCard.findFirst({
      where: {
        pickupZoneId,
        dropZoneId,
        orderType,
        deletedAt: null,
        pickupZone: { deletedAt: null },
        dropZone: { deletedAt: null }
      }
    });
  }

  /**
   * Soft delete a specific Rate Card by ID.
   * @param {string} id 
   * @returns {Promise<object>}
   */
  async softDelete(id) {
    return prisma.rateCard.update({
      where: { id },
      data: { deletedAt: new Date() }
    });
  }

  /**
   * Soft delete all Rate Cards associated with a given Zone ID (as pickup or drop zone).
   * @param {string} zoneId 
   * @param {object} tx - Prisma transaction context
   * @returns {Promise<object>}
   */
  async softDeleteByZoneId(zoneId, tx = prisma) {
    return tx.rateCard.updateMany({
      where: {
        OR: [
          { pickupZoneId: zoneId },
          { dropZoneId: zoneId }
        ],
        deletedAt: null
      },
      data: { deletedAt: new Date() }
    });
  }
}

export default new RateCardRepository();
