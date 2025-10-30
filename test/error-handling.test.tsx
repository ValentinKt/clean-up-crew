import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
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



const renderCreateEventForm = () => {
  const onEventCreated = vi.fn();
  const onCancel = vi.fn();
  
  render(<CreateEventForm currentUser={mockUser} onEventCreated={onEventCreated} onCancel={onCancel} />);
  
  return { onEventCreated, onCancel };
};

describe('Error Handling Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Network Errors', () => {
    it('should handle network failure during event creation', async () => {
      const user = userEvent.setup();
      vi.mocked(eventService.createEvent).mockRejectedValue(new Error('Network error'));
      
      const { onEventCreated } = renderCreateEventForm();
      
      // Fill all required fields
      const titleInput = screen.getByLabelText(/event title/i);
      const descriptionInput = screen.getByLabelText(/description/i);
      const dateInput = screen.getByLabelText(/date/i);
      const timeInput = screen.getByLabelText(/time/i);
      
      await user.type(titleInput, 'Test Event');
      await user.type(descriptionInput, 'Test Description');
      await user.type(dateInput, '2024-12-31');
      await user.type(timeInput, '14:00');
      
      // Select location
      const locationButton = screen.getByText('Select Location');
      await user.click(locationButton);
      
      // Submit form
      const submitButton = screen.getByText('Create Event');
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText(/failed to create event/i)).toBeInTheDocument();
      });
      
      expect(onEventCreated).not.toHaveBeenCalled();
    });

    it('should handle timeout during event creation', async () => {
      const user = userEvent.setup();
      vi.mocked(eventService.createEvent).mockRejectedValue(new Error('Request timeout'));
      
      renderCreateEventForm();
      
      // Fill required fields and submit
      const titleInput = screen.getByLabelText(/event title/i);
      await user.type(titleInput, 'Test Event');
      
      const descriptionInput = screen.getByLabelText(/description/i);
      await user.type(descriptionInput, 'Test Description');
      
      const dateInput = screen.getByLabelText(/date/i);
      await user.type(dateInput, '2024-12-31');
      
      const timeInput = screen.getByLabelText(/time/i);
      await user.type(timeInput, '14:00');
      
      const locationButton = screen.getByText('Select Location');
      await user.click(locationButton);
      
      const submitButton = screen.getByText('Create Event');
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText(/request timeout/i)).toBeInTheDocument();
      });
    });
  });

  describe('Server Errors', () => {
    it('should handle 500 server error', async () => {
      const user = userEvent.setup();
      vi.mocked(eventService.createEvent).mockRejectedValue(new Error('Internal server error'));
      
      renderCreateEventForm();
      
      // Fill and submit form
      await user.type(screen.getByLabelText(/event title/i), 'Test Event');
      await user.type(screen.getByLabelText(/description/i), 'Test Description');
      await user.type(screen.getByLabelText(/date/i), '2024-12-31');
      await user.type(screen.getByLabelText(/time/i), '14:00');
      
      await user.click(screen.getByText('Select Location'));
      await user.click(screen.getByText('Create Event'));
      
      await waitFor(() => {
        expect(screen.getByText(/server error/i)).toBeInTheDocument();
      });
    });

    it('should handle authentication error', async () => {
      const user = userEvent.setup();
      vi.mocked(eventService.createEvent).mockRejectedValue(new Error('Unauthorized'));
      
      renderCreateEventForm();
      
      // Fill and submit form
      await user.type(screen.getByLabelText(/event title/i), 'Test Event');
      await user.type(screen.getByLabelText(/description/i), 'Test Description');
      await user.type(screen.getByLabelText(/date/i), '2024-12-31');
      await user.type(screen.getByLabelText(/time/i), '14:00');
      
      await user.click(screen.getByText('Select Location'));
      await user.click(screen.getByText('Create Event'));
      
      await waitFor(() => {
        expect(screen.getByText(/unauthorized/i)).toBeInTheDocument();
      });
    });
  });

  describe('Invalid Data Errors', () => {
    it('should handle duplicate event error', async () => {
      const user = userEvent.setup();
      vi.mocked(eventService.createEvent).mockRejectedValue(new Error('Event already exists'));
      
      renderCreateEventForm();
      
      // Fill and submit form
      await user.type(screen.getByLabelText(/event title/i), 'Duplicate Event');
      await user.type(screen.getByLabelText(/description/i), 'Test Description');
      await user.type(screen.getByLabelText(/date/i), '2024-12-31');
      await user.type(screen.getByLabelText(/time/i), '14:00');
      
      await user.click(screen.getByText('Select Location'));
      await user.click(screen.getByText('Create Event'));
      
      await waitFor(() => {
        expect(screen.getByText(/event already exists/i)).toBeInTheDocument();
      });
    });

    it('should handle invalid location error', async () => {
      const user = userEvent.setup();
      vi.mocked(eventService.createEvent).mockRejectedValue(new Error('Invalid location'));
      
      renderCreateEventForm();
      
      // Fill and submit form
      await user.type(screen.getByLabelText(/event title/i), 'Test Event');
      await user.type(screen.getByLabelText(/description/i), 'Test Description');
      await user.type(screen.getByLabelText(/date/i), '2024-12-31');
      await user.type(screen.getByLabelText(/time/i), '14:00');
      
      await user.click(screen.getByText('Select Location'));
      await user.click(screen.getByText('Create Event'));
      
      await waitFor(() => {
        expect(screen.getByText(/invalid location/i)).toBeInTheDocument();
      });
    });
  });

  describe('Form State Recovery', () => {
    it('should preserve form data after error', async () => {
      const user = userEvent.setup();
      vi.mocked(eventService.createEvent).mockRejectedValue(new Error('Network error'));
      
      renderCreateEventForm();
      
      const titleInput = screen.getByLabelText(/event title/i);
      const descriptionInput = screen.getByLabelText(/description/i);
      
      // Fill form
      await user.type(titleInput, 'Test Event');
      await user.type(descriptionInput, 'Test Description');
      await user.type(screen.getByLabelText(/date/i), '2024-12-31');
      await user.type(screen.getByLabelText(/time/i), '14:00');
      
      await user.click(screen.getByText('Select Location'));
      await user.click(screen.getByText('Create Event'));
      
      // Wait for error
      await waitFor(() => {
        expect(screen.getByText(/failed to create event/i)).toBeInTheDocument();
      });
      
      // Check that form data is preserved
      expect(titleInput).toHaveValue('Test Event');
      expect(descriptionInput).toHaveValue('Test Description');
    });

    it('should allow retry after error', async () => {
      const user = userEvent.setup();
      
      // First attempt fails
      vi.mocked(eventService.createEvent).mockRejectedValueOnce(new Error('Network error'));
      // Second attempt succeeds
      vi.mocked(eventService.createEvent).mockResolvedValueOnce({
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
      
      const { onEventCreated } = renderCreateEventForm();
      
      // Fill and submit form
      await user.type(screen.getByLabelText(/event title/i), 'Test Event');
      await user.type(screen.getByLabelText(/description/i), 'Test Description');
      await user.type(screen.getByLabelText(/date/i), '2024-12-31');
      await user.type(screen.getByLabelText(/time/i), '14:00');
      
      await user.click(screen.getByText('Select Location'));
      await user.click(screen.getByText('Create Event'));
      
      // Wait for error
      await waitFor(() => {
        expect(screen.getByText(/failed to create event/i)).toBeInTheDocument();
      });
      
      // Retry
      await user.click(screen.getByText('Create Event'));
      
      // Should succeed on retry
      await waitFor(() => {
        expect(onEventCreated).toHaveBeenCalledWith({ id: 'event-1' });
      });
    });
  });
});