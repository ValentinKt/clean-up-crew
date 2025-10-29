import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import App from '../App';

// Mock Supabase client to immediately provide a session
vi.mock('../services/supabaseClient', () => ({
  supabase: {
    auth: {
      onAuthStateChange: (cb: (event: string, session: any) => void) => {
        // Simulate an authenticated session after mount
        setTimeout(() => cb('INITIAL_SESSION', { user: { id: 'u1', email: 'user@example.com', user_metadata: {} } }), 0);
        return { data: { subscription: { unsubscribe: () => {} } } };
      },
      signOut: vi.fn(),
    },
  },
  getPublicProfile: vi.fn().mockResolvedValue({ id: 'u1', email: 'user@example.com', name: 'User', avatarUrl: '' }),
}));

// Mock eventService to fail first, then succeed on retry
const getEventsForUserMock = vi.fn()
  .mockRejectedValueOnce(new Error('network error'))
  .mockResolvedValueOnce([]);

vi.mock('../services/eventService', () => ({
  getEventsForUser: (...args: any[]) => getEventsForUserMock(...args),
}));

describe('App events error handling', () => {
  it('shows an error banner and allows retry', async () => {
    render(<App />);

    // Error banner should appear after failed fetch
    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent(/We couldn't load events/i);

    // Click retry
    const retry = screen.getByRole('button', { name: /retry/i });
    fireEvent.click(retry);

    await waitFor(() => {
      expect(getEventsForUserMock).toHaveBeenCalledTimes(2);
      // After success, banner should be gone
      expect(screen.queryByRole('alert')).toBeNull();
    });
  });
});