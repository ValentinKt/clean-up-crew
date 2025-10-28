/**
 * Comprehensive logging utility with structured logging and sensitive data masking
 */

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

export interface LogContext {
  userId?: string;
  requestId?: string;
  component?: string;
  action?: string;
  eventId?: string;
  timestamp?: string;
  [key: string]: any;
}

export interface LogEntry {
  level: LogLevel;
  message: string;
  context?: LogContext;
  error?: Error;
  timestamp: string;
  requestId?: string;
}

class Logger {
  private static instance: Logger;
  private logLevel: LogLevel;
  private sensitiveFields = ['password', 'token', 'apiKey', 'secret', 'key', 'auth'];

  private constructor() {
    // Set log level based on environment - use simple check for development
    this.logLevel = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
      ? LogLevel.DEBUG 
      : LogLevel.INFO;
  }

  public static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  /**
   * Mask sensitive data in objects
   */
  private maskSensitiveData(data: any): any {
    if (typeof data !== 'object' || data === null) {
      return data;
    }

    if (Array.isArray(data)) {
      return data.map(item => this.maskSensitiveData(item));
    }

    const masked = { ...data };
    for (const key in masked) {
      if (this.sensitiveFields.some(field => 
        key.toLowerCase().includes(field.toLowerCase())
      )) {
        masked[key] = '***MASKED***';
      } else if (typeof masked[key] === 'object') {
        masked[key] = this.maskSensitiveData(masked[key]);
      }
    }
    return masked;
  }

  /**
   * Generate a unique request ID for tracking
   */
  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Format log entry for output
   */
  private formatLogEntry(entry: LogEntry): string {
    const levelName = LogLevel[entry.level];
    const timestamp = entry.timestamp;
    const requestId = entry.requestId ? `[${entry.requestId}]` : '';
    
    let formatted = `[${timestamp}] ${levelName} ${requestId} ${entry.message}`;
    
    if (entry.context && Object.keys(entry.context).length > 0) {
      const maskedContext = this.maskSensitiveData(entry.context);
      formatted += ` | Context: ${JSON.stringify(maskedContext)}`;
    }
    
    if (entry.error) {
      formatted += ` | Error: ${entry.error.message}`;
      if (entry.error.stack && this.logLevel === LogLevel.DEBUG) {
        formatted += ` | Stack: ${entry.error.stack}`;
      }
    }
    
    return formatted;
  }

  /**
   * Core logging method
   */
  private log(level: LogLevel, message: string, context?: LogContext, error?: Error): void {
    if (level < this.logLevel) {
      return;
    }

    const entry: LogEntry = {
      level,
      message,
      context: context ? { ...context, timestamp: new Date().toISOString() } : undefined,
      error,
      timestamp: new Date().toISOString(),
      requestId: context?.requestId || this.generateRequestId(),
    };

    const formattedMessage = this.formatLogEntry(entry);

    // Output to appropriate console method
    switch (level) {
      case LogLevel.DEBUG:
        console.debug(formattedMessage);
        break;
      case LogLevel.INFO:
        console.info(formattedMessage);
        break;
      case LogLevel.WARN:
        console.warn(formattedMessage);
        break;
      case LogLevel.ERROR:
        console.error(formattedMessage);
        break;
    }

    // In production, you might want to send logs to a service
    if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1' && level >= LogLevel.ERROR) {
      this.sendToLogService(entry);
    }
  }

  /**
   * Send critical logs to external service (placeholder)
   */
  private sendToLogService(entry: LogEntry): void {
    // Placeholder for external logging service integration
    // e.g., Sentry, LogRocket, or custom endpoint
    console.info('Would send to log service:', entry);
  }

  // Public logging methods
  public debug(message: string, context?: LogContext): void {
    this.log(LogLevel.DEBUG, message, context);
  }

  public info(message: string, context?: LogContext): void {
    this.log(LogLevel.INFO, message, context);
  }

  public warn(message: string, context?: LogContext, error?: Error): void {
    this.log(LogLevel.WARN, message, context, error);
  }

  public error(message: string, context?: LogContext, error?: Error): void {
    this.log(LogLevel.ERROR, message, context, error);
  }

  /**
   * Log API calls with timing
   */
  public apiCall(method: string, url: string, context?: LogContext): {
    success: (response?: any) => void;
    error: (error: Error) => void;
  } {
    const startTime = Date.now();
    const requestId = this.generateRequestId();
    
    this.debug(`API ${method} ${url} started`, { 
      ...context, 
      requestId, 
      method, 
      url 
    });

    return {
      success: (response?: any) => {
        const duration = Date.now() - startTime;
        this.info(`API ${method} ${url} completed`, {
          ...context,
          requestId,
          method,
          url,
          duration,
          status: 'success'
        });
      },
      error: (error: Error) => {
        const duration = Date.now() - startTime;
        this.error(`API ${method} ${url} failed`, {
          ...context,
          requestId,
          method,
          url,
          duration,
          status: 'error'
        }, error);
      }
    };
  }

  /**
   * Log user actions for analytics
   */
  public userAction(action: string, userId: string, context?: LogContext): void {
    this.info(`User action: ${action}`, {
      ...context,
      userId,
      action,
      component: context?.component || 'unknown'
    });
  }

  /**
   * Log performance metrics
   */
  public performance(metric: string, value: number, context?: LogContext): void {
    this.info(`Performance: ${metric}`, {
      ...context,
      metric,
      value,
      unit: context?.unit || 'ms'
    });
  }

  /**
   * Set log level dynamically
   */
  public setLogLevel(level: LogLevel): void {
    this.logLevel = level;
    this.info(`Log level changed to ${LogLevel[level]}`);
  }
}

// Export singleton instance
export const logger = Logger.getInstance();

// Export convenience functions
export const log = {
  debug: (message: string, context?: LogContext) => logger.debug(message, context),
  info: (message: string, context?: LogContext) => logger.info(message, context),
  warn: (message: string, context?: LogContext, error?: Error) => logger.warn(message, context, error),
  error: (message: string, context?: LogContext, error?: Error) => logger.error(message, context, error),
  apiCall: (method: string, url: string, context?: LogContext) => logger.apiCall(method, url, context),
  userAction: (action: string, userId: string, context?: LogContext) => logger.userAction(action, userId, context),
  performance: (metric: string, value: number, context?: LogContext) => logger.performance(metric, value, context),
};