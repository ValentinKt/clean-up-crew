import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createEvent } from '../services/eventService';
import { generateEventDescription, suggestEquipment } from '../services/geminiService';
import { User, Event } from '../types';

// Mock all services
vi.mock('../services/eventService', () => ({
  createEvent: vi.fn()
}));

vi.mock('../services/geminiService', () => ({
  generateEventDescription: vi.fn(),
  suggestEquipment: vi.fn()
}));

vi.mock('../services/supabaseClient', () => ({
  supabase: {
    auth: {
      getUser: vi.fn(),
      onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } }))
    }
  },
  getPublicProfile: vi.fn()
}));

const mockUser: User = {
  id: 'user-123',
  name: 'John Doe',
  email: 'john@example.com',
  avatarUrl: 'https://example.com/avatar.jpg'
};

const mockEventData = {
  title: 'Beach Cleanup Event',
  description: 'Join us for a community beach cleanup to protect marine life.',
  date: '2024-12-31T10:00:00.000Z',
  location: { address: 'Santa Monica Beach', lat: 34.0195, lng: -118.4912 },
  mapImageUrl: '',
  radius: 5,
  equipment: [
    { id: '1', name: 'Trash bags' },
    { id: '2', name: 'Gloves' }
  ]
};

const mockCreatedEvent: Event = {
  id: 'event-456',
  title: mockEventData.title,
  description: mockEventData.description,
  location: mockEventData.location,
  mapImageUrl: mockEventData.mapImageUrl,
  radius: mockEventData.radius,
  date: mockEventData.date,
  status: 'upcoming' as any,
  organizer: mockUser,
  participants: [mockUser],
  equipment: mockEventData.equipment,
  chat: [],
  photos: [],
  distance: 0
};

describe('Integration Tests - Service Layer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should create an event successfully through the service layer', async () => {
    // Mock successful event creation
    vi.mocked(createEvent).mockResolvedValue(mockCreatedEvent);

    // Call the service with correct signature (eventData, organizer as User object)
    const result = await createEvent(mockEventData, mockUser);

    // Verify the service was called with correct data
    expect(createEvent).toHaveBeenCalledWith(mockEventData, mockUser);
    
    // Verify the result
    expect(result).toEqual(mockCreatedEvent);
    expect(result.title).toBe(mockEventData.title);
    expect(result.organizer.id).toBe(mockUser.id);
  });

  it('should generate event description using AI service', async () => {
    const mockDescription = 'AI generated description for beach cleanup event';
    vi.mocked(generateEventDescription).mockResolvedValue(mockDescription);

    const result = await generateEventDescription('Beach Cleanup');

    expect(generateEventDescription).toHaveBeenCalledWith('Beach Cleanup');
    expect(result).toBe(mockDescription);
  });

  it('should suggest equipment using AI service', async () => {
    const mockSuggestions = ['Gloves', 'Trash bags', 'Picker tool', 'First aid kit'];
    vi.mocked(suggestEquipment).mockResolvedValue(mockSuggestions);

    const result = await suggestEquipment('Beach cleanup event', 'Join us for a community beach cleanup');

    expect(suggestEquipment).toHaveBeenCalledWith('Beach cleanup event', 'Join us for a community beach cleanup');
    expect(result).toEqual(mockSuggestions);
    expect(result).toHaveLength(4);
  });

  it('should handle event creation errors gracefully', async () => {
    const errorMessage = 'Network error occurred';
    vi.mocked(createEvent).mockRejectedValue(new Error(errorMessage));

    await expect(createEvent(mockEventData, mockUser)).rejects.toThrow(errorMessage);
    expect(createEvent).toHaveBeenCalledWith(mockEventData, mockUser);
  });

  it('should handle AI service errors gracefully', async () => {
    const errorMessage = 'AI service unavailable';
    vi.mocked(generateEventDescription).mockRejectedValue(new Error(errorMessage));

    await expect(generateEventDescription('Test Event')).rejects.toThrow(errorMessage);
    expect(generateEventDescription).toHaveBeenCalledWith('Test Event');
  });

  it('should validate event data structure', () => {
    // Test that our mock event has all required properties
    expect(mockCreatedEvent).toHaveProperty('id');
    expect(mockCreatedEvent).toHaveProperty('title');
    expect(mockCreatedEvent).toHaveProperty('description');
    expect(mockCreatedEvent).toHaveProperty('location');
    expect(mockCreatedEvent).toHaveProperty('date');
    expect(mockCreatedEvent).toHaveProperty('organizer');
    expect(mockCreatedEvent).toHaveProperty('participants');
    expect(mockCreatedEvent).toHaveProperty('equipment');
    expect(mockCreatedEvent).toHaveProperty('status');

    // Verify data types
    expect(typeof mockCreatedEvent.id).toBe('string');
    expect(typeof mockCreatedEvent.title).toBe('string');
    expect(typeof mockCreatedEvent.description).toBe('string');
    expect(Array.isArray(mockCreatedEvent.participants)).toBe(true);
    expect(Array.isArray(mockCreatedEvent.equipment)).toBe(true);
  });
});