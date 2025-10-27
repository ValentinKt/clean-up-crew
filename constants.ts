import { User, Event, EventStatus } from './types';

export const MOCK_USERS: User[] = [
  { id: 'user-1', name: 'Alice Green', email: 'alice@example.com', avatarUrl: 'https://i.pravatar.cc/150?u=user-1' },
  { id: 'user-2', name: 'Bob Rivers', email: 'bob@example.com', avatarUrl: 'https://i.pravatar.cc/150?u=user-2' },
  { id: 'user-3', name: 'Charlie Woods', email: 'charlie@example.com', avatarUrl: 'https://i.pravatar.cc/150?u=user-3' },
  { id: 'user-4', name: 'Diana Fields', email: 'diana@example.com', avatarUrl: 'https://i.pravatar.cc/150?u=user-4' },
];

export const MOCK_EVENTS: Event[] = [
  {
    id: 'event-1',
    title: 'Riverside Park Cleanup',
    description: 'Join us for our monthly cleanup of Riverside Park. We will be focusing on the river banks and the main picnic area. Gloves and bags will be provided. Together, we can make a difference!',
    location: { address: 'Riverside Park, Springfield, USA', lat: 42.101, lng: -72.589 },
    mapImageUrl: 'https://render.openstreetmap.org/cgi-bin/export?bbox=-72.599,42.0935,-72.579,42.1085&scale=20000&format=png',
    radius: 2,
    date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    status: EventStatus.Upcoming,
    organizer: MOCK_USERS[0],
    participants: [MOCK_USERS[0], MOCK_USERS[2]],
    equipment: [
      { id: 'eq-1-1', name: 'Trash bags' },
      { id: 'eq-1-2', name: 'Gloves', claimedBy: 'user-3', isProvided: true },
      { id: 'eq-1-3', name: 'Water bottles', claimedBy: 'user-1' },
    ],
    chat: [
        { id: 'chat-1-1', user: MOCK_USERS[0], message: 'Hey everyone, looking forward to seeing you all!', timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString() },
        { id: 'chat-1-2', user: MOCK_USERS[2], message: 'Me too! I will bring some extra snacks.', timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString() }
    ],
    photos: [],
    distance: 3.5,
  },
  {
    id: 'event-2',
    title: 'Ocean Beach Sweep',
    description: 'Help us clean up Ocean Beach before the tourist season starts. We will be collecting plastic waste and other debris washed ashore. Sunscreen and hats are recommended.',
    location: { address: 'Ocean Beach, San Francisco, CA, USA', lat: 37.76, lng: -122.51 },
    mapImageUrl: 'https://render.openstreetmap.org/cgi-bin/export?bbox=-122.52,37.7525,-122.5,37.7675&scale=20000&format=png',
    radius: 5,
    date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
    status: EventStatus.Upcoming,
    organizer: MOCK_USERS[1],
    participants: [MOCK_USERS[1], MOCK_USERS[3], MOCK_USERS[0]],
    equipment: [
      { id: 'eq-2-1', name: 'Large buckets' },
      { id: 'eq-2-2', name: 'Sifters for microplastics', claimedBy: 'user-4' },
    ],
    chat: [],
    photos: [],
    distance: 1.2,
  },
  {
    id: 'event-3',
    title: 'Downtown Alley Revitalization',
    description: 'This event is currently in progress! We are cleaning and beautifying the alleyways in the city center.',
    location: { address: 'Financial District, Metroburg', lat: 40.7128, lng: -74.0060 },
    mapImageUrl: 'https://render.openstreetmap.org/cgi-bin/export?bbox=-74.016,40.7053,-73.996,40.7203&scale=20000&format=png',
    radius: 1,
    date: new Date().toISOString(),
    status: EventStatus.InProgress,
    organizer: MOCK_USERS[2],
    participants: [MOCK_USERS[2], MOCK_USERS[0], MOCK_USERS[1], MOCK_USERS[3]],
    equipment: [],
    chat: [],
    photos: [
        { url: 'https://picsum.photos/seed/cleanup1/800/600', timestamp: new Date().toISOString() }
    ],
    distance: 8.1,
  },
  {
    id: 'event-4',
    title: 'Mountain Trail Maintenance',
    description: 'We successfully cleared and maintained 5 miles of the Blue Mountain trail. Thanks to all volunteers!',
    location: { address: 'Blue Mountain Trailhead, Upstate', lat: 41.2, lng: -74.3 },
    mapImageUrl: 'https://render.openstreetmap.org/cgi-bin/export?bbox=-74.31,41.1925,-74.29,41.2075&scale=20000&format=png',
    radius: 3,
    date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    status: EventStatus.Completed,
    organizer: MOCK_USERS[3],
    participants: [MOCK_USERS[3], MOCK_USERS[1]],
    equipment: [
      { id: 'eq-4-1', name: 'Shovels', claimedBy: 'user-1', isProvided: true },
      { id: 'eq-4-2', name: 'Rakes', claimedBy: 'user-3', isProvided: true },
    ],
    chat: [],
    photos: [
        { url: 'https://picsum.photos/seed/cleanup2/800/600', timestamp: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString() },
        { url: 'https://picsum.photos/seed/cleanup3/800/600', timestamp: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString() }
    ],
    distance: 15.0,
  },
   {
    id: 'event-5',
    title: 'Lakefront Cleanup Day',
    description: 'This event was cancelled due to unforeseen weather conditions. We will reschedule soon.',
    location: { address: 'Clearwater Lake, Lakeside County', lat: 44.9, lng: -93.3 },
    mapImageUrl: 'https://render.openstreetmap.org/cgi-bin/export?bbox=-93.31,44.8925,-93.29,44.9075&scale=20000&format=png',
    radius: 4,
    date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    status: EventStatus.Cancelled,
    organizer: MOCK_USERS[0],
    participants: [MOCK_USERS[0]],
    equipment: [],
    chat: [],
    photos: [],
    distance: 22.0,
  }
];