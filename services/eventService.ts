import { supabase } from './supabaseClient';
import { Event, User, EventStatus } from '../types';
import { logger } from '../utils/logger';
import { errorHandler, ErrorType, AppError } from '../utils/errorHandler';
import { performanceMonitor } from '../utils/performance';

/**
 * Enhanced event service with comprehensive logging, error handling, and performance monitoring
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

// Generic RPC handler with enhanced error handling and logging
const callRpc = async <T>(
  functionName: string, 
  params: object, 
  context?: { userId?: string; eventId?: string }
): Promise<T> => {
  const requestId = `rpc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  logger.apiCall('POST', `rpc/${functionName}`, {
    requestId,
    functionName,
    params,
    ...context
  });

  const timer = performanceMonitor.startTimer(`rpc_${functionName}`);

  try {
    const { data, error } = await supabase.rpc(functionName, params);
    
    const duration = performanceMonitor.endTimer(`rpc_${functionName}`, {
      requestId,
      functionName,
      status: error ? 'error' : 'success',
      ...context
    });

    if (error) {
      logger.error(`RPC ${functionName} failed`, {
        requestId,
        functionName,
        error: error.message,
        code: error.code,
        duration,
        ...context
      });

      // Handle specific RPC function not found errors
      if (error.code === '42883' || 
          error.message?.includes('function') || 
          error.message?.includes('does not exist') || 
          error.message?.includes('Could not find the function')) {
        
        logger.warn(`RPC function ${functionName} not found, returning fallback`, {
          requestId,
          functionName,
          ...context
        });

        // Return appropriate fallback based on function type
        return (functionName === 'get_events_for_user' ? [] : null) as T;
      }

      // Transform and throw standardized error
      const appError = errorHandler.handleError(error, `RPC ${functionName}`, context?.userId);
      throw appError;
    }

    logger.info(`RPC ${functionName} completed successfully`, {
      requestId,
      functionName,
      duration,
      dataLength: Array.isArray(data) ? data.length : data ? 1 : 0,
      ...context
    });

    return data as T;
  } catch (error: any) {
    performanceMonitor.endTimer(`rpc_${functionName}`, {
      requestId,
      functionName,
      status: 'error',
      ...context
    });

    if ((error as AppError).type) {
      // Already handled by errorHandler
      throw error;
    }

    // Handle unexpected errors
    const appError = errorHandler.handleError(error, `RPC ${functionName}`, context?.userId);
    throw appError;
  }
};

/**
 * Get events for a specific user
 */
export const getEventsForUser = async (userId: string): Promise<Event[]> => {
  logger.userAction('get_events', userId, { action: 'fetch_user_events' });
  
  try {
    const events = await callRpc<Event[]>('get_events_for_user', { user_id: userId }, { userId });
    
    logger.info('User events fetched successfully', {
      userId,
      eventCount: events.length,
      action: 'get_events_for_user'
    });

    return events;
  } catch (error: any) {
    logger.error('Failed to fetch user events', {
      userId,
      error: error.message,
      action: 'get_events_for_user'
    });
    throw error;
  }
};

/**
 * Get event by ID
 */
export const getEventById = async (id: string, userId?: string): Promise<Event | undefined> => {
  logger.info('Fetching event by ID', { eventId: id, userId, action: 'get_event_by_id' });
  
  try {
    const event = await callRpc<Event>('get_event_by_id', { p_event_id: id }, { userId, eventId: id });
    
    if (event) {
      logger.info('Event fetched successfully', {
        eventId: id,
        userId,
        eventTitle: event.title,
        action: 'get_event_by_id'
      });
    } else {
      logger.warn('Event not found', { eventId: id, userId, action: 'get_event_by_id' });
    }

    // RPC returns null if not found, client expects undefined
    return event || undefined;
  } catch (error: any) {
    logger.error('Failed to fetch event', {
      eventId: id,
      userId,
      error: error.message,
      action: 'get_event_by_id'
    });
    throw error;
  }
};

/**
 * Create a new event
 */
export const createEvent = async (
  eventData: Omit<Event, 'id' | 'organizer' | 'participants' | 'chat' | 'photos' | 'distance' | 'status'>, 
  organizer: User
): Promise<Event> => {
  logger.userAction('create_event', organizer.id, {
    action: 'create_event',
    eventTitle: eventData.title,
    location: eventData.location,
    date: eventData.date
  });

  // Validate required fields
  if (!eventData.title?.trim()) {
    const error = new ServiceError('Event title is required', ErrorType.VALIDATION);
    throw errorHandler.handleError(error, 'create_event', organizer.id);
  }

  if (!eventData.description?.trim()) {
    const error = new ServiceError('Event description is required', ErrorType.VALIDATION);
    throw errorHandler.handleError(error, 'create_event', organizer.id);
  }

  if (!eventData.location || !eventData.location.lat || !eventData.location.lng) {
    const error = new ServiceError('Valid event location is required', ErrorType.VALIDATION);
    throw errorHandler.handleError(error, 'create_event', organizer.id);
  }

  try {
    const event = await callRpc<Event>('create_new_event', {
      p_organizer_id: organizer.id,
      p_title: eventData.title.trim(),
      p_description: eventData.description.trim(),
      p_location: eventData.location,
      p_map_image_url: eventData.mapImageUrl,
      p_radius: eventData.radius || 2,
      p_date: eventData.date,
      p_equipment_names: eventData.equipment?.map(e => e.name) || []
    }, { userId: organizer.id });

    logger.info('Event created successfully', {
      eventId: event.id,
      organizerId: organizer.id,
      eventTitle: event.title,
      action: 'create_event'
    });

    return event;
  } catch (error: any) {
    logger.error('Failed to create event', {
      organizerId: organizer.id,
      eventTitle: eventData.title,
      error: error.message,
      action: 'create_event'
    });
    throw error;
  }
};

/**
 * Update an existing event
 */
export const updateEvent = async (
  eventId: string, 
  updates: Partial<Omit<Event, 'id'>>, 
  userId?: string
): Promise<Event | undefined> => {
  logger.userAction('update_event', userId || 'unknown', {
    action: 'update_event',
    eventId,
    updateFields: Object.keys(updates)
  });

  try {
    // Fetch current event to ensure it exists and get current values
    const eventToUpdate = await getEventById(eventId, userId);
    if (!eventToUpdate) {
      const error = new ServiceError('Event not found for update', ErrorType.NOT_FOUND);
      throw errorHandler.handleError(error, 'update_event', userId);
    }

    const event = await callRpc<Event>('update_event_details', {
      p_event_id: eventId,
      p_title: updates.title || eventToUpdate.title,
      p_description: updates.description || eventToUpdate.description,
      p_location: updates.location || eventToUpdate.location,
      p_map_image_url: updates.mapImageUrl || eventToUpdate.mapImageUrl,
      p_radius: updates.radius || eventToUpdate.radius,
      p_date: updates.date || eventToUpdate.date,
      p_equipment_names: updates.equipment?.map(e => e.name) || eventToUpdate.equipment.map(e => e.name)
    }, { userId, eventId });

    logger.info('Event updated successfully', {
      eventId,
      userId,
      updateFields: Object.keys(updates),
      action: 'update_event'
    });

    return event;
  } catch (error: any) {
    logger.error('Failed to update event', {
      eventId,
      userId,
      updateFields: Object.keys(updates),
      error: error.message,
      action: 'update_event'
    });
    throw error;
  }
};

/**
 * Join an event
 */
export const joinEvent = async (eventId: string, user: User): Promise<Event | undefined> => {
  logger.userAction('join_event', user.id, { action: 'join_event', eventId });

  try {
    const event = await callRpc<Event>('join_event', { 
      p_event_id: eventId, 
      p_user_id: user.id 
    }, { userId: user.id, eventId });

    logger.info('User joined event successfully', {
      eventId,
      userId: user.id,
      userName: user.name,
      action: 'join_event'
    });

    return event;
  } catch (error: any) {
    logger.error('Failed to join event', {
      eventId,
      userId: user.id,
      error: error.message,
      action: 'join_event'
    });
    throw error;
  }
};

/**
 * Leave an event
 */
export const leaveEvent = async (eventId: string, user: User): Promise<Event | undefined> => {
  logger.userAction('leave_event', user.id, { action: 'leave_event', eventId });

  try {
    const event = await callRpc<Event>('leave_event', { 
      p_event_id: eventId, 
      p_user_id: user.id 
    }, { userId: user.id, eventId });

    logger.info('User left event successfully', {
      eventId,
      userId: user.id,
      userName: user.name,
      action: 'leave_event'
    });

    return event;
  } catch (error: any) {
    logger.error('Failed to leave event', {
      eventId,
      userId: user.id,
      error: error.message,
      action: 'leave_event'
    });
    throw error;
  }
};

/**
 * Add photo to event
 */
export const addPhotoToEvent = async (eventId: string, photoUrl: string, userId?: string): Promise<Event | undefined> => {
  logger.userAction('add_photo', userId || 'unknown', { action: 'add_photo', eventId });

  if (!photoUrl?.trim()) {
    const error = new ServiceError('Photo URL is required', ErrorType.VALIDATION);
    throw errorHandler.handleError(error, 'add_photo', userId);
  }

  try {
    const event = await callRpc<Event>('add_photo_to_event', { 
      p_event_id: eventId, 
      p_photo_url: photoUrl.trim() 
    }, { userId, eventId });

    logger.info('Photo added to event successfully', {
      eventId,
      userId,
      photoUrl,
      action: 'add_photo'
    });

    return event;
  } catch (error: any) {
    logger.error('Failed to add photo to event', {
      eventId,
      userId,
      photoUrl,
      error: error.message,
      action: 'add_photo'
    });
    throw error;
  }
};

/**
 * Post message to event chat
 */
export const postMessageToChat = async (eventId: string, user: User, message: string): Promise<Event | undefined> => {
  logger.userAction('post_message', user.id, { action: 'post_message', eventId });

  if (!message?.trim()) {
    const error = new ServiceError('Message content is required', ErrorType.VALIDATION);
    throw errorHandler.handleError(error, 'post_message', user.id);
  }

  try {
    const event = await callRpc<Event>('post_message_to_chat', {
      p_event_id: eventId,
      p_user_id: user.id,
      p_message: message.trim(),
    }, { userId: user.id, eventId });

    logger.info('Message posted to chat successfully', {
      eventId,
      userId: user.id,
      messageLength: message.trim().length,
      action: 'post_message'
    });

    return event;
  } catch (error: any) {
    logger.error('Failed to post message to chat', {
      eventId,
      userId: user.id,
      messageLength: message?.length || 0,
      error: error.message,
      action: 'post_message'
    });
    throw error;
  }
};

/**
 * Add checklist item to event
 */
export const addChecklistItem = async (eventId: string, itemName: string, userId?: string): Promise<Event | undefined> => {
  logger.userAction('add_checklist_item', userId || 'unknown', { action: 'add_checklist_item', eventId });

  if (!itemName?.trim()) {
    const error = new ServiceError('Item name is required', ErrorType.VALIDATION);
    throw errorHandler.handleError(error, 'add_checklist_item', userId);
  }

  try {
    const event = await callRpc<Event>('add_checklist_item', { 
      p_event_id: eventId, 
      p_item_name: itemName.trim() 
    }, { userId, eventId });

    logger.info('Checklist item added successfully', {
      eventId,
      userId,
      itemName: itemName.trim(),
      action: 'add_checklist_item'
    });

    return event;
  } catch (error: any) {
    logger.error('Failed to add checklist item', {
      eventId,
      userId,
      itemName,
      error: error.message,
      action: 'add_checklist_item'
    });
    throw error;
  }
};

/**
 * Update event status
 */
export const updateEventStatus = async (eventId: string, status: EventStatus, userId?: string): Promise<Event | undefined> => {
  logger.userAction('update_event_status', userId || 'unknown', { action: 'update_event_status', eventId, status });

  try {
    const event = await callRpc<Event>('update_event_status', { 
      p_event_id: eventId, 
      p_status: status 
    }, { userId, eventId });

    logger.info('Event status updated successfully', {
      eventId,
      userId,
      newStatus: status,
      action: 'update_event_status'
    });

    return event;
  } catch (error: any) {
    logger.error('Failed to update event status', {
      eventId,
      userId,
      status,
      error: error.message,
      action: 'update_event_status'
    });
    throw error;
  }
};

/**
 * Update checklist item
 */
export const updateChecklistItem = async (eventId: string, itemId: string, userId?: string): Promise<Event | undefined> => {
  logger.userAction('update_checklist_item', userId || 'unknown', { action: 'update_checklist_item', eventId, itemId });

  try {
    const event = await callRpc<Event>('update_checklist_item', { 
      p_event_id: eventId, 
      p_item_id: itemId, 
      p_user_id: userId || null // Pass null to unclaim
    }, { userId, eventId });

    logger.info('Checklist item updated successfully', {
      eventId,
      userId,
      itemId,
      action: 'update_checklist_item'
    });

    return event;
  } catch (error: any) {
    logger.error('Failed to update checklist item', {
      eventId,
      userId,
      itemId,
      error: error.message,
      action: 'update_checklist_item'
    });
    throw error;
  }
};

/**
 * Mark item as provided
 */
export const markItemAsProvided = async (eventId: string, itemId: string, isProvided: boolean, userId?: string): Promise<Event | undefined> => {
  logger.userAction('mark_item_provided', userId || 'unknown', { 
    action: 'mark_item_provided', 
    eventId, 
    itemId, 
    isProvided 
  });

  try {
    const event = await callRpc<Event>('mark_item_as_provided', {
      p_event_id: eventId,
      p_item_id: itemId,
      p_is_provided: isProvided,
    }, { userId, eventId });

    logger.info('Item provision status updated successfully', {
      eventId,
      userId,
      itemId,
      isProvided,
      action: 'mark_item_provided'
    });

    return event;
  } catch (error: any) {
    logger.error('Failed to update item provision status', {
      eventId,
      userId,
      itemId,
      isProvided,
      error: error.message,
      action: 'mark_item_provided'
    });
    throw error;
  }
};
