import React from 'react';
import { Event, User, EventStatus } from '../types';

interface EventCardProps {
  event: Event;
  onSelectEvent: (eventId: string) => void;
  currentUser: User;
}

const statusColors: { [key in EventStatus]: string } = {
  [EventStatus.Upcoming]: 'bg-blue-100 text-blue-800',
  [EventStatus.InProgress]: 'bg-yellow-100 text-yellow-800',
  [EventStatus.Completed]: 'bg-green-100 text-green-800',
  [EventStatus.Cancelled]: 'bg-red-100 text-red-800',
};

const EventCard: React.FC<EventCardProps> = ({ event, onSelectEvent }) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div 
        className="bg-white rounded-lg shadow-lg overflow-hidden transform hover:-translate-y-1 transition-transform duration-300 cursor-pointer flex flex-col"
        onClick={() => onSelectEvent(event.id)}
    >
      <img className="w-full h-48 object-cover" src={event.mapImageUrl} alt={`Map of ${event.title}`} />
      <div className="p-4 flex flex-col flex-grow">
        <div className="flex justify-between items-start mb-2">
            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${statusColors[event.status]}`}>
                {event.status}
            </span>
            <div className="flex items-center text-sm text-gray-600">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                </svg>
                {event.participants.length}
            </div>
        </div>
        <h3 className="text-xl font-bold text-gray-800 mb-1 truncate">{event.title}</h3>
        <p className="text-gray-600 text-sm mb-4 flex-grow">{event.description.substring(0, 100)}...</p>
        <div className="text-sm text-gray-500 mt-auto pt-4 border-t border-gray-100">
          <p className="font-semibold">{formatDate(event.date)}</p>
          <p className="truncate">{event.location.address}</p>
        </div>
      </div>
    </div>
  );
};

export default EventCard;