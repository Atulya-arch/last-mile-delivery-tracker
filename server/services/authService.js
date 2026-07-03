import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import prisma from '../config/prismaClient.js';
import userRepository from '../repositories/userRepository.js';
import agentRepository from '../repositories/agentRepository.js';
import notificationService from './notificationService.js';
import { ConflictError, UnauthorizedError, NotFoundError, BadRequestError } from '../middleware/errorHandler.js';

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

    // 4. Generate Verification OTP code
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expires = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes validity

    // 5. Create User (and profile if agent)
    let user;
    if (role === 'AGENT') {
      user = await userRepository.createAgent(
        { email, passwordHash, name, phone, isEmailVerified: false, emailVerificationOtp: otp, emailVerificationExpires: expires },
        { vehicleType, licenseNumber }
      );
    } else {
      user = await userRepository.createCustomer({
        email, passwordHash, name, phone, isEmailVerified: false, emailVerificationOtp: otp, emailVerificationExpires: expires
      });
    }

    // Send Verification Email (Asynchronously in background)
    notificationService.sendVerificationOtp(email, name, otp).catch(err => {
      console.error('⚠️ [AuthRegister] Background OTP dispatch failed:', err.message);
    });

    // Remove sensitive information
    delete user.passwordHash;

    return { user, requiresVerification: true };
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

    // 3. Enforce email verification check
    if (!user.isEmailVerified) {
      throw new UnauthorizedError('EMAIL_NOT_VERIFIED');
    }

    // Remove sensitive information
    delete user.passwordHash;

    // 4. Generate token
    const token = this.generateToken(user);

    return { user, token };
  }

  /**
   * Verify registration OTP and activate user account.
   * @param {string} email 
   * @param {string} otp 
   * @returns {Promise<object>}
   */
  async verifyOtp(email, otp) {
    const user = await prisma.user.findFirst({
      where: { email, deletedAt: null }
    });
    if (!user) {
      throw new NotFoundError('User account not found');
    }

    if (user.isEmailVerified) {
      throw new BadRequestError('Email address is already verified');
    }

    if (user.emailVerificationOtp !== otp) {
      throw new BadRequestError('Invalid verification OTP code');
    }

    if (user.emailVerificationExpires && user.emailVerificationExpires < new Date()) {
      throw new BadRequestError('Verification OTP code has expired');
    }

    // Update user to verified
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        isEmailVerified: true,
        emailVerificationOtp: null,
        emailVerificationExpires: null
      }
    });

    delete updatedUser.passwordHash;
    const token = this.generateToken(updatedUser);

    return { user: updatedUser, token };
  }

  /**
   * Resend a fresh verification OTP code.
   * @param {string} email 
   * @returns {Promise<object>}
   */
  async resendOtp(email) {
    const user = await prisma.user.findFirst({
      where: { email, deletedAt: null }
    });
    if (!user) {
      throw new NotFoundError('User account not found');
    }

    if (user.isEmailVerified) {
      throw new BadRequestError('Email address is already verified');
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expires = new Date(Date.now() + 15 * 60 * 1000);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerificationOtp: otp,
        emailVerificationExpires: expires
      }
    });

    await notificationService.sendVerificationOtp(user.email, user.name, otp);

    return { success: true, message: 'Verification code resent successfully' };
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
