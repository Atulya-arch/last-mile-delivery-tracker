import prisma from '../config/prismaClient.js';

export class AreaRepository {
  /**
   * Create a new Area linked to a Zone.
   * @param {string} name 
   * @param {string} zoneId 
   * @returns {Promise<object>}
   */
  async create(name, zoneId) {
    return prisma.area.create({
      data: { name, zoneId }
    });
  }

  /**
   * Find all active Areas with their Zone name included.
   * @returns {Promise<object[]>}
   */
  async findAll() {
    return prisma.area.findMany({
      where: {
        deletedAt: null,
        zone: { deletedAt: null }
      },
      include: {
        zone: {
          select: { id: true, name: true }
        }
      },
      orderBy: { name: 'asc' }
    });
  }

  /**
   * Find an active Area by its ID.
   * @param {string} id 
   * @returns {Promise<object|null>}
   */
  async findById(id) {
    return prisma.area.findFirst({
      where: {
        id,
        deletedAt: null,
        zone: { deletedAt: null }
      },
      include: {
        zone: true
      }
    });
  }

  /**
   * Find an active Area by its name.
   * @param {string} name 
   * @returns {Promise<object|null>}
   */
  async findByName(name) {
    return prisma.area.findFirst({
      where: {
        name,
        deletedAt: null,
        zone: { deletedAt: null }
      }
    });
  }

  /**
   * Soft delete a specific Area by ID.
   * @param {string} id 
   * @returns {Promise<object>}
   */
  async softDelete(id) {
    return prisma.area.update({
      where: { id },
      data: { deletedAt: new Date() }
    });
  }

  /**
   * Soft delete all Areas associated with a given Zone ID.
   * @param {string} zoneId 
   * @param {object} tx - Prisma transaction context
   * @returns {Promise<object>}
   */
  async softDeleteByZoneId(zoneId, tx = prisma) {
    return tx.area.updateMany({
      where: {
        zoneId,
        deletedAt: null
      },
      data: { deletedAt: new Date() }
    });
  }
}

export default new AreaRepository();
