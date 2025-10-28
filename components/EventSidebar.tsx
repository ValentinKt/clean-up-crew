import React from 'react';
import { Event, User } from '../types';

interface EventSidebarProps {
  event: Event;
  organizer: User | null;
  participants: User[];
  onViewUserProfile: (userId: string) => void;
}

const EventSidebar: React.FC<EventSidebarProps> = ({
  event,
  organizer,
  participants,
  onViewUserProfile
}) => {
  return (
    <div className="bg-white p-6 rounded-lg shadow-lg border border-gray-200 space-y-6">
      {/* Organizer Section */}
      <div>
        <h3 className="text-lg font-bold text-gray-800 mb-3 flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-teal-600" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-6-3a2 2 0 11-4 0 2 2 0 014 0zm-2 4a5 5 0 00-4.546 2.916A5.986 5.986 0 0010 16a5.986 5.986 0 004.546-2.084A5 5 0 0010 11z" clipRule="evenodd" />
          </svg>
          Organizer
        </h3>
        {organizer ? (
          <div 
            className="flex items-center space-x-3 p-3 bg-teal-50 rounded-lg border border-teal-200 cursor-pointer hover:bg-teal-100 transition-colors duration-200"
            onClick={() => onViewUserProfile(organizer.id)}
          >
            <div className="w-10 h-10 bg-teal-500 rounded-full flex items-center justify-center text-white font-bold">
              {organizer.name?.charAt(0).toUpperCase() || 'O'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {organizer.name || 'Anonymous Organizer'}
              </p>
              <p className="text-xs text-gray-500 truncate">
                {organizer.email}
              </p>
            </div>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
            </svg>
          </div>
        ) : (
          <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
            <p className="text-sm text-gray-500 italic">Organizer information not available</p>
          </div>
        )}
      </div>

      {/* Participants Section */}
      <div>
        <h3 className="text-lg font-bold text-gray-800 mb-3 flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-teal-600" viewBox="0 0 20 20" fill="currentColor">
            <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
          </svg>
          Participants ({participants.length})
        </h3>
        
        {participants.length === 0 ? (
          <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
            <p className="text-sm text-gray-500 italic">No participants yet. Be the first to join!</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {participants.map((participant) => (
              <div 
                key={participant.id}
                className="flex items-center space-x-3 p-2 bg-gray-50 rounded-lg border border-gray-200 cursor-pointer hover:bg-gray-100 transition-colors duration-200"
                onClick={() => onViewUserProfile(participant.id)}
              >
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
                  {participant.name?.charAt(0).toUpperCase() || 'P'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {participant.name || 'Anonymous Participant'}
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    {participant.email}
                  </p>
                </div>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Event Stats */}
      <div className="pt-4 border-t border-gray-200">
        <div className="grid grid-cols-2 gap-4 text-center">
          <div className="bg-teal-50 p-3 rounded-lg border border-teal-200">
            <p className="text-2xl font-bold text-teal-600">{participants.length}</p>
            <p className="text-xs text-teal-700 font-medium">Participants</p>
          </div>
          <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
            <p className="text-2xl font-bold text-blue-600">∞</p>
            <p className="text-xs text-blue-700 font-medium">Max Capacity</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventSidebar;