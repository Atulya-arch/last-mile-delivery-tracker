import prisma from '../config/prismaClient.js';
import orderRepository from '../repositories/orderRepository.js';
import agentRepository from '../repositories/agentRepository.js';

export class AssignmentService {
  /**
   * Run the automatic driver matching algorithm for a given order.
   * Matches available agents where:
   * 1. Agent operates in the same pickup zone as the order's origin area.
   * 2. Agent status is AVAILABLE.
   * 3. Agent active workload is less than MAX_DRIVER_LOAD.
   * 4. Orders are assigned to the "First Available" (longest idle / oldest profile update).
   * 
   * @param {string} orderId 
   * @returns {Promise<boolean>} True if matching succeeded, false otherwise.
   */
  async autoAssignOrder(orderId) {
    console.log(`🤖 [AutoAssign] Starting matching engine for Order: ${orderId}`);

    // 1. Fetch order details
    const order = await orderRepository.findById(orderId);
    if (!order) {
      console.log(`❌ [AutoAssign] Order ${orderId} not found.`);
      return false;
    }

    if (order.status !== 'CREATED') {
      console.log(`ℹ️ [AutoAssign] Order ${order.orderNumber} is in status "${order.status}". Skipping auto-assignment.`);
      return false;
    }

    const pickupZoneId = order.pickupArea.zoneId;

    // 2. Fetch load limits from system configurations
    const maxLoadConfig = await prisma.systemConfig.findUnique({
      where: { key: 'MAX_DRIVER_LOAD' }
    });
    const maxLoad = maxLoadConfig ? parseInt(maxLoadConfig.value, 10) : 3;

    // 3. Query eligible agents in the pickup zone
    const eligibleAgents = await agentRepository.findAvailableAgentsForAssignment(pickupZoneId, maxLoad);

    if (eligibleAgents.length === 0) {
      console.log(`⚠️ [AutoAssign] No available agents found in pickup zone "${order.pickupArea.zone.name}" for Order ${order.orderNumber}.`);
      return false;
    }

    // 4. Sort by agentProfile.updatedAt ascending (First Available / Longest Idle)
    eligibleAgents.sort((a, b) => {
      const dateA = new Date(a.agentProfile.updatedAt);
      const dateB = new Date(b.agentProfile.updatedAt);
      return dateA - dateB;
    });

    const chosenAgent = eligibleAgents[0];

    // 5. Execute assignment
    await orderRepository.assignAgent(
      order.id,
      chosenAgent.id,
      chosenAgent.id, // Changed by agent himself (or system context)
      `System Auto-Assignment: Matched to nearest available agent ${chosenAgent.name} (vehicle: ${chosenAgent.agentProfile.vehicleType}).`
    );

    console.log(`✅ [AutoAssign] Order ${order.orderNumber} successfully auto-assigned to Agent ${chosenAgent.name}`);

    // Trigger Notification dynamically if implemented
    try {
      const notificationService = (await import('./notificationService.js')).default;
      notificationService.sendOrderStatusEmail(order.id);
    } catch (err) {
      console.error('⚠️ [AutoAssign] Notification trigger error:', err.message);
    }

    return true;
  }

  /**
   * Scan for pending orders in the agent's operating zone and run auto-assignment.
   * Runs when the agent updates their status to AVAILABLE or changes their operating zone.
   * 
   * @param {string} agentId 
   */
  async autoAssignPendingOrdersForAgent(agentId) {
    console.log(`🤖 [AutoAssign] Scanning pending orders for newly available Agent: ${agentId}`);

    // 1. Fetch agent profile
    const agent = await prisma.user.findUnique({
      where: { id: agentId, deletedAt: null },
      include: { agentProfile: true }
    });

    if (!agent || !agent.agentProfile) {
      console.log(`❌ [AutoAssign] Agent profile not found for ID: ${agentId}`);
      return;
    }

    const { status, zoneId } = agent.agentProfile;
    if (status !== 'AVAILABLE' || !zoneId) {
      console.log(`ℹ️ [AutoAssign] Agent is not AVAILABLE or has no operating zone. Skipping pending assignments.`);
      return;
    }

    // 2. Fetch all CREATED orders in the agent's zone
    const pendingOrders = await prisma.deliveryOrder.findMany({
      where: {
        status: 'CREATED',
        deletedAt: null,
        pickupArea: {
          zoneId: zoneId,
          deletedAt: null
        }
      },
      orderBy: { createdAt: 'asc' }
    });

    console.log(`🤖 [AutoAssign] Found ${pendingOrders.length} pending orders in zone ${zoneId} for Agent ${agent.name}`);

    // 3. Attempt to auto-assign each order
    for (const order of pendingOrders) {
      const assigned = await this.autoAssignOrder(order.id);
      if (!assigned) {
        console.log(`ℹ️ [AutoAssign] Agent ${agent.name} could not be matched to further orders.`);
        break;
      }
    }
  }
}

export default new AssignmentService();
