/**
 * Standard error handling utilities
 * Provides consistent error responses and logging across all services
 */

import logger from './logger';

/**
 * Custom error classes for different error types
 */
export class ApiError extends Error {
  constructor(message, statusCode = 500, details = null) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.details = details;
  }
}

export class NotFoundError extends ApiError {
  constructor(resource, identifier = null) {
    const message = identifier 
      ? `${resource} '${identifier}' not found`
      : `${resource} not found`;
    super(message, 404);
    this.name = 'NotFoundError';
  }
}

export class ValidationError extends ApiError {
  constructor(message, fields = {}) {
    super(message, 400, fields);
    this.name = 'ValidationError';
  }
}

export class AuthenticationError extends ApiError {
  constructor(message = 'Authentication required') {
    super(message, 401);
    this.name = 'AuthenticationError';
  }
}

export class AuthorizationError extends ApiError {
  constructor(message = 'Insufficient permissions') {
    super(message, 403);
    this.name = 'AuthorizationError';
  }
}

export class RateLimitError extends ApiError {
  constructor(message = 'Rate limit exceeded', retryAfter = null) {
    super(message, 429, { retryAfter });
    this.name = 'RateLimitError';
  }
}

/**
 * Handle errors consistently across the application
 * @param {Error} error - The error to handle
 * @param {string} context - Context where the error occurred (e.g., 'youtubeService.searchChannels')
 * @returns {object} Standardized error response
 */
export function handleError(error, context = '') {
  // Log the error
  logger.error(`[${context}]`, error);

  // If it's already our custom error, return it
  if (error instanceof ApiError) {
    return {
      success: false,
      error: error.message,
      statusCode: error.statusCode,
      details: error.details,
      context,
    };
  }

  // Handle Supabase errors
  if (error.code && error.code.startsWith('PGRST')) {
    let message = 'Database error';
    let statusCode = 500;

    switch (error.code) {
      case 'PGRST116': // Not found
        message = 'Resource not found';
        statusCode = 404;
        break;
      case 'PGRST301': // Unique violation
        message = 'Duplicate entry';
        statusCode = 409;
        break;
      case '23505': // Postgres unique violation
        message = 'This record already exists';
        statusCode = 409;
        break;
      default:
        message = error.message || message;
    }

    return {
      success: false,
      error: message,
      statusCode,
      details: { code: error.code },
      context,
    };
  }

  // Handle fetch/network errors
  if (error.name === 'TypeError' && error.message.includes('fetch')) {
    return {
      success: false,
      error: 'Network error - please check your connection',
      statusCode: 503,
      context,
    };
  }

  // Generic error
  return {
    success: false,
    error: error.message || 'An unexpected error occurred',
    statusCode: 500,
    context,
  };
}

/**
 * Wrap async functions with error handling
 * @param {Function} fn - Async function to wrap
 * @param {string} context - Context for error logging
 * @returns {Function} Wrapped function
 */
export function withErrorHandling(fn, context) {
  return async (...args) => {
    try {
      return await fn(...args);
    } catch (error) {
      const errorResponse = handleError(error, context);
      throw new ApiError(
        errorResponse.error,
        errorResponse.statusCode,
        errorResponse.details
      );
    }
  };
}

/**
 * Validate required parameters
 * @param {object} params - Parameters to validate
 * @param {string[]} required - Required parameter names
 * @throws {ValidationError}
 */
export function validateParams(params, required) {
  const missing = required.filter(key => !params[key]);
  
  if (missing.length > 0) {
    throw new ValidationError(
      `Missing required parameters: ${missing.join(', ')}`,
      missing.reduce((acc, key) => ({ ...acc, [key]: 'Required' }), {})
    );
  }
}

/**
 * Create a success response
 * @param {*} data - Response data
 * @param {string} message - Optional success message
 * @returns {object} Standardized success response
 */
export function successResponse(data, message = null) {
  return {
    success: true,
    data,
    ...(message && { message }),
  };
}

/**
 * Retry a function with exponential backoff
 * @param {Function} fn - Function to retry
 * @param {number} maxAttempts - Maximum number of attempts
 * @param {number} baseDelay - Base delay in ms (doubles each attempt)
 * @returns {Promise} Result of successful attempt
 */
export async function retryWithBackoff(fn, maxAttempts = 3, baseDelay = 1000) {
  let lastError;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      if (attempt === maxAttempts) {
        break;
      }

      // Don't retry on client errors (4xx)
      if (error instanceof ApiError && error.statusCode >= 400 && error.statusCode < 500) {
        break;
      }

      // Wait before retry with exponential backoff
      const delay = baseDelay * Math.pow(2, attempt - 1);
      await new Promise(resolve => setTimeout(resolve, delay));

      logger.warn(`Retry attempt ${attempt}/${maxAttempts} after ${delay}ms`);
    }
  }

  throw lastError;
}

export default {
  handleError,
  withErrorHandling,
  validateParams,
  successResponse,
  retryWithBackoff,
  ApiError,
  NotFoundError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  RateLimitError,
};
