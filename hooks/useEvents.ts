import { useState, useEffect } from 'react';
import { Event, User } from '../types';
import { getEventsForUser } from '../services/eventService';
import { logger } from '../utils/logger';
import { errorHandler } from '../utils/errorHandler';

interface UseEventsReturn {
  events: Event[];
  isLoading: boolean;
  eventsError: string | null;
  refreshEvents: () => Promise<void>;
  addEvent: (event: Event) => void;
  updateEvent: (updatedEvent: Event) => void;
  updateUserInEvents: (updatedUser: User) => void;
}

export const useEvents = (currentUser: User | null): UseEventsReturn => {
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [eventsError, setEventsError] = useState<string | null>(null);

  const loadEvents = async (userId: string): Promise<void> => {
    try {
      setEventsError(null);
      setIsLoading(true);
      logger.info('Loading events for user', { userId });
      
      const userEvents = await getEventsForUser(userId);
      setEvents(userEvents);
      logger.info('Events loaded successfully', { count: userEvents.length });
    } catch (error) {
      logger.error('Error fetching events', { error, userId });
      errorHandler.handleError(error, 'loadEvents', userId);
      setEvents([]);
      setEventsError('We couldn\'t load events. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const refreshEvents = async (): Promise<void> => {
    if (!currentUser) {
      logger.warn('Cannot refresh events: no current user');
      return;
    }
    await loadEvents(currentUser.id);
  };

  useEffect(() => {
    if (currentUser) {
      loadEvents(currentUser.id);
    } else {
      // Clear events when user logs out
      setEvents([]);
      setEventsError(null);
      setIsLoading(false);
    }
  }, [currentUser]);

  const addEvent = (newEvent: Event): void => {
    logger.info('Adding new event', { eventId: newEvent.id, title: newEvent.title });
    setEvents(prevEvents => 
      [newEvent, ...prevEvents].sort((a, b) => 
        new Date(b.date).getTime() - new Date(a.date).getTime()
      )
    );
  };

  const updateEvent = (updatedEvent: Event): void => {
    logger.info('Updating event', { eventId: updatedEvent.id, title: updatedEvent.title });
    setEvents(prevEvents => 
      prevEvents.map(event => 
        event.id === updatedEvent.id ? updatedEvent : event
      )
    );
  };

  const updateUserInEvents = (updatedUser: User): void => {
    logger.info('Updating user data across events', { userId: updatedUser.id, name: updatedUser.name });
    
    setEvents(prevEvents => 
      prevEvents.map(event => {
        const newParticipants = event.participants.map(p => 
          p.id === updatedUser.id ? updatedUser : p
        );
        const newOrganizer = event.organizer.id === updatedUser.id ? updatedUser : event.organizer;
        const newChat = event.chat.map(c => ({
          ...c, 
          user: c.user.id === updatedUser.id ? updatedUser : c.user
        }));
        
        return {
          ...event, 
          participants: newParticipants, 
          organizer: newOrganizer, 
          chat: newChat
        };
      })
    );
  };

  return {
    events,
    isLoading,
    eventsError,
    refreshEvents,
    addEvent,
    updateEvent,
    updateUserInEvents
  };
};