import React from 'react';
import { Event, EventStatus } from '../types';

interface EventOrganizerActionsProps {
  event: Event;
  isPast: boolean;
  canUpdateStatus: boolean;
  updatingToStatus: EventStatus | null;
  onEdit: () => void;
  onFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onStatusChange: (newStatus: EventStatus) => void;
}

const EventOrganizerActions: React.FC<EventOrganizerActionsProps> = ({
  event,
  isPast,
  canUpdateStatus,
  updatingToStatus,
  onEdit,
  onFileUpload,
  onStatusChange
}) => {
  return (
    <div className="bg-teal-50 p-4 rounded-lg border border-teal-200 space-y-4">
      <h3 className="text-lg font-bold text-teal-800">Organizer Actions</h3>
      
      {!isPast && (
        <button 
          onClick={onEdit} 
          className="w-full sm:w-auto px-4 py-2 bg-yellow-500 text-white font-semibold rounded-lg hover:bg-yellow-600 transition duration-300 flex items-center justify-center"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" viewBox="0 0 20 20" fill="currentColor">
            <path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" />
            <path fillRule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clipRule="evenodd" />
          </svg>
          Edit Event Details
        </button>
      )}
      
      <div>
        <label htmlFor="photo-upload" className="block text-sm font-medium text-gray-700">
          Upload Photo of Collected Waste:
        </label>
        <input 
          id="photo-upload" 
          type="file" 
          accept="image/*" 
          onChange={onFileUpload} 
          className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-teal-100 file:text-teal-700 hover:file:bg-teal-200"
        />
        <p className="text-xs text-gray-500 mt-1">Photos will be timestamped automatically.</p>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Manage Status</label>
        <div className="flex flex-wrap items-start gap-2">
          {event.status === EventStatus.Upcoming && (
            <>
              <button 
                onClick={() => onStatusChange(EventStatus.InProgress)} 
                disabled={!!updatingToStatus} 
                className="px-4 py-2 text-sm bg-green-500 text-white font-semibold rounded-lg hover:bg-green-600 transition duration-300 disabled:opacity-50 disabled:cursor-wait flex items-center"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L9 9.414V13a1 1 0 102 0V9.414l1.293 1.293a1 1 0 001.414-1.414z" clipRule="evenodd" />
                </svg>
                {updatingToStatus === EventStatus.InProgress ? 'Starting...' : 'Start Event'}
              </button>
              <button 
                onClick={() => onStatusChange(EventStatus.Cancelled)} 
                disabled={!!updatingToStatus} 
                className="px-4 py-2 text-sm bg-red-500 text-white font-semibold rounded-lg hover:bg-red-600 transition duration-300 disabled:opacity-50 disabled:cursor-wait flex items-center"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                {updatingToStatus === EventStatus.Cancelled ? 'Cancelling...' : 'Cancel Event'}
              </button>
            </>
          )}
          
          {event.status === EventStatus.InProgress && (
            <>
              <button 
                onClick={() => onStatusChange(EventStatus.Completed)} 
                disabled={!!updatingToStatus} 
                className="px-4 py-2 text-sm bg-blue-500 text-white font-semibold rounded-lg hover:bg-blue-600 transition duration-300 disabled:opacity-50 disabled:cursor-wait flex items-center"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                {updatingToStatus === EventStatus.Completed ? 'Completing...' : 'Complete Event'}
              </button>
              <button 
                onClick={() => onStatusChange(EventStatus.Cancelled)} 
                disabled={!!updatingToStatus} 
                className="px-4 py-2 text-sm bg-red-500 text-white font-semibold rounded-lg hover:bg-red-600 transition duration-300 disabled:opacity-50 disabled:cursor-wait flex items-center"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                {updatingToStatus === EventStatus.Cancelled ? 'Cancelling...' : 'Cancel Event'}
              </button>
            </>
          )}
          
          {!canUpdateStatus && (
            <p className="text-sm text-gray-500 italic">This event's status cannot be changed.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default EventOrganizerActions;