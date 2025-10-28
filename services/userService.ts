import { supabase, getPublicProfile } from './supabaseClient';
import { User } from '../types';
import { logger } from '../utils/logger';
import { errorHandler, ErrorType } from '../utils/errorHandler';
import { performanceMonitor } from '../utils/performance';

/**
 * Enhanced user service with comprehensive logging, error handling, and performance monitoring
 */

// Custom error class for service errors
class ServiceError extends Error {
  public type: ErrorType;
  
  constructor(message: string, type: ErrorType = ErrorType.UNKNOWN) {
    super(message);
    this.type = type;
    this.name = 'ServiceError';
  }
}

/**
 * Update user profile information
 */
export const updateUser = async (userId: string, updates: Partial<Pick<User, 'name' | 'avatarUrl'>>): Promise<User | undefined> => {
  logger.userAction('update_profile', userId, {
    action: 'update_user',
    updateFields: Object.keys(updates)
  });

  // Validate input
  if (!userId?.trim()) {
    const error = new ServiceError('User ID is required', ErrorType.VALIDATION);
    throw errorHandler.handleError(error, 'update_user', userId);
  }

  if (!updates || Object.keys(updates).length === 0) {
    const error = new ServiceError('No updates provided', ErrorType.VALIDATION);
    throw errorHandler.handleError(error, 'update_user', userId);
  }

  const timer = performanceMonitor.startTimer('update_user');

  try {
    logger.apiCall('POST', 'users/update', {
      userId,
      updateFields: Object.keys(updates),
      action: 'update_user'
    });

    const { data, error } = await supabase
      .from('users')
      .update({ 
        name: updates.name, 
        avatar_url: updates.avatarUrl 
      })
      .eq('id', userId)
      .select()
      .single();

    const duration = performanceMonitor.endTimer('update_user', {
      userId,
      status: error ? 'error' : 'success',
      updateFields: Object.keys(updates)
    });

    if (error) {
      logger.error('Failed to update user profile', {
        userId,
        error: error.message,
        code: error.code,
        duration,
        updateFields: Object.keys(updates),
        action: 'update_user'
      });

      const appError = errorHandler.handleError(error, 'update_user', userId);
      throw appError;
    }

    logger.info('User profile updated successfully', {
      userId,
      duration,
      updateFields: Object.keys(updates),
      action: 'update_user'
    });

    return data as User;
  } catch (error: any) {
    performanceMonitor.endTimer('update_user', {
      userId,
      status: 'error',
      updateFields: Object.keys(updates)
    });

    if ((error as any).type) {
      // Already handled by errorHandler
      throw error;
    }

    // Handle unexpected errors
    const appError = errorHandler.handleError(error, 'update_user', userId);
    throw appError;
  }
};

/**
 * Get user by ID using public profile
 * Note: createUser is handled by Supabase Auth triggers (see SQL in Supabase dashboard)
 */
export const getUserById = async (id: string): Promise<User | undefined> => {
  logger.info('Fetching user by ID', { userId: id, action: 'get_user_by_id' });

  // Validate input
  if (!id?.trim()) {
    const error = new ServiceError('User ID is required', ErrorType.VALIDATION);
    throw errorHandler.handleError(error, 'get_user_by_id', id);
  }

  const timer = performanceMonitor.startTimer('get_user_by_id');

  try {
    logger.apiCall('GET', 'users/profile', {
      userId: id,
      action: 'get_user_by_id'
    });

    const user = await getPublicProfile(id);

    const duration = performanceMonitor.endTimer('get_user_by_id', {
      userId: id,
      status: user ? 'success' : 'not_found'
    });

    if (user) {
      logger.info('User fetched successfully', {
        userId: id,
        userName: user.name,
        duration,
        action: 'get_user_by_id'
      });
    } else {
      logger.warn('User not found', {
        userId: id,
        duration,
        action: 'get_user_by_id'
      });
    }

    return user || undefined;
  } catch (error: any) {
    performanceMonitor.endTimer('get_user_by_id', {
      userId: id,
      status: 'error'
    });

    logger.error('Failed to fetch user', {
      userId: id,
      error: error.message,
      action: 'get_user_by_id'
    });

    const appError = errorHandler.handleError(error, 'get_user_by_id', id);
    throw appError;
  }
};
