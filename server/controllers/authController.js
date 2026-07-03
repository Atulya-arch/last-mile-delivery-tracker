import authService from '../services/authService.js';
import { registerSchema, loginSchema } from '../validators/authValidator.js';
import { successResponse } from '../utils/responseFormatter.js';
import { UnprocessableEntityError } from '../middleware/errorHandler.js';

export class AuthController {
  /**
   * Register a new user (Customer or Agent).
   */
  async register(req, res, next) {
    try {
      const parsed = registerSchema.safeParse(req.body);
      if (!parsed.success) {
        return next(new UnprocessableEntityError('Registration validation failed', parsed.error.format()));
      }

      const result = await authService.register(parsed.data);
      res.status(201).json(successResponse('User registered successfully', result));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Login user and issue JWT token.
   */
  async login(req, res, next) {
    try {
      const parsed = loginSchema.safeParse(req.body);
      if (!parsed.success) {
        return next(new UnprocessableEntityError('Login validation failed', parsed.error.format()));
      }

      const result = await authService.login(parsed.data);
      res.status(200).json(successResponse('Login successful', result));
    } catch (error) {
      next(error);
    }
  }

  async me(req, res, next) {
    try {
      const userId = req.user.id;
      const user = await authService.getProfile(userId);
      res.status(200).json(successResponse('Current user context fetched successfully', { user }));
    } catch (error) {
      next(error);
    }
  }

  async verifyOtp(req, res, next) {
    try {
      const { email, otp } = req.body;
      if (!email || !otp) {
        return next(new UnprocessableEntityError('Email and OTP code are required.'));
      }
      const result = await authService.verifyOtp(email, otp);
      res.status(200).json(successResponse('Email verified and logged in successfully', result));
    } catch (error) {
      next(error);
    }
  }

  async resendOtp(req, res, next) {
    try {
      const { email } = req.body;
      if (!email) {
        return next(new UnprocessableEntityError('Email address is required.'));
      }
      const result = await authService.resendOtp(email);
      res.status(200).json(successResponse('Verification code resent successfully', result));
    } catch (error) {
      next(error);
    }
  }
}

export default new AuthController();
