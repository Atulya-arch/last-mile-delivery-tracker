import prisma from '../config/prismaClient.js';

export class DashboardService {
  /**
   * Aggregate statistics for administrators.
   * @returns {Promise<object>} Admin metrics breakdown
   */
  async getAdminSummary() {
    // 1. Fetch counts grouped by status
    const statusGroups = await prisma.deliveryOrder.groupBy({
      by: ['status'],
      where: { deletedAt: null },
      _count: { id: true }
    });

    const counts = {
      CREATED: 0,
      ASSIGNED: 0,
      PICKED_UP: 0,
      IN_TRANSIT: 0,
      OUT_FOR_DELIVERY: 0,
      DELIVERED: 0,
      FAILED: 0,
      RESCHEDULED: 0
    };

    statusGroups.forEach(group => {
      counts[group.status] = group._count.id;
    });

    const activeOrders = counts.CREATED + counts.ASSIGNED + counts.PICKED_UP + counts.IN_TRANSIT + counts.OUT_FOR_DELIVERY + counts.RESCHEDULED;
    const completedOrders = counts.DELIVERED;
    const failedOrders = counts.FAILED;

    // 2. Sum revenue
    const revenueSum = await prisma.deliveryOrder.aggregate({
      where: { deletedAt: null },
      _sum: { price: true }
    });
    const totalRevenue = Math.round((revenueSum._sum.price || 0) * 100) / 100;

    // 3. Count online available/busy agents
    const availableAgents = await prisma.agentProfile.count({
      where: {
        deletedAt: null,
        status: { in: ['AVAILABLE', 'BUSY'] }
      }
    });

    return {
      activeOrders,
      completedOrders,
      failedOrders,
      totalRevenue,
      availableAgents,
      statusBreakdown: {
        CREATED: counts.CREATED,
        ASSIGNED: counts.ASSIGNED,
        PICKED_UP: counts.PICKED_UP,
        IN_TRANSIT: counts.IN_TRANSIT,
        OUT_FOR_DELIVERY: counts.OUT_FOR_DELIVERY,
        FAILED: counts.FAILED,
        RESCHEDULED: counts.RESCHEDULED,
        DELIVERED: counts.DELIVERED
      }
    };
  }

  /**
   * Aggregate statistics for customers.
   * @param {string} customerId 
   * @returns {Promise<object>} Customer metrics breakdown
   */
  async getCustomerSummary(customerId) {
    const orders = await prisma.deliveryOrder.findMany({
      where: {
        customerId,
        deletedAt: null
      },
      select: { status: true }
    });

    let activeOrders = 0;
    let completedOrders = 0;
    let failedOrders = 0;

    orders.forEach(order => {
      if (['DELIVERED'].includes(order.status)) {
        completedOrders++;
      } else if (['FAILED'].includes(order.status)) {
        failedOrders++;
      } else {
        activeOrders++;
      }
    });

    return {
      activeOrders,
      completedOrders,
      failedOrders
    };
  }

  /**
   * Aggregate statistics for agents.
   * @param {string} agentId 
   * @returns {Promise<object>} Agent metrics breakdown
   */
  async getAgentSummary(agentId) {
    const orders = await prisma.deliveryOrder.findMany({
      where: {
        agentId,
        deletedAt: null
      },
      select: { status: true }
    });

    let activeOrders = 0;
    let completedOrders = 0;
    let failedOrders = 0;

    orders.forEach(order => {
      if (['DELIVERED'].includes(order.status)) {
        completedOrders++;
      } else if (['FAILED'].includes(order.status)) {
        failedOrders++;
      } else {
        activeOrders++;
      }
    });

    return {
      activeOrders,
      completedOrders,
      failedOrders
    };
  }
}

export default new DashboardService();
