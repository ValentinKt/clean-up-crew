import React, { useState, useRef, useEffect } from 'react';
import { RealtimeChannel } from '@supabase/supabase-js';
import { Event, User, EventStatus } from '../types';
import { joinEvent, leaveEvent, addPhotoToEvent, postMessageToChat, updateEventStatus, updateChecklistItem, markItemAsProvided, addChecklistItem, getEventById } from '../services/eventService';
import EditEventForm from './EditEventForm';
import MapView from './MapView';
import { supabase } from '../services/supabaseClient';
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
  const [chatMessage, setChatMessage] = useState('');
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [updatingToStatus, setUpdatingToStatus] = useState<EventStatus | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [claimingItemId, setClaimingItemId] = useState<string | null>(null);
  const [providingItemId, setProvidingItemId] = useState<string | null>(null);
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [newItemName, setNewItemName] = useState('');
  const [isSavingNewItem, setIsSavingNewItem] = useState(false);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const realtimeChannel = useRef<RealtimeChannel | null>(null);
  const { addNotification } = useNotifications();
  const prevEvent = usePrevious(event);
  
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

  useEffect(() => {
    const refetchEvent = async () => {
        const updatedEventData = await getEventById(event.id);
        if (updatedEventData) {
            onEventUpdate(updatedEventData);
        }
    };

    const channel = supabase.channel(`event-details-${event.id}`);
    channel
      .on('postgres_changes', { event: '*', schema: 'public', table: 'events', filter: `id=eq.${event.id}` }, refetchEvent)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'event_participants', filter: `event_id=eq.${event.id}` }, refetchEvent)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'event_chat', filter: `event_id=eq.${event.id}` }, refetchEvent)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'event_equipment', filter: `event_id=eq.${event.id}` }, refetchEvent)
      .subscribe();
      
    realtimeChannel.current = channel;

    return () => {
        if (realtimeChannel.current) {
            supabase.removeChannel(realtimeChannel.current);
            realtimeChannel.current = null;
        }
    };
  }, [event.id, onEventUpdate]);

  useEffect(() => {
    // Auto-scroll chat to the bottom on new messages
    if (chatContainerRef.current) {
        chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [event.chat]);

  useEffect(() => {
    if (!prevEvent || !event || prevEvent.id !== event.id) {
        return; 
    }

    // Status Change Notification
    if (prevEvent.status !== event.status) {
        addNotification('info', 'Status Updated', `The event "${event.title}" is now ${event.status}.`);
    }

    // Participant Joins Notification
    if (prevEvent.participants.length < event.participants.length) {
        const newParticipant = event.participants.find(p => !prevEvent.participants.some(prevP => prevP.id === p.id));
        if (newParticipant && newParticipant.id !== currentUser.id) {
            addNotification('info', 'New Participant!', `${newParticipant.name} has joined the event.`);
        }
    }

    // Participant Leaves Notification
    if (prevEvent.participants.length > event.participants.length) {
        const leftParticipant = prevEvent.participants.find(p => !event.participants.some(currP => currP.id === p.id));
        if (leftParticipant && leftParticipant.id !== currentUser.id) {
            addNotification('warning', 'Participant Left', `${leftParticipant.name} has left the event.`);
        }
    }

    // New Chat Message Notification
    if (prevEvent.chat.length < event.chat.length) {
        const newMessage = event.chat[event.chat.length - 1];
        if (newMessage && newMessage.user.id !== currentUser.id) {
            const messagePreview = newMessage.message.substring(0, 50) + (newMessage.message.length > 50 ? '...' : '');
            addNotification('info', `New Message from ${newMessage.user.name}`, messagePreview);
        }
    }
  }, [event, prevEvent, currentUser.id, addNotification]);


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

            <div>
                <h3 className="text-lg font-bold text-gray-800 mb-3 flex justify-between items-center">
                    <span>What to Bring</span>
                    {isOrganizer && !isAddingItem && !isPast && (
                        <button 
                            onClick={() => setIsAddingItem(true)} 
                            className="text-sm font-semibold text-teal-600 hover:text-teal-800 bg-teal-100 hover:bg-teal-200 px-3 py-1 rounded-md transition flex items-center"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" /></svg>
                            Add Item
                        </button>
                    )}
                </h3>
                {isAddingItem && (
                    <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg mb-3 border border-teal-200">
                        <input
                            type="text"
                            value={newItemName}
                            onChange={(e) => setNewItemName(e.target.value)}
                            placeholder="New item name..."
                            autoFocus
                            disabled={isSavingNewItem}
                            className="flex-grow px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-teal-500 focus:border-teal-500"
                        />
                        <button onClick={handleSaveNewItem} disabled={isSavingNewItem || !newItemName.trim()} className="px-4 py-2 bg-teal-600 text-white font-semibold rounded-md hover:bg-teal-700 disabled:opacity-50 disabled:cursor-wait">
                            {isSavingNewItem ? 'Saving...' : 'Save'}
                        </button>
                        <button onClick={() => setIsAddingItem(false)} disabled={isSavingNewItem} className="px-4 py-2 bg-gray-200 text-gray-700 font-semibold rounded-md hover:bg-gray-300">
                            Cancel
                        </button>
                    </div>
                )}

                {event.equipment.length > 0 ? (
                    <ul className="space-y-2">
                       {event.equipment.map(item => {
                            const claimant = item.claimedBy ? event.participants.find(p => p.id === item.claimedBy) : null;
                            const isClaimedByCurrentUser = item.claimedBy === currentUser.id;
                            const isActionInProgress = claimingItemId === item.id || providingItemId === item.id;
                            const canManageProvidedStatus = (isClaimedByCurrentUser || isOrganizer) && !!item.claimedBy;

                            return (
                                <li key={item.id} className={`flex items-center justify-between p-3 rounded-lg transition-colors duration-200 ${item.isProvided ? 'bg-green-50' : 'bg-gray-50/70 hover:bg-gray-100'}`}>
                                    <div className="flex items-center">
                                      {item.isProvided && (
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                        </svg>
                                      )}
                                      <div>
                                        <span className={`font-medium ${item.isProvided ? 'line-through text-gray-500' : 'text-gray-800'}`}>{item.name}</span>
                                        {claimant && (
                                            <div className="flex items-center text-xs text-gray-500 mt-1">
                                                <img src={claimant.avatarUrl} alt={claimant.name} className="w-4 h-4 rounded-full mr-1.5" />
                                                <span>Brought by <span className="font-semibold">{isClaimedByCurrentUser ? 'You' : claimant.name}</span></span>
                                            </div>
                                        )}
                                      </div>
                                    </div>
                                    
                                    <div className="flex items-center gap-2 min-w-[150px] justify-end">
                                      {isActionInProgress ? (
                                        <span className="text-sm text-gray-500">Updating...</span>
                                      ) : (
                                        <>
                                          {isParticipant && !claimant && (
                                            <button onClick={() => handleClaimItem(item.id, true)} className="flex items-center text-sm font-semibold text-teal-600 hover:text-teal-800 bg-teal-100 hover:bg-teal-200 px-3 py-1 rounded-md transition">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" /></svg>
                                                Claim
                                            </button>
                                          )}
                                          {isClaimedByCurrentUser && !item.isProvided && (
                                            <button onClick={() => handleClaimItem(item.id, false)} className="flex items-center text-sm font-semibold text-red-600 hover:text-red-800 bg-red-100 hover:bg-red-200 px-3 py-1 rounded-md transition">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                                                Unclaim
                                            </button>
                                          )}
                                          {canManageProvidedStatus && (
                                            <button 
                                              onClick={() => handleMarkAsProvided(item.id, !item.isProvided)} 
                                              className={`flex items-center text-sm font-semibold px-3 py-1 rounded-md transition ${
                                                item.isProvided 
                                                  ? 'text-yellow-600 hover:text-yellow-800 bg-yellow-100 hover:bg-yellow-200' 
                                                  : 'text-green-600 hover:text-green-800 bg-green-100 hover:bg-green-200'
                                              }`}>
                                               {item.isProvided ? (
                                                    <>
                                                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 110 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" /></svg>
                                                      Undo
                                                    </>
                                                  ) : (
                                                    <>
                                                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                                                      Provided
                                                    </>
                                                  )}
                                            </button>
                                          )}
                                        </>
                                      )}
                                    </div>
                                </li>
                            );
                        })}
                    </ul>
                ) : (
                   !isAddingItem && <p className="text-gray-500 italic p-3 bg-gray-50 rounded-md">No equipment has been listed for this event yet.</p>
                )}
            </div>
            
            {/* Photo Gallery */}
            {event.photos.length > 0 && (
                <div>
                    <h3 className="text-lg font-bold text-gray-800 mb-2">Collected Waste Photos</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                        {event.photos.map((photo, index) => (
                            <div key={index} className="relative">
                                <img src={photo.url} alt={`Cleanup photo ${index+1}`} className="rounded-lg object-cover w-full h-32"/>
                                <p className="absolute bottom-0 left-0 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded-tr-lg rounded-bl-lg">{new Date(photo.timestamp).toLocaleTimeString()}</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}

             {/* Organizer Actions */}
            {isOrganizer && (
                <div className="bg-teal-50 p-4 rounded-lg border border-teal-200 space-y-4">
                    <h3 className="text-lg font-bold text-teal-800">Organizer Actions</h3>
                     {!isPast && (
                        <button onClick={() => setIsEditing(true)} className="w-full sm:w-auto px-4 py-2 bg-yellow-500 text-white font-semibold rounded-lg hover:bg-yellow-600 transition duration-300 flex items-center justify-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" viewBox="0 0 20 20" fill="currentColor"><path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" /><path fillRule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clipRule="evenodd" /></svg>
                            Edit Event Details
                        </button>
                     )}
                    <div>
                        <label htmlFor="photo-upload" className="block text-sm font-medium text-gray-700">Upload Photo of Collected Waste:</label>
                        <input id="photo-upload" type="file" accept="image/*" onChange={handleFileUpload} className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-teal-100 file:text-teal-700 hover:file:bg-teal-200"/>
                        <p className="text-xs text-gray-500 mt-1">Photos will be timestamped automatically.</p>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Manage Status</label>
                        <div className="flex flex-wrap items-start gap-2">
                           {event.status === EventStatus.Upcoming && (
                                <>
                                    <button onClick={() => handleStatusChangeClick(EventStatus.InProgress)} disabled={!!updatingToStatus} className="px-4 py-2 text-sm bg-green-500 text-white font-semibold rounded-lg hover:bg-green-600 transition duration-300 disabled:opacity-50 disabled:cursor-wait flex items-center">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L9 9.414V13a1 1 0 102 0V9.414l1.293 1.293a1 1 0 001.414-1.414z" clipRule="evenodd" /></svg>
                                        {updatingToStatus === EventStatus.InProgress ? 'Starting...' : 'Start Event'}
                                    </button>
                                    <button onClick={() => handleStatusChangeClick(EventStatus.Cancelled)} disabled={!!updatingToStatus} className="px-4 py-2 text-sm bg-red-500 text-white font-semibold rounded-lg hover:bg-red-600 transition duration-300 disabled:opacity-50 disabled:cursor-wait flex items-center">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" /></svg>
                                        {updatingToStatus === EventStatus.Cancelled ? 'Cancelling...' : 'Cancel Event'}
                                    </button>
                                </>
                            )}
                            {event.status === EventStatus.InProgress && (
                                <>
                                    <button onClick={() => handleStatusChangeClick(EventStatus.Completed)} disabled={!!updatingToStatus} className="px-4 py-2 text-sm bg-blue-500 text-white font-semibold rounded-lg hover:bg-blue-600 transition duration-300 disabled:opacity-50 disabled:cursor-wait flex items-center">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                                        {updatingToStatus === EventStatus.Completed ? 'Completing...' : 'Complete Event'}
                                    </button>
                                    <button onClick={() => handleStatusChangeClick(EventStatus.Cancelled)} disabled={!!updatingToStatus} className="px-4 py-2 text-sm bg-red-500 text-white font-semibold rounded-lg hover:bg-red-600 transition duration-300 disabled:opacity-50 disabled:cursor-wait flex items-center">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" /></svg>
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
            )}
        </div>
        
        {/* Sidebar */}
        <div className="space-y-6">
            <div>
                <h3 className="text-lg font-bold text-gray-800 mb-2">Organizer</h3>
                <div 
                    onClick={() => onViewProfile(event.organizer.id)}
                    className="flex items-center space-x-3 cursor-pointer p-2 rounded-lg hover:bg-gray-100 transition-colors"
                >
                    <img src={event.organizer.avatarUrl} alt={event.organizer.name} className="w-10 h-10 rounded-full"/>
                    <div>
                        <p className="font-semibold">{event.organizer.name}</p>
                        <p className="text-sm text-gray-500">{event.organizer.email}</p>
                    </div>
                </div>
            </div>
            
            <div>
                <h3 className="text-lg font-bold text-gray-800 mb-2">{event.participants.length} Participants</h3>
                <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                    {event.participants.map(p => (
                        <div
                            key={p.id} 
                            onClick={() => onViewProfile(p.id)}
                            className="flex items-center space-x-3 cursor-pointer p-2 rounded-lg hover:bg-gray-100 transition-colors"
                        >
                            <img 
                                src={p.avatarUrl} 
                                alt={p.name} 
                                className="w-10 h-10 rounded-full"
                            />
                            <p className="font-semibold text-gray-700">{p.name}</p>
                        </div>
                    ))}
                </div>
            </div>
            
            {/* Live Chat */}
            {isParticipant ? (
                 <div className="bg-gray-50 p-4 rounded-lg h-96 flex flex-col">
                    <h3 className="text-lg font-bold text-gray-800 mb-2">Participant Chat</h3>
                    <div ref={chatContainerRef} className="flex-grow overflow-y-auto space-y-4 pr-2">
                        {event.chat.length === 0 ? (
                            <div className="flex items-center justify-center h-full">
                                <p className="text-gray-500 italic">No messages yet. Start the conversation!</p>
                            </div>
                        ) : (
                            event.chat.map(msg => (
                                <div key={msg.id} className={`flex items-start gap-2.5 ${msg.user.id === currentUser.id ? 'justify-end' : ''}`}>
                                    {msg.user.id !== currentUser.id && <img className="w-8 h-8 rounded-full cursor-pointer" src={msg.user.avatarUrl} alt={msg.user.name} onClick={() => onViewProfile(msg.user.id)} />}
                                    <div className={`flex flex-col max-w-[320px] leading-1.5 p-3 rounded-xl ${msg.user.id === currentUser.id ? 'bg-teal-500 text-white rounded-br-none' : 'bg-gray-200 rounded-bl-none'}`}>
                                        <div className="flex items-center space-x-2 rtl:space-x-reverse">
                                            <span className={`text-sm font-semibold ${msg.user.id === currentUser.id ? '' : 'text-gray-900'}`}>{msg.user.id === currentUser.id ? 'You' : msg.user.name}</span>
                                            <span className={`text-xs font-normal ${msg.user.id === currentUser.id ? 'text-teal-100' : 'text-gray-500'}`}>{new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                        </div>
                                        <p className="text-sm font-normal py-1 break-words">{msg.message}</p>
                                    </div>
                                    {msg.user.id === currentUser.id && <img className="w-8 h-8 rounded-full cursor-pointer" src={msg.user.avatarUrl} alt={msg.user.name} onClick={() => onViewProfile(msg.user.id)} />}
                                </div>
                            ))
                        )}
                    </div>
                    <form onSubmit={handlePostMessage} className="mt-4 flex">
                        <input
                            type="text"
                            value={chatMessage}
                            onChange={(e) => setChatMessage(e.target.value)}
                            placeholder="Type a message..."
                            disabled={isSendingMessage}
                            className="flex-grow p-2 border rounded-l-md focus:ring-teal-500 focus:border-teal-500 disabled:bg-gray-100"
                        />
                        <button type="submit" disabled={isSendingMessage} className="bg-teal-600 text-white p-2 rounded-r-md hover:bg-teal-700 disabled:bg-teal-400 disabled:cursor-wait flex items-center justify-center w-20 transition-colors">
                            {isSendingMessage ? (
                                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                            ) : 'Send'}
                        </button>
                    </form>
                 </div>
            ) : <div className="bg-gray-100 p-4 rounded-lg text-center text-gray-600">Join the event to participate in the chat.</div>}
        </div>
      </div>
    </div>
  );
};

export default EventDetail;