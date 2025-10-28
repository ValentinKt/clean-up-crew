import React from 'react';
import { Event, User, EventStatus } from '../types';

interface EventHeaderProps {
  event: Event;
  currentUser: User;
  isParticipant: boolean;
  isUpcoming: boolean;
  isJoining: boolean;
  onJoinLeave: () => void;
  onBack: () => void;
  onViewProfile: (userId: string) => void;
}

const EventHeader: React.FC<EventHeaderProps> = ({
  event,
  currentUser,
  isParticipant,
  isUpcoming,
  isJoining,
  onJoinLeave,
  onBack,
  onViewProfile
}) => {
  const getStatusInfo = (status: EventStatus) => {
    switch (status) {
      case EventStatus.Upcoming:
        return {
          Icon: () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" /></svg>,
          text: 'text-blue-700',
          bg: 'bg-blue-50',
          border: 'border-blue-300'
        };
      case EventStatus.InProgress:
        return {
          Icon: () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L9 9.414V13a1 1 0 102 0V9.414l1.293 1.293a1 1 0 001.414-1.414z" clipRule="evenodd" /></svg>,
          text: 'text-green-700',
          bg: 'bg-green-50',
          border: 'border-green-300'
        };
      case EventStatus.Completed:
        return {
          Icon: () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>,
          text: 'text-purple-700',
          bg: 'bg-purple-50',
          border: 'border-purple-300'
        };
      case EventStatus.Cancelled:
        return {
          Icon: () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" /></svg>,
          text: 'text-red-700',
          bg: 'bg-red-50',
          border: 'border-red-300'
        };
      default:
        return {
          Icon: () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" /></svg>,
          text: 'text-gray-700',
          bg: 'bg-gray-50',
          border: 'border-gray-300'
        };
    }
  };

  const currentStatusInfo = getStatusInfo(event.status);

  return (
    <>
      <button onClick={onBack} className="mb-6 text-teal-600 hover:text-teal-800 font-semibold flex items-center">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
        </svg>
        Back to Events
      </button>

      <div className={`p-4 rounded-lg border-l-4 ${currentStatusInfo.border} ${currentStatusInfo.bg} mb-6`}>
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start">
          <div className="flex-grow">
            <div className={`flex items-center font-bold text-lg ${currentStatusInfo.text}`}>
              <currentStatusInfo.Icon />
              <span>{event.status}</span>
            </div>
            <h1 className="text-3xl font-extrabold text-gray-800 mt-1">{event.title}</h1>
            <div className="mt-4 flex items-center flex-wrap gap-y-2" aria-label="Event participants">
              <div className="flex -space-x-2 overflow-hidden mr-3">
                {event.participants.slice(0, 7).map(p => (
                  <img
                    key={p.id}
                    onClick={() => onViewProfile(p.id)}
                    className="inline-block h-10 w-10 rounded-full ring-2 ring-white cursor-pointer hover:ring-teal-300 transition-transform transform hover:scale-110"
                    src={p.avatarUrl}
                    alt={p.name}
                    title={p.name}
                  />
                ))}
              </div>
              {event.participants.length > 7 && (
                <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center text-sm font-bold text-gray-600 ring-2 ring-white z-10">
                  +{event.participants.length - 7}
                </div>
              )}
              <div className="ml-4 text-gray-700 font-semibold text-base">
                {event.participants.length} participant{event.participants.length !== 1 ? 's' : ''}
              </div>
            </div>
          </div>
          {isUpcoming && (
            <div className="mt-4 sm:mt-0 sm:ml-4 flex-shrink-0 pt-1">
              <button
                onClick={onJoinLeave}
                disabled={isJoining}
                className={`w-full sm:w-auto px-6 py-2 rounded-md font-semibold text-white transition duration-300 ${isParticipant ? 'bg-red-500 hover:bg-red-600' : 'bg-teal-600 hover:bg-teal-700'} ${isJoining ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {isJoining ? 'Processing...' : (isParticipant ? 'Leave Event' : 'Join Event')}
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default EventHeader;