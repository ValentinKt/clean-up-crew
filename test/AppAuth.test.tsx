import { describe, it, expect, vi, afterEach } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import App from '../App';

const onAuthHandlers: any[] = [];

vi.mock('../services/supabaseClient', () => ({
  supabase: {
    auth: {
      onAuthStateChange: (cb: any) => {
        onAuthHandlers.push(cb);
        return { data: { subscription: { unsubscribe: () => {} } } };
      },
      signOut: vi.fn().mockResolvedValue({}),
      getUser: vi.fn().mockResolvedValue({ data: { user: null } })
    }
  }
}));

vi.mock('../services/eventService', () => ({
  getEventsForUser: vi.fn().mockResolvedValue([])
}));

describe('App auth flow', () => {
  afterEach(() => {
    onAuthHandlers.length = 0;
  });

  it('renders Login when no session', async () => {
    render(<App />);
    // Simulate no session
    onAuthHandlers[0]?.('INITIAL_SESSION', null);
    expect(await screen.findByText(/sign in/i)).toBeInTheDocument();
  });

  it('renders EventList when session exists', async () => {
    render(<App />);
    onAuthHandlers[0]?.('SIGNED_IN', { user: { id: 'u1', email: 'user@example.com', user_metadata: {} } });
    expect(await screen.findByText(/community cleanups/i)).toBeInTheDocument();
  });
});