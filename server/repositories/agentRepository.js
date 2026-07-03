import prisma from '../config/prismaClient.js';

export class AgentRepository {
  /**
   * Find active agent profile by license number.
   * @param {string} licenseNumber 
   * @returns {Promise<object|null>}
   */
  async findByLicenseNumber(licenseNumber) {
    return prisma.agentProfile.findFirst({
      where: {
        licenseNumber,
        deletedAt: null
      }
    });
  }

  /**
   * Update agent profile parameters (status, coordinates, zoneId, etc.).
   * @param {string} userId 
   * @param {object} updateData 
   * @returns {Promise<object>}
   */
  async updateProfile(userId, updateData) {
    return prisma.agentProfile.update({
      where: { userId },
      data: updateData
    });
  }

  /**
   * Find available agents in a specific pickup zone, whose active order count is below the maximum driver load.
   * Active orders are orders in CREATED, ASSIGNED, PICKED_UP, IN_TRANSIT, or OUT_FOR_DELIVERY status.
   * @param {string} zoneId 
   * @param {number} maxLoad 
   * @returns {Promise<object[]>}
   */
  async findAvailableAgentsForAssignment(zoneId, maxLoad) {
    return prisma.user.findMany({
      where: {
        role: 'AGENT',
        deletedAt: null,
        agentProfile: {
          zoneId,
          status: 'AVAILABLE',
          deletedAt: null
        }
      },
      include: {
        agentProfile: true,
        // Include agent orders count where status is not complete (DELIVERED, CANCELLED, FAILED)
        agentOrders: {
          where: {
            status: {
              in: ['ASSIGNED', 'PICKED_UP', 'IN_TRANSIT', 'OUT_FOR_DELIVERY']
            },
            deletedAt: null
          }
        }
      }
    }).then(agents => {
      // Filter out agents exceeding max workload limit
      return agents.filter(agent => agent.agentOrders.length < maxLoad);
    });
  }
}

export default new AgentRepository();
