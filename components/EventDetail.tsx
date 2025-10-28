import React, { useState, useRef, useEffect } from 'react';
import { Event, User, EventStatus } from '../types';
import { joinEvent, leaveEvent, addPhotoToEvent, postMessageToChat, updateEventStatus, updateChecklistItem, markItemAsProvided, addChecklistItem } from '../services/eventService';
import EditEventForm from './EditEventForm';
import MapView from './MapView';
import EventHeader from './EventHeader';
import EventEquipment from './EventEquipment';
import EventPhotos from './EventPhotos';
import EventOrganizerActions from './EventOrganizerActions';
import EventSidebar from './EventSidebar';
import EventChat from './EventChat';
import { useEventRealtime } from '../hooks/useEventRealtime';
import { useNotifications } from '../hooks/useNotifications';

interface EventDetailProps {
  event: Event;
  currentUser: User;
  onBack: () => void;
  onEventUpdate: (event: Event) => void;
  onViewProfile: (userId: string) => void;
}

const customMapIconUrl = `data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0iIzBkOTQ4OCIgd2lkdGg9IjQ4cHgiIGhlaWdodD0iNDhweCI+PHBhdGggZD0iTTEyIDJDOC4xMyAyIDUgNS4xMyA1IDljMCA1LjI1IDcgMTMgNyAxM3M3LTcuNzUgNy0xM1MxNS44NyAyIDEyIDJ6bS4yMSAxMi4yNWMtMS4xMi0xLjg3LTEuMTItMS44Ny0yLjQyIDBoLTIuMDNsMi40NC0zLjc5aDEuNjFsMi40NCAzLjc5aC0yLjA0ek0xMy4yNSA5LjI1aC0yLjV2LTIuNWgyLjV2Mi41eiIvPjwvc3ZnPg==`;

function usePrevious<T>(value: T): T | undefined {
  const ref = useRef<T | undefined>(undefined);
  useEffect(() => {
    ref.current = value;
  });
  return ref.current;
}

const EventDetail: React.FC<EventDetailProps> = ({ event, currentUser, onBack, onEventUpdate, onViewProfile }) => {
  const [isJoining, setIsJoining] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [newItemName, setNewItemName] = useState('');
  const [isSavingNewItem, setIsSavingNewItem] = useState(false);
  const [claimingItemId, setClaimingItemId] = useState<string | null>(null);
  const [providingItemId, setProvidingItemId] = useState<string | null>(null);
  const [updatingToStatus, setUpdatingToStatus] = useState<EventStatus | null>(null);
  const [chatMessage, setChatMessage] = useState('');
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const { addNotification } = useNotifications();
  
  // Use the realtime hook
  useEventRealtime({ event, currentUser, onEventUpdate });
  
  // --- Status Icons and Configuration ---
  const CalendarIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>;
  const PlayIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
  const CheckCircleIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
  const XCircleIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;

  const statusInfo: { [key in EventStatus]: { bg: string, text: string, border: string, Icon: React.FC } } = {
    [EventStatus.Upcoming]: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-400', Icon: CalendarIcon },
    [EventStatus.InProgress]: { bg: 'bg-yellow-50', text: 'text-yellow-700', border: 'border-yellow-400', Icon: PlayIcon },
    [EventStatus.Completed]: { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-400', Icon: CheckCircleIcon },
    [EventStatus.Cancelled]: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-400', Icon: XCircleIcon },
  };
  
  const currentStatusInfo = statusInfo[event.status];
  const isParticipant = event.participants.some(p => p.id === currentUser.id);
  const isOrganizer = event.organizer.id === currentUser.id;
  const isUpcoming = event.status === EventStatus.Upcoming;
  const isPast = event.status === EventStatus.Completed || event.status === EventStatus.Cancelled;
  const canUpdateStatus = isOrganizer && (event.status === EventStatus.Upcoming || event.status === EventStatus.InProgress);


  const handleJoinLeave = async () => {
    setIsJoining(true);
    isParticipant
      ? await leaveEvent(event.id, currentUser)
      : await joinEvent(event.id, currentUser);
    
    // No need to call onEventUpdate, realtime will handle it
    setIsJoining(false);
  };
  
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      // In a real app, you would upload the file to a server and get a URL.
      // Here, we'll simulate it with a placeholder.
      const placeholderUrl = `https://picsum.photos/seed/${event.id}-${Date.now()}/800/600`;
      await addPhotoToEvent(event.id, placeholderUrl);
    }
  };

  const handlePostMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatMessage.trim() || isSendingMessage) return;

    setIsSendingMessage(true);
    try {
        await postMessageToChat(event.id, currentUser, chatMessage.trim());
        setChatMessage('');
    } catch (error) {
        console.error("Failed to send message:", error);
    } finally {
        setIsSendingMessage(false);
    }
  };
  
  const handleStatusChangeClick = async (newStatus: EventStatus) => {
    setUpdatingToStatus(newStatus);
    await updateEventStatus(event.id, newStatus);
    setUpdatingToStatus(null);
  };

  const handleEventUpdated = (updatedEvent: Event) => {
    onEventUpdate(updatedEvent);
    setIsEditing(false);
  };
  
  const handleClaimItem = async (itemId: string, claim: boolean) => {
    setClaimingItemId(itemId);
    const userId = claim ? currentUser.id : undefined;
    await updateChecklistItem(event.id, itemId, userId);
    setClaimingItemId(null);
  };

  const handleMarkAsProvided = async (itemId: string, provided: boolean) => {
    setProvidingItemId(itemId);
    await markItemAsProvided(event.id, itemId, provided);
    setProvidingItemId(null);
  };

  const handleSaveNewItem = async () => {
    if (!newItemName.trim()) {
        setIsAddingItem(false);
        return;
    }
    setIsSavingNewItem(true);
    await addChecklistItem(event.id, newItemName.trim());
    setIsSavingNewItem(false);
    setIsAddingItem(false);
    setNewItemName('');
  };

  const formatDate = (dateString: string) => new Date(dateString).toLocaleString('en-US', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
  });

  if (isEditing) {
    return <EditEventForm eventToEdit={event} onEventUpdated={handleEventUpdated} onCancel={() => setIsEditing(false)} />;
  }

  return (
    <div className="bg-white p-4 sm:p-6 md:p-8 rounded-xl shadow-2xl max-w-4xl mx-auto">
      <button onClick={onBack} className="mb-6 text-teal-600 hover:text-teal-800 font-semibold flex items-center">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
        </svg>
        Back to Events
      </button>

      {/* Header */}
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
                        onClick={handleJoinLeave}
                        disabled={isJoining}
                        className={`w-full sm:w-auto px-6 py-2 rounded-md font-semibold text-white transition duration-300 ${isParticipant ? 'bg-red-500 hover:bg-red-600' : 'bg-teal-600 hover:bg-teal-700'} ${isJoining ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                        {isJoining ? 'Processing...' : (isParticipant ? 'Leave Event' : 'Join Event')}
                    </button>
                </div>
            )}
        </div>
      </div>
      
      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
            <MapView location={event.location} title={event.title} iconUrl={customMapIconUrl} />
            
            <div className="text-gray-700">
                <h2 className="text-xl font-bold text-gray-800 mb-2">Event Details</h2>
                <p className="whitespace-pre-wrap">{event.description}</p>
            </div>
            
            <div>
                <h3 className="text-lg font-bold text-gray-800 mb-2">When & Where</h3>
                <p><span className="font-semibold">Date:</span> {formatDate(event.date)}</p>
                <p><span className="font-semibold">Location:</span> {event.location.address} (within a {event.radius}km radius)</p>
            </div>

            <EventEquipment 
              event={event}
              currentUser={currentUser}
              isOrganizer={isOrganizer}
              isParticipant={isParticipant}
              isPast={isPast}
              onClaimItem={handleClaimItem}
              onMarkAsProvided={handleMarkAsProvided}
              onAddItem={handleSaveNewItem}
              claimingItemId={claimingItemId}
              providingItemId={providingItemId}
            />
            
            <EventPhotos photos={event.photos.map(photo => photo.url)} />

            <EventOrganizerActions 
              event={event}
              isPast={isPast}
              canUpdateStatus={canUpdateStatus}
              updatingToStatus={updatingToStatus}
              onEdit={() => setIsEditing(true)}
              onFileUpload={handleFileUpload}
              onStatusChange={handleStatusChangeClick}
            />
        </div>
        
        <EventSidebar 
          event={event}
          organizer={event.organizer}
          participants={event.participants}
          onViewUserProfile={onViewProfile}
        />
      </div>
    </div>
  );
};

export default EventDetail;