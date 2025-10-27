import React, { useState, useEffect } from 'react';
import { User, Event } from './types';
import Login from './components/Login';
import Header from './components/Header';
import EventList from './components/EventList';
import EventDetail from './components/EventDetail';
import CreateEventForm from './components/CreateEventForm';
import UserProfile from './components/UserProfile';
import { getEventsForUser } from './services/eventService';
import { supabase, getPublicProfile } from './services/supabaseClient';
import { NotificationProvider } from './hooks/useNotifications';
import NotificationContainer from './components/NotificationContainer';

const AppContent: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [view, setView] = useState<'list' | 'detail' | 'create' | 'profile'>('list');
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [selectedProfileUserId, setSelectedProfileUserId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [eventsError, setEventsError] = useState<string | null>(null);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setIsLoading(true);
      
      if (session?.user) {
        try {
          const profile = await getPublicProfile(session.user.id);
          if (profile) {
            setCurrentUser(profile);
          } else {
            // Profile not found, using auth data
            setCurrentUser({
              id: session.user.id,
              email: session.user.email || '',
              name: session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'User',
              avatarUrl: session.user.user_metadata?.avatar_url || ''
            });
          }
        } catch (error) {
          console.error('Error fetching profile:', error);
          // Fallback to basic user from auth data
          setCurrentUser({
            id: session.user.id,
            email: session.user.email || '',
            name: session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'User',
            avatarUrl: session.user.user_metadata?.avatar_url || ''
          });
        }
      } else {
        setCurrentUser(null);
        setEvents([]);
        setIsLoading(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Approximate non-persistent sessions: if Remember Me is disabled, sign out when tab is hidden/closed
  useEffect(() => {
    const remember = localStorage.getItem('rememberMe') !== 'false';
    if (!remember) {
      const onVisibilityChange = () => {
        if (document.visibilityState === 'hidden') {
          supabase.auth.signOut().catch(() => {});
        }
      };
      document.addEventListener('visibilitychange', onVisibilityChange);
      return () => document.removeEventListener('visibilitychange', onVisibilityChange);
    }
  }, []);

  useEffect(() => {
    if (currentUser) {
      setEventsError(null);
      getEventsForUser(currentUser.id)
        .then(userEvents => {
          setEvents(userEvents);
        })
        .catch(error => {
          console.error('Error fetching events:', error);
          setEvents([]); // Fallback to empty array
          setEventsError('We couldn’t load events. Please try again.');
        })
        .finally(() => {
          setIsLoading(false); // Only set main loading to false after events are loaded
        });
    }
  }, [currentUser]);
  
  const handleLogout = async () => {
    await supabase.auth.signOut();
    setCurrentUser(null);
    setView('list');
    setSelectedEventId(null);
  };

  const handleViewDetails = (eventId: string) => {
    setSelectedEventId(eventId);
    setView('detail');
  };

  const handleBackToList = () => {
    setSelectedEventId(null);
    setSelectedProfileUserId(null);
    setView('list');
  };
  
  const handleCreateNewEvent = () => {
      setView('create');
  };

  const handleNavigateToProfile = () => {
    setSelectedProfileUserId(currentUser!.id);
    setView('profile');
  };

  const handleViewUserProfile = (userId: string) => {
    setSelectedProfileUserId(userId);
    setView('profile');
  };

  const handleEventCreated = (newEvent: Event) => {
      setEvents(prevEvents => [newEvent, ...prevEvents].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
      setView('list');
  };

  const handleEventUpdate = async (updatedEvent: Event) => {
    setEvents(events.map(event => event.id === updatedEvent.id ? updatedEvent : event));
    // If we are in detail view, force a re-render of it by re-selecting
    if (view === 'detail') {
      setSelectedEventId(null); // a bit of a hack to force re-render of detail view
      setTimeout(() => setSelectedEventId(updatedEvent.id), 0);
    }
  };

  const handleUserUpdate = (updatedUser: User) => {
    if (currentUser?.id === updatedUser.id) {
        setCurrentUser(updatedUser);
    }
    
    // Ensure data consistency across the app by updating the user's details wherever they appear
    const updatedEvents = events.map(event => {
        const newParticipants = event.participants.map(p => p.id === updatedUser.id ? updatedUser : p);
        const newOrganizer = event.organizer.id === updatedUser.id ? updatedUser : event.organizer;
        const newChat = event.chat.map(c => ({...c, user: c.user.id === updatedUser.id ? updatedUser : c.user}));
        return {...event, participants: newParticipants, organizer: newOrganizer, chat: newChat};
    });
    setEvents(updatedEvents);
  };


  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="text-center p-10">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600 mb-4"></div>
          <div>Loading...</div>
        </div>
      );
    }
    
    if (!currentUser) {
      return <Login />;
    }

    if (view === 'create') {
        return <CreateEventForm currentUser={currentUser} onEventCreated={handleEventCreated} onCancel={handleBackToList} />;
    }

    if (view === 'profile' && selectedProfileUserId) {
      const profileUser = events.flatMap(e => [e.organizer, ...e.participants]).find(u => u.id === selectedProfileUserId) || (currentUser?.id === selectedProfileUserId ? currentUser : null);
      if (profileUser) {
        return <UserProfile 
          profileUser={profileUser}
          currentUser={currentUser} 
          events={events}
          onBack={handleBackToList} 
          onUserUpdate={handleUserUpdate}
          onSelectEvent={handleViewDetails}
        />;
      }
    }

    if (view === 'detail' && selectedEventId) {
      const selectedEvent = events.find(e => e.id === selectedEventId);
      if (selectedEvent) {
        return <EventDetail 
          event={selectedEvent} 
          currentUser={currentUser} 
          onBack={handleBackToList} 
          onEventUpdate={handleEventUpdate}
          onViewProfile={handleViewUserProfile}
        />;
      } else {
        // Event not found - show error and go back to list
        return (
          <div className="text-center py-8">
            <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-6 max-w-md mx-auto">
              <h2 className="text-lg font-semibold mb-2">Event Not Found</h2>
              <p className="mb-4">The event you're looking for could not be found or may have been deleted.</p>
              <button
                onClick={handleBackToList}
                className="px-4 py-2 bg-teal-600 text-white rounded-md hover:bg-teal-700 transition-colors"
              >
                Back to Events
              </button>
            </div>
          </div>
        );
      }
    }
    
    return (
      <>
        {eventsError && (
          <div role="alert" className="mb-4 p-4 bg-red-50 border border-red-200 text-red-800 rounded-lg flex items-center justify-between">
            <span>{eventsError}</span>
            <button
              onClick={() => {
                if (!currentUser) return;
                setIsLoading(true);
                setEventsError(null);
                getEventsForUser(currentUser.id)
                  .then(userEvents => setEvents(userEvents))
                  .catch(err => {
                    console.error('Error fetching events (retry):', err);
                    setEvents([]);
                    setEventsError('Still unable to load events. Please check your connection.');
                  })
                  .finally(() => setIsLoading(false));
              }}
              className="px-4 py-2 bg-teal-600 text-white rounded-md hover:bg-teal-700"
            >
              Retry
            </button>
          </div>
        )}
        <EventList events={events} onSelectEvent={handleViewDetails} currentUser={currentUser} onCreateEvent={handleCreateNewEvent}/>
      </>
    );
  };

  return (
    <div className="min-h-screen bg-teal-50/50">
      {currentUser && <Header user={currentUser} onLogout={handleLogout} onNavigateToProfile={handleNavigateToProfile} />}
      <main className="container mx-auto p-4 md:p-6 lg:p-8">
        {renderContent()}
      </main>
    </div>
  );
};

const App: React.FC = () => (
  <NotificationProvider>
    <AppContent />
    <NotificationContainer />
  </NotificationProvider>
);


export default App;