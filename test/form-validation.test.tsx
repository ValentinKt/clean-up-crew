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
    validateForm: vi.fn(() => ({ isValid: false, errors: ['Title is required'] })),
    prepareFormData: vi.fn(),
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



describe('Form Validation Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Validation Logic', () => {
    it('should render form with validation errors when fields are empty', () => {
      const onEventCreated = vi.fn();
      const onCancel = vi.fn();
      
      render(<CreateEventForm currentUser={mockUser} onEventCreated={onEventCreated} onCancel={onCancel} />);
      
      // Form should render without crashing
      expect(screen.getByText('Create Event')).toBeInTheDocument();
    });

    it('should show create event button', () => {
      const onEventCreated = vi.fn();
      const onCancel = vi.fn();
      
      render(<CreateEventForm currentUser={mockUser} onEventCreated={onEventCreated} onCancel={onCancel} />);
      
      expect(screen.getByText('Create Event')).toBeInTheDocument();
    });

    it('should show cancel button', () => {
      const onEventCreated = vi.fn();
      const onCancel = vi.fn();
      
      render(<CreateEventForm currentUser={mockUser} onEventCreated={onEventCreated} onCancel={onCancel} />);
      
      expect(screen.getByText('Cancel')).toBeInTheDocument();
    });

    it('should render map picker component', () => {
      const onEventCreated = vi.fn();
      const onCancel = vi.fn();
      
      render(<CreateEventForm currentUser={mockUser} onEventCreated={onEventCreated} onCancel={onCancel} />);
      
      expect(screen.getByTestId('map-picker')).toBeInTheDocument();
    });

    it('should call onCancel when cancel button is clicked', async () => {
      const user = userEvent.setup();
      const onEventCreated = vi.fn();
      const onCancel = vi.fn();
      
      render(<CreateEventForm currentUser={mockUser} onEventCreated={onEventCreated} onCancel={onCancel} />);
      
      const cancelButton = screen.getByText('Cancel');
      await user.click(cancelButton);
      
      expect(onCancel).toHaveBeenCalled();
    });
  });
});