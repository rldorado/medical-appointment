/**
 * Error Handler Utility
 * 
 * Provides centralized error handling functionality for the application.
 * Includes error categorization, formatting, and reporting capabilities.
 */
import { logger } from './logger';

// Create a module-specific logger
const log = logger.error;

// Define error categories for better error handling
export enum ErrorCategory {
  API = 'API_ERROR',
  NETWORK = 'NETWORK_ERROR',
  VALIDATION = 'VALIDATION_ERROR',
  AUTHENTICATION = 'AUTH_ERROR',
  UNKNOWN = 'UNKNOWN_ERROR'
}

// Custom error class with additional properties
export class AppError extends Error {
  category: ErrorCategory;
  originalError?: any;
  statusCode?: number;
  
  constructor(
    message: string, 
    category: ErrorCategory = ErrorCategory.UNKNOWN, 
    originalError?: any,
    statusCode?: number
  ) {
    super(message);
    this.name = 'AppError';
    this.category = category;
    this.originalError = originalError;
    this.statusCode = statusCode;
    
    // Ensure the prototype chain is properly maintained
    Object.setPrototypeOf(this, AppError.prototype);
  }
  
  // Get a user-friendly message based on the error category
  getUserFriendlyMessage(): string {
    switch (this.category) {
      case ErrorCategory.API:
        return 'There was an issue with our service. Please try again later.';
      case ErrorCategory.NETWORK:
        return 'Please check your internet connection and try again.';
      case ErrorCategory.VALIDATION:
        return this.message; // Validation errors should already be user-friendly
      case ErrorCategory.AUTHENTICATION:
        return 'Your session may have expired. Please refresh the page and try again.';
      case ErrorCategory.UNKNOWN:
      default:
        return 'An unexpected error occurred. Please try again later.';
    }
  }
}

// Create API-specific error
export function createApiError(message: string, statusCode?: number, originalError?: any): AppError {
  return new AppError(
    message,
    ErrorCategory.API,
    originalError,
    statusCode
  );
}

// Create network error
export function createNetworkError(message: string, originalError?: any): AppError {
  return new AppError(
    message,
    ErrorCategory.NETWORK,
    originalError
  );
}

// Create validation error
export function createValidationError(message: string, originalError?: any): AppError {
  return new AppError(
    message,
    ErrorCategory.VALIDATION,
    originalError
  );
}

/**
 * Handle errors in a consistent way across the application
 * @param error The error to handle
 * @param context Additional context about where the error occurred
 * @returns A user-friendly error message
 */
export function handleError(error: any, context: string = 'Application'): string {
  // Convert to AppError if it's not already
  const appError = error instanceof AppError 
    ? error 
    : new AppError(
        error?.message || 'An unknown error occurred',
        ErrorCategory.UNKNOWN,
        error
      );
  
  // Log the error with context
  log(`${context}: ${appError.message}`, appError.originalError, { 
    module: 'ErrorHandler',
    showTimestamp: true 
  });
  
  // Additional error reporting could be added here
  // e.g., sending to a monitoring service in production
  
  // Return a user-friendly message
  return appError.getUserFriendlyMessage();
}

/**
 * Parse and handle API response errors
 * @param response The fetch Response object
 * @param context The context where the error occurred
 * @returns A promise that rejects with an AppError
 */
export async function handleApiError(response: Response, context: string): Promise<never> {
  let errorText = 'Unknown API error';
  
  try {
    // Try to get error details from response
    const errorData = await response.text();
    errorText = errorData || `HTTP error ${response.status}`;
  } catch (e) {
    errorText = `HTTP error ${response.status}`;
  }
  
  // Include context in the error message for better debugging
  const errorMessage = `${context}: ${errorText}`;
  
  throw createApiError(
    errorMessage,
    response.status,
    { status: response.status, statusText: response.statusText }
  );
}
