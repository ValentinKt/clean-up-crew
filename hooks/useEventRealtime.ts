import { useEffect, useRef } from 'react';
import { RealtimeChannel } from '@supabase/supabase-js';
import { Event, User } from '../types';
import { getEventById } from '../services/eventService';
import { supabase } from '../services/supabaseClient';
import { useNotifications } from './useNotifications';
import { logger } from '../utils/logger';
import { errorHandler, ErrorType } from '../utils/errorHandler';

interface UseEventRealtimeProps {
  event: Event;
  currentUser: User;
  onEventUpdate: (event: Event) => void;
}

export const useEventRealtime = ({ event, currentUser, onEventUpdate }: UseEventRealtimeProps) => {
  const { addNotification } = useNotifications();
  const channelRef = useRef<RealtimeChannel | null>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Custom hook to track previous value
  const usePrevious = <T>(value: T): T | undefined => {
    const ref = useRef<T>();
    useEffect(() => {
      ref.current = value;
    });
    return ref.current;
  };

  const prevEvent = usePrevious(event);

  // Set up realtime subscription
  useEffect(() => {
    logger.info('Setting up realtime subscription for event', { eventId: event.id });

    const channel = supabase
      .channel(`event-${event.id}`)
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'events', filter: `id=eq.${event.id}` },
        async (payload) => {
          logger.info('Received realtime event update', { payload });
          try {
            const updatedEvent = await getEventById(event.id);
            if (updatedEvent) {
              onEventUpdate(updatedEvent);
            }
          } catch (error) {
            errorHandler.handleError(error, 'Failed to fetch updated event');
          }
        }
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      logger.info('Cleaning up realtime subscription', { eventId: event.id });
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [event.id, onEventUpdate]);

  // Handle event change notifications
  useEffect(() => {
    if (!prevEvent) return;

    // Status Change Notification
    if (prevEvent.status !== event.status) {
      addNotification('info', 'Status Updated', `The event "${event.title}" is now ${event.status}.`);
    }

    // Participant Joins Notification
    if (prevEvent.participants.length < event.participants.length) {
      const newParticipant = event.participants.find(p => !prevEvent.participants.some(prevP => prevP.id === p.id));
      if (newParticipant && newParticipant.id !== currentUser.id) {
        addNotification('info', 'New Participant!', `${newParticipant.name} has joined the event.`);
      }
    }

    // Participant Leaves Notification
    if (prevEvent.participants.length > event.participants.length) {
      const leftParticipant = prevEvent.participants.find(p => !event.participants.some(currP => currP.id === p.id));
      if (leftParticipant && leftParticipant.id !== currentUser.id) {
        addNotification('warning', 'Participant Left', `${leftParticipant.name} has left the event.`);
      }
    }

    // New Chat Message Notification
    if (prevEvent.chat.length < event.chat.length) {
      const newMessage = event.chat[event.chat.length - 1];
      if (newMessage && newMessage.user.id !== currentUser.id) {
        const messagePreview = newMessage.message.substring(0, 50) + (newMessage.message.length > 50 ? '...' : '');
        addNotification('info', `New Message from ${newMessage.user.name}`, messagePreview);
      }
    }
  }, [event, prevEvent, currentUser.id, addNotification]);

  // Auto-scroll chat to bottom
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [event.chat]);

  return {
    chatContainerRef
  };
};