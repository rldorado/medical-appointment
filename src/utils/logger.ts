/**
 * Logger Utility
 * 
 * Provides logging functionality that only outputs to the console in development mode.
 * In production, logs are suppressed to avoid exposing sensitive information.
 */

// Check if we're in development mode using Vite's environment variables
const isDev = import.meta.env.MODE === 'development' || import.meta.env.DEV;

type LogLevel = 'info' | 'warn' | 'error' | 'debug';

interface LoggerOptions {
  module?: string;
  showTimestamp?: boolean;
}

/**
 * Creates a formatted log message with optional module name and timestamp
 */
function formatMessage(level: LogLevel, message: string, options?: LoggerOptions): string {
  const parts: string[] = [];
  
  // Add timestamp if requested
  if (options?.showTimestamp) {
    parts.push(`[${new Date().toISOString()}]`);
  }
  
  // Add log level
  parts.push(`[${level.toUpperCase()}]`);
  
  // Add module name if provided
  if (options?.module) {
    parts.push(`[${options.module}]`);
  }
  
  // Add the actual message
  parts.push(message);
  
  return parts.join(' ');
}

/**
 * Main logger object with methods for different log levels
 */
export const logger = {
  /**
   * Log informational messages
   */
  info(message: string, data?: any, options?: LoggerOptions): void {
    if (isDev) {
      const formattedMessage = formatMessage('info', message, options);
      if (data) {
        console.info(formattedMessage, data);
      } else {
        console.info(formattedMessage);
      }
    }
  },
  
  /**
   * Log warning messages
   */
  warn(message: string, data?: any, options?: LoggerOptions): void {
    if (isDev) {
      const formattedMessage = formatMessage('warn', message, options);
      if (data) {
        console.warn(formattedMessage, data);
      } else {
        console.warn(formattedMessage);
      }
    }
  },
  
  /**
   * Log error messages
   */
  error(message: string, error?: any, options?: LoggerOptions): void {
    if (isDev) {
      const formattedMessage = formatMessage('error', message, options);
      if (error) {
        console.error(formattedMessage, error);
      } else {
        console.error(formattedMessage);
      }
    }
  },
  
  /**
   * Log debug messages (most verbose)
   */
  debug(message: string, data?: any, options?: LoggerOptions): void {
    if (isDev) {
      const formattedMessage = formatMessage('debug', message, options);
      if (data) {
        console.debug(formattedMessage, data);
      } else {
        console.debug(formattedMessage);
      }
    }
  }
};

/**
 * Create a logger instance with predefined options
 */
export function createLogger(defaultOptions: LoggerOptions) {
  return {
    info: (message: string, data?: any, options?: LoggerOptions) => 
      logger.info(message, data, { ...defaultOptions, ...options }),
    
    warn: (message: string, data?: any, options?: LoggerOptions) => 
      logger.warn(message, data, { ...defaultOptions, ...options }),
    
    error: (message: string, error?: any, options?: LoggerOptions) => 
      logger.error(message, error, { ...defaultOptions, ...options }),
    
    debug: (message: string, data?: any, options?: LoggerOptions) => 
      logger.debug(message, data, { ...defaultOptions, ...options })
  };
}
