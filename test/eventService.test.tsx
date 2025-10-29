import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as eventService from '../services/eventService';
import { supabase } from '../services/supabaseClient';
import { Event, EventStatus, User, Location } from '../types';

// Mock Supabase client
vi.mock('../services/supabaseClient', () => ({
  supabase: {
    rpc: vi.fn(),
  },
}));

// Mock logger and performance monitor
vi.mock('../utils/logger', () => ({
  logger: {
    apiCall: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    userAction: vi.fn(),
    warn: vi.fn(),
  },
}));

vi.mock('../utils/performance', () => ({
  performanceMonitor: {
    startTimer: vi.fn(() => 'timer-id'),
    endTimer: vi.fn(() => 100),
  },
}));

describe('EventService', () => {
  const mockUser: User = {
    id: 'user-1',
    name: 'Test User',
    email: 'test@example.com',
    avatarUrl: 'https://example.com/avatar.jpg',
  };

  const mockLocation: Location = {
    address: '123 Test St',
    lat: 40.7128,
    lng: -74.0060,
  };

  const mockEvent: Event = {
    id: 'event-1',
    title: 'Test Event',
    description: 'Test Description',
    location: mockLocation,
    mapImageUrl: 'https://example.com/map.jpg',
    radius: 5,
    date: '2024-01-15T10:00:00Z',
    status: EventStatus.Upcoming,
    organizer: mockUser,
    participants: [mockUser],
    equipment: [],
    chat: [],
    photos: [],
    distance: 2.5,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('getEventsForUser', () => {
    it('successfully retrieves events for a user', async () => {
       const mockResponse = {
         data: [mockEvent],
         error: null,
         count: null,
         status: 200,
         statusText: 'OK',
       };
       vi.mocked(supabase.rpc).mockResolvedValue(mockResponse);

       const result = await eventService.getEventsForUser('user-1');

       expect(supabase.rpc).toHaveBeenCalledWith('get_events_for_user', { user_id: 'user-1' });
       expect(result).toEqual([mockEvent]);
     });

    it('handles errors gracefully', async () => {
       vi.mocked(supabase.rpc).mockRejectedValue(new Error('Database error'));

       await expect(eventService.getEventsForUser('user-1')).rejects.toThrow();
     });
  });

  describe('getEventById', () => {
    it('successfully retrieves an event by ID', async () => {
      const mockResponse = {
        data: mockEvent,
        error: null,
        count: null,
        status: 200,
        statusText: 'OK',
      };
      vi.mocked(supabase.rpc).mockResolvedValue(mockResponse);

      const result = await eventService.getEventById('event-1');

      expect(supabase.rpc).toHaveBeenCalledWith('get_event_by_id', { p_event_id: 'event-1' });
      expect(result).toEqual(mockEvent);
    });

    it('returns undefined when event not found', async () => {
      const mockResponse = {
        data: null,
        error: null,
        count: null,
        status: 200,
        statusText: 'OK',
      };
      vi.mocked(supabase.rpc).mockResolvedValue(mockResponse);

      const result = await eventService.getEventById('nonexistent');

      expect(result).toBeUndefined();
    });
  });

  describe('createEvent', () => {
    it('successfully creates a new event', async () => {
      const newEventData = {
        title: 'New Event',
        description: 'New Description',
        location: mockLocation,
        mapImageUrl: 'https://example.com/map.jpg',
        radius: 5,
        date: '2024-01-15T10:00:00Z',
        equipment: [],
      };

      const createdEvent = {
        ...newEventData,
        id: 'new-event-id',
        status: EventStatus.Upcoming,
        organizer: mockUser,
        participants: [mockUser],
        chat: [],
        photos: [],
        distance: 0,
      };

      const mockResponse = {
        data: createdEvent,
        error: null,
        count: null,
        status: 200,
        statusText: 'OK',
      };
      vi.mocked(supabase.rpc).mockResolvedValue(mockResponse);

      const result = await eventService.createEvent(newEventData, mockUser);

      expect(supabase.rpc).toHaveBeenCalledWith('create_new_event', {
        p_organizer_id: mockUser.id,
        p_title: newEventData.title,
        p_description: newEventData.description,
        p_location: newEventData.location,
        p_map_image_url: newEventData.mapImageUrl,
        p_radius: newEventData.radius,
        p_date: newEventData.date,
        p_equipment_names: [],
      });
      expect(result).toEqual(createdEvent);
    });

    it('handles creation errors', async () => {
      const newEventData = {
        title: 'New Event',
        description: 'New Description',
        location: mockLocation,
        mapImageUrl: 'https://example.com/map.jpg',
        radius: 5,
        date: '2024-01-15T10:00:00Z',
        equipment: [],
      };

      vi.mocked(supabase.rpc).mockRejectedValue(new Error('Creation failed'));

      await expect(eventService.createEvent(newEventData, mockUser)).rejects.toThrow();
    });
  });

  describe('joinEvent', () => {
    it('successfully joins an event', async () => {
      const updatedEvent = {
        ...mockEvent,
        participants: [mockEvent.organizer, mockUser],
      };

      const mockResponse = {
        data: updatedEvent,
        error: null,
        count: null,
        status: 200,
        statusText: 'OK',
      };
      vi.mocked(supabase.rpc).mockResolvedValue(mockResponse);

      const result = await eventService.joinEvent('event-1', mockUser);

      expect(supabase.rpc).toHaveBeenCalledWith('join_event', {
        p_event_id: 'event-1',
        p_user_id: mockUser.id,
      });
      expect(result).toEqual(updatedEvent);
    });
  });

  describe('leaveEvent', () => {
    it('successfully leaves an event', async () => {
      const updatedEvent = {
        ...mockEvent,
        participants: [],
      };

      const mockResponse = {
        data: updatedEvent,
        error: null,
        count: null,
        status: 200,
        statusText: 'OK',
      };
      vi.mocked(supabase.rpc).mockResolvedValue(mockResponse);

      const result = await eventService.leaveEvent('event-1', mockUser);

      expect(supabase.rpc).toHaveBeenCalledWith('leave_event', {
        p_event_id: 'event-1',
        p_user_id: mockUser.id,
      });
      expect(result).toEqual(updatedEvent);
    });
  });

  describe('updateEventStatus', () => {
    it('successfully updates event status', async () => {
       const mockResponse = { 
         data: { success: true }, 
         error: null,
         count: null,
         status: 200,
         statusText: 'OK'
       };
       vi.mocked(supabase.rpc).mockResolvedValue(mockResponse);

       const result = await eventService.updateEventStatus('event-1', EventStatus.InProgress, 'user-1');

       expect(supabase.rpc).toHaveBeenCalledWith('update_event_status', {
         p_event_id: 'event-1',
         p_status: EventStatus.InProgress,
       });
       expect(result).toEqual({ success: true });
     });

    it('handles status update errors', async () => {
      vi.mocked(supabase.rpc).mockRejectedValue(new Error('Update failed'));

      await expect(eventService.updateEventStatus('event-1', EventStatus.InProgress, 'user-1')).rejects.toThrow();
    });
  });
});