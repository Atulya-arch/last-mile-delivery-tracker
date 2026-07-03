import prisma from '../config/prismaClient.js';

export class OrderRepository {
  /**
   * Helper to generate a unique order tracking code DT-XXXXXX.
   */
  async generateOrderNumber() {
    let orderNumber;
    let isUnique = false;

    while (!isUnique) {
      const rand = Math.floor(100000 + Math.random() * 900000);
      orderNumber = `DT-${rand}`;
      
      const existing = await prisma.deliveryOrder.findUnique({
        where: { orderNumber }
      });
      if (!existing) {
        isUnique = true;
      }
    }
    return orderNumber;
  }

  /**
   * Create a new Delivery Order and its initial CREATED history entry inside a transaction.
   * @param {object} orderData - Inputs from validator
   * @param {object} rateData - Outputs from RateService
   * @param {string} customerId - Resolved customer ID
   * @returns {Promise<object>} Created order record
   */
  async create(orderData, rateData, customerId) {
    const orderNumber = await this.generateOrderNumber();

    return prisma.$transaction(async (tx) => {
      // 1. Create order record
      const order = await tx.deliveryOrder.create({
        data: {
          orderNumber,
          customerId,
          pickupAreaId: rateData.pickupAreaId,
          dropAreaId: rateData.dropAreaId,
          pickupAddress: orderData.pickupAddress,
          deliveryAddress: orderData.deliveryAddress,
          length: orderData.length,
          width: orderData.width,
          height: orderData.height,
          actualWeight: orderData.actualWeight,
          volumetricWeight: rateData.volumetricWeight,
          billableWeight: rateData.billableWeight,
          orderType: orderData.orderType,
          paymentType: orderData.paymentType,
          price: rateData.finalPrice,
          status: 'CREATED',
          notes: orderData.notes
        }
      });

      // 2. Create initial history log
      await tx.trackingHistory.create({
        data: {
          orderId: order.id,
          status: 'CREATED',
          changedById: customerId,
          notes: 'Order placed successfully.'
        }
      });

      return order;
    });
  }

  /**
   * Fetch all active orders matching filtering criteria.
   * @param {object} filters 
   * @returns {Promise<object[]>}
   */
  async findAll(filters = {}) {
    const queryConditions = {
      deletedAt: null,
      ...filters
    };

    return prisma.deliveryOrder.findMany({
      where: queryConditions,
      orderBy: { createdAt: 'desc' }
    });
  }

  /**
   * Find an active order by ID, including client details, agent details, areas, and timeline logs.
   * @param {string} id 
   * @returns {Promise<object|null>}
   */
  async findById(id) {
    return prisma.deliveryOrder.findFirst({
      where: {
        id,
        deletedAt: null
      },
      include: {
        customer: {
          select: { id: true, name: true, email: true, phone: true }
        },
        agent: {
          select: { id: true, name: true, email: true, phone: true }
        },
        pickupArea: {
          include: { zone: { select: { name: true } } }
        },
        dropArea: {
          include: { zone: { select: { name: true } } }
        },
        trackingHistory: {
          include: {
            changedBy: { select: { name: true, role: true } }
          },
          orderBy: { createdAt: 'asc' }
        }
      }
    });
  }

  /**
   * Update order status and append a tracking timeline log within a database transaction.
   * @param {string} orderId 
   * @param {string} status 
   * @param {string} changedById 
   * @param {string} [notes] 
   * @param {object} [txContext] - Optional existing transaction context
   * @returns {Promise<object>} Updated order
   */
  async updateStatus(orderId, status, changedById, notes = null, txContext = prisma) {
    return txContext.$transaction(async (tx) => {
      // Update order status
      const order = await tx.deliveryOrder.update({
        where: { id: orderId },
        data: { status }
      });

      // Insert tracking history
      await tx.trackingHistory.create({
        data: {
          orderId,
          status,
          changedById,
          notes
        }
      });

      return order;
    });
  }

  /**
   * Assign/Reassign an agent to the order and transition status to ASSIGNED.
   * @param {string} orderId 
   * @param {string|null} agentId 
   * @param {string} changedById 
   * @param {string} notes 
   * @returns {Promise<object>} Updated order
   */
  async assignAgent(orderId, agentId, changedById, notes = 'Agent assigned to order.') {
    return prisma.$transaction(async (tx) => {
      // 1. Update order
      const order = await tx.deliveryOrder.update({
        where: { id: orderId },
        data: {
          agentId,
          status: agentId ? 'ASSIGNED' : 'CREATED'
        }
      });

      // 2. Append history log
      await tx.trackingHistory.create({
        data: {
          orderId,
          status: agentId ? 'ASSIGNED' : 'CREATED',
          changedById,
          notes
        }
      });

      return order;
    });
  }
}

export default new OrderRepository();
