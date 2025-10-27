import React, { useState, useMemo } from 'react';
import { User, Event, EventStatus } from '../types';
import { updateUser } from '../services/userService';
import { useNotifications } from '../hooks/useNotifications';

interface UserProfileProps {
  profileUser: User;
  currentUser: User;
  events: Event[];
  onBack: () => void;
  onUserUpdate: (user: User) => void;
  onSelectEvent: (eventId: string) => void;
}

const EVENT_DISPLAY_LIMIT = 3;

const UserProfile: React.FC<UserProfileProps> = ({ profileUser, currentUser, events, onBack, onUserUpdate, onSelectEvent }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(profileUser.name);
  const [avatarUrl, setAvatarUrl] = useState(profileUser.avatarUrl);
  const [isSaving, setIsSaving] = useState(false);
  const [showAllOrganized, setShowAllOrganized] = useState(false);
  const [showAllJoined, setShowAllJoined] = useState(false);
  const { addNotification } = useNotifications();

  const canEdit = currentUser.id === profileUser.id;

  const organizedEvents = useMemo(() => 
    events.filter(e => e.organizer.id === profileUser.id)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  , [events, profileUser.id]);

  const joinedEvents = useMemo(() => 
    events.filter(e => e.participants.some(p => p.id === profileUser.id) && e.organizer.id !== profileUser.id)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  , [events, profileUser.id]);

  const handleSave = async () => {
    setIsSaving(true);
    const updatedUser = await updateUser(profileUser.id, { name, avatarUrl });
    if (updatedUser) {
      onUserUpdate(updatedUser);
      addNotification('success', 'Profile Updated', 'Your changes have been saved successfully.');
    } else {
      addNotification('error', 'Update Failed', 'Could not save your changes. Please try again.');
    }
    setIsSaving(false);
    setIsEditing(false);
  };
  
  const EventListItem: React.FC<{event: Event}> = ({ event }) => (
    <div 
        onClick={() => onSelectEvent(event.id)}
        className="flex items-center justify-between p-3 bg-gray-50 hover:bg-teal-50 rounded-md cursor-pointer transition-colors duration-200"
    >
        <div>
            <p className="font-semibold text-gray-800">{event.title}</p>
            <p className="text-sm text-gray-500">{new Date(event.date).toLocaleDateString()}</p>
        </div>
        <span className={`text-xs font-bold px-2 py-1 rounded-full ${
            event.status === EventStatus.Upcoming ? 'bg-blue-100 text-blue-800' :
            event.status === EventStatus.InProgress ? 'bg-yellow-100 text-yellow-800' :
            event.status === EventStatus.Completed ? 'bg-green-100 text-green-800' :
            'bg-red-100 text-red-800'
        }`}>{event.status}</span>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto">
       <button onClick={onBack} className="mb-6 text-teal-600 hover:text-teal-800 font-semibold flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            Back
        </button>

      <div className="bg-white shadow-xl rounded-lg p-8">
        <div className="flex flex-col md:flex-row items-center md:items-start gap-8">
          <div className="relative">
            <img src={avatarUrl} alt="User Avatar" className="w-32 h-32 rounded-full object-cover ring-4 ring-teal-200" />
          </div>
          <div className="flex-grow text-center md:text-left">
            {isEditing ? (
              <div className="space-y-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700">Name</label>
                  <input type="text" id="name" value={name} onChange={e => setName(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-teal-500 focus:border-teal-500" />
                </div>
                <div>
                  <label htmlFor="avatarUrl" className="block text-sm font-medium text-gray-700">Avatar URL</label>
                  <input type="text" id="avatarUrl" value={avatarUrl} onChange={e => setAvatarUrl(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-teal-500 focus:border-teal-500" />
                </div>
              </div>
            ) : (
              <div>
                <h2 className="text-3xl font-bold text-gray-800">{profileUser.name}</h2>
                <p className="text-gray-500 mt-1">{profileUser.email}</p>
              </div>
            )}
            <div className="mt-6 flex justify-center md:justify-start gap-4">
              {canEdit && (
                isEditing ? (
                  <>
                    <button onClick={handleSave} disabled={isSaving} className="px-4 py-2 bg-teal-600 text-white font-semibold rounded-lg hover:bg-teal-700 transition duration-300 disabled:opacity-50">
                      {isSaving ? 'Saving...' : 'Save Changes'}
                    </button>
                    <button onClick={() => setIsEditing(false)} className="px-4 py-2 bg-gray-200 text-gray-800 font-semibold rounded-lg hover:bg-gray-300 transition duration-300">
                      Cancel
                    </button>
                  </>
                ) : (
                  <button onClick={() => setIsEditing(true)} className="px-4 py-2 bg-teal-100 text-teal-800 font-semibold rounded-lg hover:bg-teal-200 transition duration-300 flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" />
                          <path fillRule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clipRule="evenodd" />
                      </svg>
                    Edit Profile
                  </button>
                )
              )}
            </div>
          </div>
        </div>
        
        <div className="mt-10 pt-6 border-t border-gray-200 grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
                <h3 className="text-xl font-bold text-gray-800 mb-4">Events Organized ({organizedEvents.length})</h3>
                <div className="space-y-3">
                    {organizedEvents.length > 0 ? 
                        (showAllOrganized ? organizedEvents : organizedEvents.slice(0, EVENT_DISPLAY_LIMIT))
                        .map(event => (
                           <EventListItem key={event.id} event={event}/>
                        )) 
                        : <p className="text-gray-500 italic">{canEdit ? "You haven't organized any events yet." : `${profileUser.name} hasn't organized any events yet.`}</p>
                    }
                </div>
                {organizedEvents.length > EVENT_DISPLAY_LIMIT && (
                    <button 
                        onClick={() => setShowAllOrganized(!showAllOrganized)}
                        className="mt-3 text-sm font-semibold text-teal-600 hover:text-teal-800"
                    >
                        {showAllOrganized ? 'Show Less' : `Show All (${organizedEvents.length})`}
                    </button>
                )}
            </div>
             <div>
                <h3 className="text-xl font-bold text-gray-800 mb-4">Events Attending ({joinedEvents.length})</h3>
                <div className="space-y-3">
                     {joinedEvents.length > 0 ? 
                        (showAllJoined ? joinedEvents : joinedEvents.slice(0, EVENT_DISPLAY_LIMIT))
                        .map(event => (
                            <EventListItem key={event.id} event={event}/>
                        )) 
                        : <p className="text-gray-500 italic">{canEdit ? "You haven't joined any events yet." : `${profileUser.name} hasn't joined any events yet.`}</p>
                    }
                </div>
                {joinedEvents.length > EVENT_DISPLAY_LIMIT && (
                    <button 
                        onClick={() => setShowAllJoined(!showAllJoined)}
                        className="mt-3 text-sm font-semibold text-teal-600 hover:text-teal-800"
                    >
                        {showAllJoined ? 'Show Less' : `Show All (${joinedEvents.length})`}
                    </button>
                )}
            </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;