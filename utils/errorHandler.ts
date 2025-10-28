import { logger } from './logger';

export enum ErrorType {
  NETWORK = 'NETWORK',
  VALIDATION = 'VALIDATION',
  AUTHENTICATION = 'AUTHENTICATION',
  AUTHORIZATION = 'AUTHORIZATION',
  NOT_FOUND = 'NOT_FOUND',
  SERVER = 'SERVER',
  CLIENT = 'CLIENT',
  UNKNOWN = 'UNKNOWN'
}

export interface AppError {
  type: ErrorType;
  message: string;
  code?: string;
  details?: any;
  timestamp: Date;
  userId?: string;
  requestId?: string;
}

export class ErrorHandler {
  private static instance: ErrorHandler;
  private logger = logger;

  private constructor() {}

  public static getInstance(): ErrorHandler {
    if (!ErrorHandler.instance) {
      ErrorHandler.instance = new ErrorHandler();
    }
    return ErrorHandler.instance;
  }

  public handleError(error: any, context?: string, userId?: string): AppError {
    const appError = this.normalizeError(error, userId);
    
    this.logger.error('Application error occurred', {
      error: appError,
      context,
      userId,
      stack: error?.stack
    });

    return appError;
  }

  public handleAsyncError(promise: Promise<any>, context?: string, userId?: string): Promise<any> {
    return promise.catch((error) => {
      const appError = this.handleError(error, context, userId);
      throw appError;
    });
  }

  private normalizeError(error: any, userId?: string): AppError {
    const timestamp = new Date();
    const requestId = this.generateRequestId();

    // Handle known error types
    if (error?.message?.includes('fetch')) {
      return {
        type: ErrorType.NETWORK,
        message: 'Network connection failed. Please check your internet connection.',
        code: 'NETWORK_ERROR',
        details: error.message,
        timestamp,
        userId,
        requestId
      };
    }

    if (error?.status === 401 || error?.message?.includes('unauthorized')) {
      return {
        type: ErrorType.AUTHENTICATION,
        message: 'Authentication required. Please log in again.',
        code: 'AUTH_REQUIRED',
        details: error.message,
        timestamp,
        userId,
        requestId
      };
    }

    if (error?.status === 403) {
      return {
        type: ErrorType.AUTHORIZATION,
        message: 'You do not have permission to perform this action.',
        code: 'FORBIDDEN',
        details: error.message,
        timestamp,
        userId,
        requestId
      };
    }

    if (error?.status === 404) {
      return {
        type: ErrorType.NOT_FOUND,
        message: 'The requested resource was not found.',
        code: 'NOT_FOUND',
        details: error.message,
        timestamp,
        userId,
        requestId
      };
    }

    if (error?.status >= 500) {
      return {
        type: ErrorType.SERVER,
        message: 'Server error occurred. Please try again later.',
        code: 'SERVER_ERROR',
        details: error.message,
        timestamp,
        userId,
        requestId
      };
    }

    if (error?.status >= 400 && error?.status < 500) {
      return {
        type: ErrorType.CLIENT,
        message: error.message || 'Invalid request. Please check your input.',
        code: 'CLIENT_ERROR',
        details: error.message,
        timestamp,
        userId,
        requestId
      };
    }

    // Default to unknown error
    return {
      type: ErrorType.UNKNOWN,
      message: error?.message || 'An unexpected error occurred.',
      code: 'UNKNOWN_ERROR',
      details: error,
      timestamp,
      userId,
      requestId
    };
  }

  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  public isRetryableError(error: AppError): boolean {
    return [ErrorType.NETWORK, ErrorType.SERVER].includes(error.type);
  }

  public getUserFriendlyMessage(error: AppError): string {
    switch (error.type) {
      case ErrorType.NETWORK:
        return 'Connection problem. Please check your internet and try again.';
      case ErrorType.AUTHENTICATION:
        return 'Please log in to continue.';
      case ErrorType.AUTHORIZATION:
        return 'You don\'t have permission for this action.';
      case ErrorType.NOT_FOUND:
        return 'The item you\'re looking for doesn\'t exist.';
      case ErrorType.SERVER:
        return 'Server is having issues. Please try again in a moment.';
      case ErrorType.VALIDATION:
        return 'Please check your input and try again.';
      default:
        return 'Something went wrong. Please try again.';
    }
  }
}

export const errorHandler = ErrorHandler.getInstance();