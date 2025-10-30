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

  describe('Boundary Values', () => {
    it('should handle minimum valid date (tomorrow)', async () => {
      const user = userEvent.setup();
      const { onEventCreated } = renderCreateEventForm();
      
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowStr = tomorrow.toISOString().split('T')[0];
      
      // Fill form with tomorrow's date
      await user.type(screen.getByLabelText(/event title/i), 'Tomorrow Event');
      await user.type(screen.getByLabelText(/description/i), 'Event happening tomorrow');
      await user.type(screen.getByLabelText(/date/i), tomorrowStr);
      await user.type(screen.getByLabelText(/time/i), '09:00');
      
      await user.click(screen.getByText('Select Location'));
      await user.click(screen.getByText('Create Event'));
      
      await waitFor(() => {
        expect(onEventCreated).toHaveBeenCalledWith({ id: 'event-1' });
      });
    });

    it('should handle maximum title length', async () => {
      const user = userEvent.setup();
      const { onEventCreated } = renderCreateEventForm();
      
      const maxTitle = 'A'.repeat(100); // Assuming 100 is the max length
      
      await user.type(screen.getByLabelText(/event title/i), maxTitle);
      await user.type(screen.getByLabelText(/description/i), 'Test Description');
      await user.type(screen.getByLabelText(/date/i), '2024-12-31');
      await user.type(screen.getByLabelText(/time/i), '14:00');
      
      await user.click(screen.getByText('Select Location'));
      await user.click(screen.getByText('Create Event'));
      
      await waitFor(() => {
        expect(onEventCreated).toHaveBeenCalledWith({ id: 'event-1' });
      });
    });

    it('should handle maximum description length', async () => {
      const user = userEvent.setup();
      const { onEventCreated } = renderCreateEventForm();
      
      const maxDescription = 'A'.repeat(1000); // Assuming 1000 is the max length
      
      await user.type(screen.getByLabelText(/event title/i), 'Test Event');
      await user.type(screen.getByLabelText(/description/i), maxDescription);
      await user.type(screen.getByLabelText(/date/i), '2024-12-31');
      await user.type(screen.getByLabelText(/time/i), '14:00');
      
      await user.click(screen.getByText('Select Location'));
      await user.click(screen.getByText('Create Event'));
      
      await waitFor(() => {
        expect(onEventCreated).toHaveBeenCalledWith({ id: 'event-1' });
      });
    });

    it('should handle minimum radius value', async () => {
      const user = userEvent.setup();
      const { onEventCreated } = renderCreateEventForm();
      
      await user.type(screen.getByLabelText(/event title/i), 'Small Radius Event');
      await user.type(screen.getByLabelText(/description/i), 'Event with minimum radius');
      await user.type(screen.getByLabelText(/date/i), '2024-12-31');
      await user.type(screen.getByLabelText(/time/i), '14:00');
      
      const radiusInput = screen.getByLabelText(/radius/i);
      await user.clear(radiusInput);
      await user.type(radiusInput, '0.1');
      
      await user.click(screen.getByText('Select Location'));
      await user.click(screen.getByText('Create Event'));
      
      await waitFor(() => {
        expect(onEventCreated).toHaveBeenCalledWith({ id: 'event-1' });
      });
    });

    it('should handle maximum radius value', async () => {
      const user = userEvent.setup();
      const { onEventCreated } = renderCreateEventForm();
      
      await user.type(screen.getByLabelText(/event title/i), 'Large Radius Event');
      await user.type(screen.getByLabelText(/description/i), 'Event with maximum radius');
      await user.type(screen.getByLabelText(/date/i), '2024-12-31');
      await user.type(screen.getByLabelText(/time/i), '14:00');
      
      const radiusInput = screen.getByLabelText(/radius/i);
      await user.clear(radiusInput);
      await user.type(radiusInput, '100');
      
      await user.click(screen.getByText('Select Location'));
      await user.click(screen.getByText('Create Event'));
      
      await waitFor(() => {
        expect(onEventCreated).toHaveBeenCalledWith({ id: 'event-1' });
      });
    });
  });

  describe('Special Characters and Unicode', () => {
    it('should handle special characters in title', async () => {
      const user = userEvent.setup();
      const { onEventCreated } = renderCreateEventForm();
      
      const specialTitle = 'Event with émojis 🌍♻️ & symbols @#$%';
      
      await user.type(screen.getByLabelText(/event title/i), specialTitle);
      await user.type(screen.getByLabelText(/description/i), 'Test Description');
      await user.type(screen.getByLabelText(/date/i), '2024-12-31');
      await user.type(screen.getByLabelText(/time/i), '14:00');
      
      await user.click(screen.getByText('Select Location'));
      await user.click(screen.getByText('Create Event'));
      
      await waitFor(() => {
        expect(onEventCreated).toHaveBeenCalledWith({ id: 'event-1' });
      });
    });

    it('should handle unicode characters in description', async () => {
      const user = userEvent.setup();
      const { onEventCreated } = renderCreateEventForm();
      
      const unicodeDescription = 'Cleanup event with unicode: 中文, العربية, русский, 日本語';
      
      await user.type(screen.getByLabelText(/event title/i), 'Unicode Event');
      await user.type(screen.getByLabelText(/description/i), unicodeDescription);
      await user.type(screen.getByLabelText(/date/i), '2024-12-31');
      await user.type(screen.getByLabelText(/time/i), '14:00');
      
      await user.click(screen.getByText('Select Location'));
      await user.click(screen.getByText('Create Event'));
      
      await waitFor(() => {
        expect(onEventCreated).toHaveBeenCalledWith({ id: 'event-1' });
      });
    });
  });

  describe('Time Zone Edge Cases', () => {
    it('should handle midnight time', async () => {
      const user = userEvent.setup();
      const { onEventCreated } = renderCreateEventForm();
      
      await user.type(screen.getByLabelText(/event title/i), 'Midnight Event');
      await user.type(screen.getByLabelText(/description/i), 'Event at midnight');
      await user.type(screen.getByLabelText(/date/i), '2024-12-31');
      await user.type(screen.getByLabelText(/time/i), '00:00');
      
      await user.click(screen.getByText('Select Location'));
      await user.click(screen.getByText('Create Event'));
      
      await waitFor(() => {
        expect(onEventCreated).toHaveBeenCalledWith({ id: 'event-1' });
      });
    });

    it('should handle 23:59 time', async () => {
      const user = userEvent.setup();
      const { onEventCreated } = renderCreateEventForm();
      
      await user.type(screen.getByLabelText(/event title/i), 'Late Night Event');
      await user.type(screen.getByLabelText(/description/i), 'Event just before midnight');
      await user.type(screen.getByLabelText(/date/i), '2024-12-31');
      await user.type(screen.getByLabelText(/time/i), '23:59');
      
      await user.click(screen.getByText('Select Location'));
      await user.click(screen.getByText('Create Event'));
      
      await waitFor(() => {
        expect(onEventCreated).toHaveBeenCalledWith({ id: 'event-1' });
      });
    });
  });

  describe('Equipment Edge Cases', () => {
    it('should handle maximum number of equipment items', async () => {
      const user = userEvent.setup();
      const { onEventCreated } = renderCreateEventForm();
      
      await user.type(screen.getByLabelText(/event title/i), 'Equipment Heavy Event');
      await user.type(screen.getByLabelText(/description/i), 'Event with lots of equipment');
      await user.type(screen.getByLabelText(/date/i), '2024-12-31');
      await user.type(screen.getByLabelText(/time/i), '14:00');
      
      // Add multiple equipment items
      const addEquipmentButton = screen.getByText(/add equipment/i);
      for (let i = 0; i < 10; i++) {
        await user.click(addEquipmentButton);
        const equipmentInputs = screen.getAllByPlaceholderText(/equipment name/i);
        await user.type(equipmentInputs[i], `Equipment ${i + 1}`);
      }
      
      await user.click(screen.getByText('Select Location'));
      await user.click(screen.getByText('Create Event'));
      
      await waitFor(() => {
        expect(onEventCreated).toHaveBeenCalledWith({ id: 'event-1' });
      });
    });

    it('should handle equipment with special characters', async () => {
      const user = userEvent.setup();
      const { onEventCreated } = renderCreateEventForm();
      
      await user.type(screen.getByLabelText(/event title/i), 'Special Equipment Event');
      await user.type(screen.getByLabelText(/description/i), 'Event with special equipment names');
      await user.type(screen.getByLabelText(/date/i), '2024-12-31');
      await user.type(screen.getByLabelText(/time/i), '14:00');
      
      // Add equipment with special characters
      const addEquipmentButton = screen.getByText(/add equipment/i);
      await user.click(addEquipmentButton);
      
      const equipmentInput = screen.getByPlaceholderText(/equipment name/i);
      await user.type(equipmentInput, 'Gloves (Size L/XL) - 50% off! 🧤');
      
      await user.click(screen.getByText('Select Location'));
      await user.click(screen.getByText('Create Event'));
      
      await waitFor(() => {
        expect(onEventCreated).toHaveBeenCalledWith({ id: 'event-1' });
      });
    });
  });

  describe('Rapid User Interactions', () => {
    it('should handle rapid form submission attempts', async () => {
      const user = userEvent.setup();
      const { onEventCreated } = renderCreateEventForm();
      
      // Fill form
      await user.type(screen.getByLabelText(/event title/i), 'Rapid Submit Event');
      await user.type(screen.getByLabelText(/description/i), 'Testing rapid submission');
      await user.type(screen.getByLabelText(/date/i), '2024-12-31');
      await user.type(screen.getByLabelText(/time/i), '14:00');
      
      await user.click(screen.getByText('Select Location'));
      
      // Rapidly click submit multiple times
      const submitButton = screen.getByText('Create Event');
      await user.click(submitButton);
      await user.click(submitButton);
      await user.click(submitButton);
      
      // Should only create one event
      await waitFor(() => {
        expect(vi.mocked(eventService.createEvent)).toHaveBeenCalledTimes(1);
        expect(onEventCreated).toHaveBeenCalledTimes(1);
      });
    });

    it('should handle form cancellation during submission', async () => {
      const user = userEvent.setup();
      
      // Mock slow event creation
      vi.mocked(eventService.createEvent).mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve({
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
        } as any), 1000))
      );
      
      const { onCancel } = renderCreateEventForm();
      
      // Fill and submit form
      await user.type(screen.getByLabelText(/event title/i), 'Slow Event');
      await user.type(screen.getByLabelText(/description/i), 'Event that takes time to create');
      await user.type(screen.getByLabelText(/date/i), '2024-12-31');
      await user.type(screen.getByLabelText(/time/i), '14:00');
      
      await user.click(screen.getByText('Select Location'));
      await user.click(screen.getByText('Create Event'));
      
      // Cancel while submission is in progress
      const cancelButton = screen.getByText('Cancel');
      await user.click(cancelButton);
      
      expect(onCancel).toHaveBeenCalled();
    });
  });
});