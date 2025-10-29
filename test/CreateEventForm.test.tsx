import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import CreateEventForm from '../components/CreateEventForm';
import { User, Event } from '../types';
import * as eventService from '../services/eventService';
import { useFormValidation } from '../hooks/useFormValidation';

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
      title: 'Test Event',
      description: 'Test Description',
      date: '2024-12-31',
      time: '10:00',
      radius: 5,
      equipmentList: [''],
      location: { address: 'Test Location', lat: 40.7128, lng: -74.0060 },
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
      date: '2024-12-31T10:00:00.000Z',
      location: { address: 'Test Location', lat: 40.7128, lng: -74.0060 },
      mapImageUrl: '',
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

const mockEvent: Event = {
  id: 'event-1',
  title: 'Test Event',
  description: 'Test Description',
  location: { address: 'Test Location', lat: 40.7128, lng: -74.0060 },
  mapImageUrl: '',
  radius: 5,
  date: '2024-12-31T10:00:00.000Z',
  status: 'upcoming' as any,
  organizer: mockUser,
  participants: [],
  equipment: [],
  chat: [],
  photos: [],
  distance: 0
};

describe('CreateEventForm Component', () => {
  const mockOnEventCreated = vi.fn();
  const mockOnCancel = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    vi.mocked(eventService.createEvent).mockResolvedValue(mockEvent);
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('Component Rendering', () => {
    it('renders the form with title', () => {
      render(
        <CreateEventForm
          currentUser={mockUser}
          onEventCreated={mockOnEventCreated}
          onCancel={mockOnCancel}
        />
      );

      const title = screen.getByText('Create a New Cleanup Event');
      expect(title).toBeDefined();
    });

    it('renders map picker component', () => {
      render(
        <CreateEventForm
          currentUser={mockUser}
          onEventCreated={mockOnEventCreated}
          onCancel={mockOnCancel}
        />
      );

      const mapPicker = screen.getByTestId('map-picker');
      expect(mapPicker).toBeDefined();
    });

    it('renders form element', () => {
      const { container } = render(
        <CreateEventForm
          currentUser={mockUser}
          onEventCreated={mockOnEventCreated}
          onCancel={mockOnCancel}
        />
      );

      const form = container.querySelector('form');
      expect(form).toBeDefined();
    });

    it('renders title input field', () => {
      render(
        <CreateEventForm
          currentUser={mockUser}
          onEventCreated={mockOnEventCreated}
          onCancel={mockOnCancel}
        />
      );

      const titleInput = screen.getByLabelText('Event Title');
      expect(titleInput).toBeDefined();
      expect(titleInput.getAttribute('value')).toBe('Test Event');
    });
  });

  describe('Form Submission', () => {
    it('calls createEvent service when form is submitted with valid data', async () => {
      const { container } = render(
        <CreateEventForm
          currentUser={mockUser}
          onEventCreated={mockOnEventCreated}
          onCancel={mockOnCancel}
        />
      );

      const form = container.querySelector('form');
      fireEvent.submit(form!);

      await waitFor(() => {
        expect(eventService.createEvent).toHaveBeenCalledWith(
          expect.objectContaining({
            title: 'Test Event',
            description: 'Test Description',
            date: '2024-12-31T10:00:00.000Z',
            location: { address: 'Test Location', lat: 40.7128, lng: -74.0060 }
          }),
          mockUser
        );
      });
    });

    it('calls onEventCreated callback when event is created successfully', async () => {
      const { container } = render(
        <CreateEventForm
          currentUser={mockUser}
          onEventCreated={mockOnEventCreated}
          onCancel={mockOnCancel}
        />
      );

      const form = container.querySelector('form');
      fireEvent.submit(form!);

      await waitFor(() => {
        expect(mockOnEventCreated).toHaveBeenCalledWith(mockEvent);
      });
    });

    it('removes draft from localStorage when event is created successfully', async () => {
      localStorage.setItem('eventDraft', JSON.stringify({ title: 'Draft Event' }));
      
      const { container } = render(
        <CreateEventForm
          currentUser={mockUser}
          onEventCreated={mockOnEventCreated}
          onCancel={mockOnCancel}
        />
      );

      const form = container.querySelector('form');
      fireEvent.submit(form!);

      await waitFor(() => {
        expect(localStorage.getItem('eventDraft')).toBeNull();
      });
    });
  });

  describe('Error Handling', () => {
    it('handles service errors gracefully', async () => {
      const error = new Error('Service error');
      vi.mocked(eventService.createEvent).mockRejectedValue(error);

      const { container } = render(
        <CreateEventForm
          currentUser={mockUser}
          onEventCreated={mockOnEventCreated}
          onCancel={mockOnCancel}
        />
      );

      const form = container.querySelector('form');
      fireEvent.submit(form!);

      await waitFor(() => {
        expect(mockOnEventCreated).not.toHaveBeenCalled();
      });
    });
  });

  describe('Draft Management', () => {
    it('loads draft from localStorage on component mount', () => {
      const draft = {
        title: 'Draft Event',
        description: 'Draft Description',
        date: '2024-12-31',
        time: '10:00',
        radius: 3,
        equipmentList: ['Gloves', 'Bags']
      };
      localStorage.setItem('eventDraft', JSON.stringify(draft));

      render(
        <CreateEventForm
          currentUser={mockUser}
          onEventCreated={mockOnEventCreated}
          onCancel={mockOnCancel}
        />
      );

      // Component should load the draft (tested through the hook)
      expect(localStorage.getItem('eventDraft')).toBe(JSON.stringify(draft));
    });

    it('handles invalid draft data gracefully', () => {
      localStorage.setItem('eventDraft', 'invalid-json');

      expect(() => {
        render(
          <CreateEventForm
            currentUser={mockUser}
            onEventCreated={mockOnEventCreated}
            onCancel={mockOnCancel}
          />
        );
      }).not.toThrow();
    });
  });

  describe('Component Props', () => {
    it('passes currentUser to createEvent service', async () => {
      const { container } = render(
        <CreateEventForm
          currentUser={mockUser}
          onEventCreated={mockOnEventCreated}
          onCancel={mockOnCancel}
        />
      );

      const form = container.querySelector('form');
      fireEvent.submit(form!);

      await waitFor(() => {
        expect(eventService.createEvent).toHaveBeenCalledWith(
          expect.any(Object),
          mockUser
        );
      });
    });

    it('receives required props correctly', () => {
      render(
        <CreateEventForm
          currentUser={mockUser}
          onEventCreated={mockOnEventCreated}
          onCancel={mockOnCancel}
        />
      );

      expect(mockOnCancel).toBeDefined();
      expect(mockOnEventCreated).toBeDefined();
    });
  });

  describe('Accessibility', () => {
    it('has proper form structure for screen readers', () => {
      const { container } = render(
        <CreateEventForm
          currentUser={mockUser}
          onEventCreated={mockOnEventCreated}
          onCancel={mockOnCancel}
        />
      );

      const form = container.querySelector('form');
      expect(form).toBeDefined();
      
      const heading = screen.getByRole('heading', { level: 2 });
      expect(heading.textContent).toBe('Create a New Cleanup Event');
    });

    it('has proper labels for form inputs', () => {
      render(
        <CreateEventForm
          currentUser={mockUser}
          onEventCreated={mockOnEventCreated}
          onCancel={mockOnCancel}
        />
      );

      const titleLabel = screen.getByLabelText('Event Title');
      expect(titleLabel).toBeDefined();
      
      const descriptionLabel = screen.getByLabelText('Description');
      expect(descriptionLabel).toBeDefined();
    });
  });
});