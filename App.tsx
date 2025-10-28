import React from 'react';
import { User, Event } from './types';
import Login from './components/Login';
import Header from './components/Header';
import EventList from './components/EventList';
import EventDetail from './components/EventDetail';
import CreateEventForm from './components/CreateEventForm';
import UserProfile from './components/UserProfile';
import { useAuth } from './hooks/useAuth';
import { useNavigation } from './hooks/useNavigation';
import { useEvents } from './hooks/useEvents';
import { NotificationProvider } from './hooks/useNotifications';
import NotificationContainer from './components/NotificationContainer';

const AppContent: React.FC = () => {
  const { currentUser, isLoading: authLoading, logout } = useAuth();
  const { 
    view, 
    selectedEventId, 
    selectedProfileUserId, 
    navigateToList, 
    navigateToDetail, 
    navigateToCreate, 
    navigateToProfile, 
    navigateBack 
  } = useNavigation();
  const { 
    events, 
    isLoading: eventsLoading, 
    eventsError, 
    refreshEvents, 
    addEvent, 
    updateEvent, 
    updateUserInEvents 
  } = useEvents(currentUser);

  const isLoading = authLoading || eventsLoading;

  const handleEventCreated = (newEvent: Event) => {
    addEvent(newEvent);
    navigateToList();
  };

  const handleEventUpdate = async (updatedEvent: Event) => {
    updateEvent(updatedEvent);
    // If we are in detail view, force a re-render of it by re-selecting
    if (view === 'detail') {
      navigateToDetail(updatedEvent.id);
    }
  };

  const handleUserUpdate = (updatedUser: User) => {
    updateUserInEvents(updatedUser);
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
      return (
        <CreateEventForm 
          currentUser={currentUser} 
          onEventCreated={handleEventCreated} 
          onCancel={navigateToList} 
        />
      );
    }

    if (view === 'profile' && selectedProfileUserId) {
      const profileUser = events
        .flatMap(e => [e.organizer, ...e.participants])
        .find(u => u.id === selectedProfileUserId) || 
        (currentUser?.id === selectedProfileUserId ? currentUser : null);
      
      if (profileUser) {
        return (
          <UserProfile 
            profileUser={profileUser}
            currentUser={currentUser} 
            events={events}
            onBack={navigateToList} 
            onUserUpdate={handleUserUpdate}
            onSelectEvent={navigateToDetail}
          />
        );
      }
    }

    if (view === 'detail' && selectedEventId) {
      const selectedEvent = events.find(e => e.id === selectedEventId);
      if (selectedEvent) {
        return (
          <EventDetail 
            event={selectedEvent} 
            currentUser={currentUser} 
            onBack={navigateToList} 
            onEventUpdate={handleEventUpdate}
            onViewProfile={navigateToProfile}
          />
        );
      } else {
        // Event not found - show error and go back to list
        return (
          <div className="text-center py-8">
            <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-6 max-w-md mx-auto">
              <h2 className="text-lg font-semibold mb-2">Event Not Found</h2>
              <p className="mb-4">The event you're looking for could not be found or may have been deleted.</p>
              <button
                onClick={navigateToList}
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
              onClick={refreshEvents}
              className="px-4 py-2 bg-teal-600 text-white rounded-md hover:bg-teal-700"
            >
              Retry
            </button>
          </div>
        )}
        <EventList 
          events={events} 
          onSelectEvent={navigateToDetail} 
          currentUser={currentUser} 
          onCreateEvent={navigateToCreate}
        />
      </>
    );
  };

  return (
    <div className="min-h-screen bg-teal-50/50">
      {currentUser && (
        <Header 
          user={currentUser} 
          onLogout={logout} 
          onNavigateToProfile={() => navigateToProfile(currentUser.id)} 
        />
      )}
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