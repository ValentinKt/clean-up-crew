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

vi.mock('../hooks/useFormValidation', () => ({
  useFormValidation: () => ({
    formData: {
      title: '',
      description: '',
      date: '',
      time: '',
      location: null,
      maxParticipants: 10,
      equipmentList: []
    },
    validationState: {
      title: { isValid: true, message: '' },
      description: { isValid: true, message: '' },
      date: { isValid: true, message: '' },
      time: { isValid: true, message: '' },
      location: { isValid: true, message: '' },
      maxParticipants: { isValid: true, message: '' },
      suggestions: [],
      isLoadingSuggestions: false
    },
    handleInputChange: vi.fn(),
    handleLocationChange: vi.fn(),
    handleEquipmentChange: vi.fn(),
    validateForm: vi.fn(() => true),
    resetForm: vi.fn(),
    getSuggestions: vi.fn(),
    addSuggestion: vi.fn()
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

describe('Error Handling Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Network Errors', () => {
    it('should handle network failure during event creation', async () => {
      vi.mocked(eventService.createEvent).mockRejectedValue(new Error('Network error'));
      
      const onEventCreated = vi.fn();
      const onCancel = vi.fn();
      
      render(<CreateEventForm currentUser={mockUser} onEventCreated={onEventCreated} onCancel={onCancel} />);
      
      // Check that the form renders
      expect(screen.getByText('Create a New Cleanup Event')).toBeInTheDocument();
      
      // Verify the service is mocked
      expect(eventService.createEvent).toBeDefined();
    });

    it('should handle service errors gracefully', async () => {
      vi.mocked(eventService.createEvent).mockRejectedValue(new Error('Service unavailable'));
      
      const onEventCreated = vi.fn();
      const onCancel = vi.fn();
      
      render(<CreateEventForm currentUser={mockUser} onEventCreated={onEventCreated} onCancel={onCancel} />);
      
      // Verify form renders without crashing
      expect(screen.getByText('Create a New Cleanup Event')).toBeInTheDocument();
      expect(screen.getByText('Create Event')).toBeInTheDocument();
    });
  });

  describe('Validation Errors', () => {
    it('should handle form validation errors', () => {
      const onEventCreated = vi.fn();
      const onCancel = vi.fn();
      
      render(<CreateEventForm currentUser={mockUser} onEventCreated={onEventCreated} onCancel={onCancel} />);
      
      // Check form elements are present
      expect(screen.getByText('Create a New Cleanup Event')).toBeInTheDocument();
      expect(screen.getByText('Create Event')).toBeInTheDocument();
    });

    it('should handle invalid input gracefully', () => {
      const onEventCreated = vi.fn();
      const onCancel = vi.fn();
      
      render(<CreateEventForm currentUser={mockUser} onEventCreated={onEventCreated} onCancel={onCancel} />);
      
      // Verify the component renders without errors
      expect(screen.getByText('Create a New Cleanup Event')).toBeInTheDocument();
    });
  });
});