/**
 * Formats API success responses.
 * @param {string} message - User-friendly message.
 * @param {any} data - Response payload.
 * @returns {object} Standardized success response structure.
 */
export const successResponse = (message, data = null) => {
  return {
    success: true,
    message,
    data
  };
};

/**
 * Formats API error responses.
 * @param {string} message - Human-readable error message.
 * @param {any} errors - Detailed errors (e.g. Zod validation errors, database error specifics).
 * @returns {object} Standardized error response structure.
 */
export const errorResponse = (message, errors = null) => {
  return {
    success: false,
    message,
    errors
  };
};
