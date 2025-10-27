export enum EventStatus {
  Upcoming = 'Upcoming',
  InProgress = 'In Progress',
  Completed = 'Completed',
  Cancelled = 'Cancelled',
}

export type NotificationType = 'info' | 'success' | 'warning' | 'error';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl: string;
}

export interface ChecklistItem {
  id: string;
  name: string;
  claimedBy?: string; // User ID
  isProvided?: boolean;
}

export interface ChatMessage {
  id: string;
  user: User;
  message: string;
  timestamp: string;
}

export interface Location {
  address: string;
  lat: number;
  lng: number;
  radius?: number; // Optional radius in meters for event coverage area
}

export interface Event {
  id: string;
  title: string;
  description: string;
  location: Location;
  mapImageUrl: string;
  radius: number; // in km
  date: string;
  status: EventStatus;
  organizer: User;
  participants: User[];
  equipment: ChecklistItem[];
  chat: ChatMessage[];
  photos: { url: string; timestamp: string }[];
  distance: number; // simulated for filtering
}