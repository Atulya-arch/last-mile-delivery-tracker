import prisma from '../config/prismaClient.js';

export class UserRepository {
  /**
   * Find an active user by their email address.
   * @param {string} email 
   * @returns {Promise<object|null>}
   */
  async findByEmail(email) {
    return prisma.user.findFirst({
      where: {
        email,
        deletedAt: null
      }
    });
  }

  /**
   * Find an active user by their ID, including their Agent Profile if it exists.
   * @param {string} id 
   * @returns {Promise<object|null>}
   */
  async findById(id) {
    return prisma.user.findFirst({
      where: {
        id,
        deletedAt: null
      },
      include: {
        agentProfile: {
          where: {
            deletedAt: null
          }
        }
      }
    });
  }

  /**
   * Create a new Customer user.
   * @param {object} userData 
   * @returns {Promise<object>}
   */
  async createCustomer(userData) {
    return prisma.user.create({
      data: {
        email: userData.email,
        passwordHash: userData.passwordHash,
        name: userData.name,
        phone: userData.phone,
        role: 'CUSTOMER',
        isEmailVerified: userData.isEmailVerified || false,
        emailVerificationOtp: userData.emailVerificationOtp || null,
        emailVerificationExpires: userData.emailVerificationExpires || null
      }
    });
  }

  /**
   * Create an Agent user and their corresponding Agent Profile within a database transaction.
   * @param {object} userData 
   * @param {object} agentData 
   * @returns {Promise<object>}
   */
  async createAgent(userData, agentData) {
    return prisma.$transaction(async (tx) => {
      // 1. Create User
      const user = await tx.user.create({
        data: {
          email: userData.email,
          passwordHash: userData.passwordHash,
          name: userData.name,
          phone: userData.phone,
          role: 'AGENT',
          isEmailVerified: userData.isEmailVerified || false,
          emailVerificationOtp: userData.emailVerificationOtp || null,
          emailVerificationExpires: userData.emailVerificationExpires || null
        }
      });

      // 2. Create Agent Profile linked to User
      const profile = await tx.agentProfile.create({
        data: {
          userId: user.id,
          vehicleType: agentData.vehicleType,
          licenseNumber: agentData.licenseNumber,
          status: 'OFFLINE'
        }
      });

      return {
        ...user,
        agentProfile: profile
      };
    });
  }
}

export default new UserRepository();
