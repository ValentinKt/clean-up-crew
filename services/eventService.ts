import { supabase } from './supabaseClient';
import { Event, User, EventStatus } from '../types';

// Generic RPC handler to reduce boilerplate
const callRpc = async <T>(functionName: string, params: object): Promise<T> => {
    const { data, error } = await supabase.rpc(functionName, params);
    if (error) {
        console.error(`Error calling RPC ${functionName}:`, error);
        // If RPC function doesn't exist, return appropriate fallback
        if (error.code === '42883' || error.message?.includes('function') || error.message?.includes('does not exist')) {
            console.warn(`RPC function ${functionName} not found, returning fallback data`);
            return (functionName === 'get_events_for_user' ? [] : null) as T;
        }
        throw error;
    }
    return data as T;
};

export const getEventsForUser = async (userId: string): Promise<Event[]> => {
    try {
        return await callRpc<Event[]>('get_events_for_user', { p_user_id: userId });
    } catch (error) {
        console.warn('RPC function not available, returning empty events array');
        return [];
    }
};

export const getEventById = async (id: string): Promise<Event | undefined> => {
    const event = await callRpc<Event>('get_event_by_id', { p_event_id: id });
    // RPC returns null if not found, client expects undefined
    return event || undefined;
};

export const createEvent = async (eventData: Omit<Event, 'id' | 'organizer' | 'participants' | 'chat' | 'photos' | 'distance' | 'status'>, organizer: User): Promise<Event> => {
    return callRpc<Event>('create_new_event', {
        p_organizer_id: organizer.id,
        p_title: eventData.title,
        p_description: eventData.description,
        p_location: eventData.location,
        p_map_image_url: eventData.mapImageUrl,
        p_radius: eventData.radius,
        p_date: eventData.date,
        p_equipment_names: eventData.equipment.map(e => e.name)
    });
};

export const updateEvent = async (eventId: string, updates: Partial<Omit<Event, 'id'>>): Promise<Event | undefined> => {
    // Ensure all required parameters are provided, even if they haven't changed.
    const eventToUpdate = await getEventById(eventId);
    if (!eventToUpdate) throw new Error("Event not found for update.");

    return callRpc<Event>('update_event_details', {
        p_event_id: eventId,
        p_title: updates.title || eventToUpdate.title,
        p_description: updates.description || eventToUpdate.description,
        p_location: updates.location || eventToUpdate.location,
        p_map_image_url: updates.mapImageUrl || eventToUpdate.mapImageUrl,
        p_radius: updates.radius || eventToUpdate.radius,
        p_date: updates.date || eventToUpdate.date,
        p_equipment_names: updates.equipment?.map(e => e.name) || eventToUpdate.equipment.map(e => e.name)
    });
};

export const joinEvent = async (eventId: string, user: User): Promise<Event | undefined> => {
    return callRpc<Event>('join_event', { p_event_id: eventId, p_user_id: user.id });
};

export const leaveEvent = async (eventId: string, user: User): Promise<Event | undefined> => {
    return callRpc<Event>('leave_event', { p_event_id: eventId, p_user_id: user.id });
};

export const addPhotoToEvent = async (eventId: string, photoUrl: string): Promise<Event | undefined> => {
    return callRpc<Event>('add_photo_to_event', { p_event_id: eventId, p_photo_url: photoUrl });
};

export const postMessageToChat = async (eventId: string, user: User, message: string): Promise<Event | undefined> => {
    return callRpc<Event>('post_message_to_chat', {
        p_event_id: eventId,
        p_user_id: user.id,
        p_message: message,
    });
};

export const addChecklistItem = async (eventId: string, itemName: string): Promise<Event | undefined> => {
    return callRpc<Event>('add_checklist_item', { p_event_id: eventId, p_item_name: itemName });
};

export const updateEventStatus = async (eventId: string, status: EventStatus): Promise<Event | undefined> => {
    return callRpc<Event>('update_event_status', { p_event_id: eventId, p_status: status });
};

export const updateChecklistItem = async (eventId: string, itemId: string, userId?: string): Promise<Event | undefined> => {
    return callRpc<Event>('update_checklist_item', { 
        p_event_id: eventId, 
        p_item_id: itemId, 
        p_user_id: userId || null // Pass null to unclaim
    });
};

export const markItemAsProvided = async (eventId: string, itemId: string, isProvided: boolean): Promise<Event | undefined> => {
    return callRpc<Event>('mark_item_as_provided', {
        p_event_id: eventId,
        p_item_id: itemId,
        p_is_provided: isProvided,
    });
};
