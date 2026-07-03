import prisma from '../config/prismaClient.js';

export class ZoneRepository {
  /**
   * Create a new Zone.
   * @param {string} name 
   * @returns {Promise<object>}
   */
  async create(name) {
    return prisma.zone.create({
      data: { name }
    });
  }

  /**
   * Find all active Zones.
   * @returns {Promise<object[]>}
   */
  async findAll() {
    return prisma.zone.findMany({
      where: { deletedAt: null },
      orderBy: { name: 'asc' }
    });
  }

  /**
   * Find an active Zone by its ID.
   * @param {string} id 
   * @returns {Promise<object|null>}
   */
  async findById(id) {
    return prisma.zone.findFirst({
      where: {
        id,
        deletedAt: null
      }
    });
  }

  /**
   * Find an active Zone by its name.
   * @param {string} name 
   * @returns {Promise<object|null>}
   */
  async findByName(name) {
    return prisma.zone.findFirst({
      where: {
        name,
        deletedAt: null
      }
    });
  }

  /**
   * Soft delete a Zone. Can be passed a transaction client context.
   * @param {string} id 
   * @param {object} [tx] - Prisma transaction client context
   * @returns {Promise<object>}
   */
  async softDelete(id, tx = prisma) {
    return tx.zone.update({
      where: { id },
      data: { deletedAt: new Date() }
    });
  }
}

export default new ZoneRepository();
