import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import EventList from '../components/EventList';
import { EventStatus, Event, User } from '../types';

const currentUser: User = {
  id: 'u1',
  name: 'Alice',
  email: 'alice@example.com',
  avatarUrl: ''
};

const makeEvent = (overrides: Partial<Event>): Event => ({
  id: overrides.id || `e-${Math.random()}`,
  title: overrides.title || 'Park Cleanup',
  description: overrides.description || 'Help clean the local park',
  location: overrides.location || { address: 'Central Park', lat: 0, lng: 0 },
  mapImageUrl: overrides.mapImageUrl || '',
  radius: overrides.radius || 2,
  date: overrides.date || new Date().toISOString(),
  status: overrides.status || EventStatus.Upcoming,
  organizer: overrides.organizer || currentUser,
  participants: overrides.participants || [],
  equipment: overrides.equipment || [],
  chat: overrides.chat || [],
  photos: overrides.photos || [],
  distance: overrides.distance || 1,
});

describe('EventList display', () => {
  it('shows events in a responsive grid when events exist', () => {
    const events = [
      makeEvent({ title: 'Beach Cleanup A' }),
      makeEvent({ title: 'Beach Cleanup B', status: EventStatus.InProgress, date: new Date(Date.now() - 86400000).toISOString() }),
    ];
    const onCreateEvent = vi.fn();

    render(
      <EventList
        events={events}
        onSelectEvent={vi.fn()}
        currentUser={currentUser}
        onCreateEvent={onCreateEvent}
      />
    );

    expect(screen.getByText(/Upcoming Events/i)).toBeInTheDocument();
    expect(screen.getByText(/Past & Active Events/i)).toBeInTheDocument();

    // Verify grid container uses responsive classes
    const grid = screen.getByTestId('upcoming-grid');
    expect(grid.className).toContain('grid-cols-1');
    expect(grid.className).toContain('md:grid-cols-2');
    expect(grid.className).toContain('lg:grid-cols-3');
  });

  it('shows empty state with Create button when no events exist', () => {
    const onCreateEvent = vi.fn();
    render(
      <EventList
        events={[]}
        onSelectEvent={vi.fn()}
        currentUser={currentUser}
        onCreateEvent={onCreateEvent}
      />
    );

    expect(screen.getByText(/No events/i)).toBeInTheDocument();
    const createBtn = screen.getByRole('button', { name: /Create new event/i });
    expect(createBtn).toBeInTheDocument();

    fireEvent.click(createBtn);
    expect(onCreateEvent).toHaveBeenCalledTimes(1);
  });
});