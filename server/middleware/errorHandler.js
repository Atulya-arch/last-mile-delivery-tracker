import { errorResponse } from '../utils/responseFormatter.js';

export class AppError extends Error {
  constructor(message, statusCode, errors = null) {
    super(message);
    this.statusCode = statusCode;
    this.errors = errors;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class BadRequestError extends AppError {
  constructor(message = 'Bad Request', errors = null) {
    super(message, 400, errors);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized') {
    super(message, 401);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Forbidden') {
    super(message, 403);
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Resource Not Found') {
    super(message, 404);
  }
}

export class ConflictError extends AppError {
  constructor(message = 'Resource Conflict', errors = null) {
    super(message, 409, errors);
  }
}

export class UnprocessableEntityError extends AppError {
  constructor(message = 'Validation Error', errors = null) {
    super(message, 422, errors);
  }
}

/**
 * Express global error handling middleware.
 */
export const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';
  const errors = err.errors || null;

  // Log internal errors for debugging
  if (!err.isOperational) {
    console.error('💥 Unexpected Server Error:', err);
  }

  res.status(statusCode).json(errorResponse(message, errors));
};
