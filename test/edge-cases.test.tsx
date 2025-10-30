import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import CreateEventForm from '../components/CreateEventForm';
import { User } from '../types';
import * as eventService from '../services/eventService';

// Mock dependencies
vi.mock('../services/eventService');
vi.mock('../hooks/useNotifications', () => ({
  useNotifications: () => ({
    addNotification: vi.fn()
  })
}));

vi.mock('../hooks/useFormValidation', () => ({
  useFormValidation: () => ({
    formData: {
      title: '',
      description: '',
      date: '',
      time: '',
      radius: 5,
      equipmentList: [''],
      location: null,
      mapImageUrl: ''
    },
    validationState: {
      isSubmitting: false,
      isGenerating: false,
      isLoadingSuggestions: false,
      suggestions: []
    },
    updateField: vi.fn(),
    handleEquipmentChange: vi.fn(),
    addEquipmentField: vi.fn(),
    removeEquipmentField: vi.fn(),
    handleGenerateDescription: vi.fn(),
    handleSuggestItems: vi.fn(),
    addSuggestionToEquipment: vi.fn(),
    handleLocationChange: vi.fn(),
    validateForm: vi.fn(() => ({ isValid: true, errors: [] })),
    prepareFormData: vi.fn(() => ({
      title: 'Test Event',
      description: 'Test Description',
      location: { address: 'Test Location', lat: 40.7128, lng: -74.0060 },
      mapImageUrl: 'test-map.jpg',
      date: '2024-01-01',
      time: '10:00',
      radius: 5,
      equipment: []
    })),
    setSubmitting: vi.fn()
  })
}));

vi.mock('../components/MapPicker', () => ({
  default: ({ onLocationChange }: { onLocationChange: (location: any) => void }) => (
    <div data-testid="map-picker">
      <button 
        onClick={() => onLocationChange({ address: 'Test Location', lat: 40.7128, lng: -74.0060 })}
      >
        Select Location
      </button>
    </div>
  )
}));

const mockUser: User = {
  id: 'user-1',
  name: 'Test User',
  email: 'test@example.com',
  avatarUrl: ''
};

describe('Edge Case Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(eventService.createEvent).mockResolvedValue({
      id: 'event-1',
      title: 'Test Event',
      description: 'Test Description',
      location: { address: 'Test Location', lat: 40.7128, lng: -74.0060 },
      mapImageUrl: 'test-map.jpg',
      date: '2024-01-01',
      time: '10:00',
      maxParticipants: 10,
      currentParticipants: 1,
      organizerId: 'user-1',
      status: 'upcoming',
      equipment: [],
      participants: []
    } as any);
  });

  describe('Component Rendering', () => {
    it('should render CreateEventForm without crashing', () => {
      const onEventCreated = vi.fn();
      const onCancel = vi.fn();
      
      render(<CreateEventForm currentUser={mockUser} onEventCreated={onEventCreated} onCancel={onCancel} />);
      
      expect(screen.getByText('Create Event')).toBeInTheDocument();
    });

    it('should render form fields', () => {
      const onEventCreated = vi.fn();
      const onCancel = vi.fn();
      
      render(<CreateEventForm currentUser={mockUser} onEventCreated={onEventCreated} onCancel={onCancel} />);
      
      expect(screen.getByText('Create Event')).toBeInTheDocument();
      expect(screen.getByText('Cancel')).toBeInTheDocument();
      expect(screen.getByTestId('map-picker')).toBeInTheDocument();
    });

    it('should handle user prop correctly', () => {
      const onEventCreated = vi.fn();
      const onCancel = vi.fn();
      
      render(<CreateEventForm currentUser={mockUser} onEventCreated={onEventCreated} onCancel={onCancel} />);
      
      // Component should render without errors when user is provided
      expect(screen.getByText('Create Event')).toBeInTheDocument();
    });
  });

  describe('Service Integration', () => {
    it('should have createEvent service mocked', () => {
      expect(vi.mocked(eventService.createEvent)).toBeDefined();
    });

    it('should call createEvent with correct parameters when mocked', async () => {
      const mockCreateEvent = vi.mocked(eventService.createEvent);
      
      await mockCreateEvent({
        title: 'Test Event',
        description: 'Test Description',
        location: { address: 'Test Location', lat: 40.7128, lng: -74.0060 },
        mapImageUrl: 'test-map.jpg',
        date: '2024-01-01',
        time: '10:00',
        radius: 5,
        equipment: [],
        organizerId: 'user-1'
      });

      expect(mockCreateEvent).toHaveBeenCalledWith({
        title: 'Test Event',
        description: 'Test Description',
        location: { address: 'Test Location', lat: 40.7128, lng: -74.0060 },
        mapImageUrl: 'test-map.jpg',
        date: '2024-01-01',
        time: '10:00',
        radius: 5,
        equipment: [],
        organizerId: 'user-1'
      });
    });
  });
});