import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import userRepository from '../repositories/userRepository.js';
import agentRepository from '../repositories/agentRepository.js';
import { ConflictError, UnauthorizedError, NotFoundError } from '../middleware/errorHandler.js';

export class AuthService {
  /**
   * Register a new Customer or Agent user.
   * @param {object} input 
   * @returns {Promise<object>}
   */
  async register(input) {
    const { name, email, password, phone, role, vehicleType, licenseNumber } = input;

    // 1. Check duplicate email
    const existingUser = await userRepository.findByEmail(email);
    if (existingUser) {
      throw new ConflictError('Email is already registered');
    }

    // 2. Check duplicate license number if AGENT
    if (role === 'AGENT') {
      const existingLicense = await agentRepository.findByLicenseNumber(licenseNumber);
      if (existingLicense) {
        throw new ConflictError('License number is already registered');
      }
    }

    // 3. Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // 4. Create User (and profile if agent)
    let user;
    if (role === 'AGENT') {
      user = await userRepository.createAgent(
        { email, passwordHash, name, phone },
        { vehicleType, licenseNumber }
      );
    } else {
      user = await userRepository.createCustomer({ email, passwordHash, name, phone });
    }

    // Remove sensitive information
    delete user.passwordHash;

    // 5. Generate Token
    const token = this.generateToken(user);

    return { user, token };
  }

  /**
   * Authenticate email/password credentials and return user context & JWT token.
   * @param {object} input 
   * @returns {Promise<object>}
   */
  async login(input) {
    const { email, password } = input;

    // 1. Retrieve user
    const user = await userRepository.findByEmail(email);
    if (!user) {
      throw new UnauthorizedError('Invalid email or password');
    }

    // 2. Compare password hashes
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedError('Invalid email or password');
    }

    // Remove sensitive information
    delete user.passwordHash;

    // 3. Generate token
    const token = this.generateToken(user);

    return { user, token };
  }

  /**
   * Fetch current user profile with profile attachments.
   * @param {string} userId 
   * @returns {Promise<object>}
   */
  async getProfile(userId) {
    const user = await userRepository.findById(userId);
    if (!user) {
      throw new NotFoundError('User profile not found');
    }

    delete user.passwordHash;
    return user;
  }

  /**
   * Utility method to generate signed JWT token.
   * @param {object} user 
   * @returns {string} JWT Token
   */
  generateToken(user) {
    return jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      env.JWT_SECRET,
      { expiresIn: env.JWT_EXPIRES_IN }
    );
  }
}

export default new AuthService();
