import React, { useState, useMemo } from 'react';
import { Event, User, EventStatus } from '../types';
import EventCard from './EventCard';

interface EventListProps {
  events: Event[];
  onSelectEvent: (eventId: string) => void;
  currentUser: User;
  onCreateEvent: () => void;
}

const allStatuses = Object.values(EventStatus);
const MAX_DISTANCE = 25; // max distance in km

const EventList: React.FC<EventListProps> = ({ events, onSelectEvent, currentUser, onCreateEvent }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [selectedStatuses, setSelectedStatuses] = useState<Set<EventStatus>>(new Set());
  const [distanceFilter, setDistanceFilter] = useState(MAX_DISTANCE);
  const [upcomingPage, setUpcomingPage] = useState(1);
  const [otherPage, setOtherPage] = useState(1);
  const PAGE_SIZE = 6;

  const handleStatusChange = (status: EventStatus) => {
    setSelectedStatuses(prev => {
      const newSet = new Set(prev);
      if (newSet.has(status)) {
        newSet.delete(status);
      } else {
        newSet.add(status);
      }
      return newSet;
    });
  };

  const resetFilters = () => {
    setSearchTerm('');
    setDateRange({ start: '', end: '' });
    setSelectedStatuses(new Set());
    setDistanceFilter(MAX_DISTANCE);
  };

  const filteredEvents = useMemo(() => {
    const lowerCaseSearchTerm = searchTerm.toLowerCase();
    const startDate = dateRange.start ? new Date(dateRange.start) : null;
    // Set end date to the end of the day for inclusive filtering
    const endDate = dateRange.end ? new Date(dateRange.end) : null;
    if (endDate) endDate.setHours(23, 59, 59, 999);

    return events.filter(event => {
      // Search term filter
      if (searchTerm &&
          !event.title.toLowerCase().includes(lowerCaseSearchTerm) &&
          !event.location.address.toLowerCase().includes(lowerCaseSearchTerm)
      ) {
        return false;
      }

      // Date range filter
      const eventDate = new Date(event.date);
      if (startDate && eventDate < startDate) {
        return false;
      }
      if (endDate && eventDate > endDate) {
        return false;
      }

      // Status filter
      if (selectedStatuses.size > 0 && !selectedStatuses.has(event.status)) {
        return false;
      }
      
      // Distance filter
      if (event.distance > distanceFilter) {
          return false;
      }

      return true;
    });
  }, [events, searchTerm, dateRange, selectedStatuses, distanceFilter]);
  
  const upcomingEvents = useMemo(() => {
    return filteredEvents
      .filter(event => event.status === EventStatus.Upcoming)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [filteredEvents]);

  const otherEvents = useMemo(() => {
    return filteredEvents
      .filter(event => event.status !== EventStatus.Upcoming)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [filteredEvents]);

  const pagedUpcoming = useMemo(() => {
    const start = (upcomingPage - 1) * PAGE_SIZE;
    return upcomingEvents.slice(start, start + PAGE_SIZE);
  }, [upcomingEvents, upcomingPage]);

  const pagedOther = useMemo(() => {
    const start = (otherPage - 1) * PAGE_SIZE;
    return otherEvents.slice(start, start + PAGE_SIZE);
  }, [otherEvents, otherPage]);

  const upcomingTotalPages = Math.max(1, Math.ceil(upcomingEvents.length / PAGE_SIZE));
  const otherTotalPages = Math.max(1, Math.ceil(otherEvents.length / PAGE_SIZE));

  const hasActiveFilters = searchTerm || dateRange.start || dateRange.end || selectedStatuses.size > 0 || distanceFilter < MAX_DISTANCE;

  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-800">Community Cleanups</h2>
          <p className="text-gray-600 mt-1">Find an event near you or create your own.</p>
        </div>
        <button
            onClick={onCreateEvent}
            className="w-full md:w-auto bg-teal-600 text-white font-semibold py-2 px-6 rounded-lg hover:bg-teal-700 transition duration-300 shadow-md flex items-center justify-center"
        >
             <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
            Create Event
        </button>
      </div>

       <div className="bg-white p-6 rounded-lg shadow-lg mb-8">
        <details open>
          <summary className="text-xl font-bold text-teal-800 cursor-pointer list-none flex justify-between items-center">
            Filter Events
            <svg className="w-5 h-5 transition-transform duration-200 transform details-arrow" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </summary>
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 border-t pt-4">
            <div className="md:col-span-2 lg:col-span-4">
              <label htmlFor="search" className="block text-sm font-medium text-gray-700">Search by Title or Location</label>
              <input type="text" id="search" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="e.g., Riverside Park..." className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-teal-500 focus:border-teal-500"/>
            </div>

            <div>
              <label htmlFor="start-date" className="block text-sm font-medium text-gray-700">Start Date</label>
              <input type="date" id="start-date" value={dateRange.start} onChange={e => setDateRange({ ...dateRange, start: e.target.value })} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-teal-500 focus:border-teal-500"/>
            </div>
            <div>
              <label htmlFor="end-date" className="block text-sm font-medium text-gray-700">End Date</label>
              <input type="date" id="end-date" value={dateRange.end} min={dateRange.start} onChange={e => setDateRange({ ...dateRange, end: e.target.value })} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-teal-500 focus:border-teal-500"/>
            </div>
            
            <div className="md:col-span-2 lg:col-span-4">
              <label className="block text-sm font-medium text-gray-700">Status</label>
              <div className="mt-2 flex flex-wrap gap-x-4 gap-y-2">
                {allStatuses.map(status => (
                  <label key={status} className="inline-flex items-center">
                    <input type="checkbox" checked={selectedStatuses.has(status)} onChange={() => handleStatusChange(status)} className="h-4 w-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500"/>
                    <span className="ml-2 text-gray-700">{status}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="md:col-span-2 lg:col-span-4">
              <label htmlFor="distance" className="block text-sm font-medium text-gray-700">Max Distance: <span className="font-bold text-teal-600">{distanceFilter} km</span></label>
              <input type="range" id="distance" min="1" max={MAX_DISTANCE} value={distanceFilter} onChange={e => setDistanceFilter(Number(e.target.value))} className="mt-1 w-full accent-teal-600"/>
            </div>

            <div className="md:col-span-2 lg:col-span-4 flex justify-end">
              <button onClick={resetFilters} className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500">
                Reset Filters
              </button>
            </div>
          </div>
        </details>
      </div>
      
      {hasActiveFilters && (
        <div className="mb-8 text-center p-4 bg-teal-50 border border-teal-200 rounded-lg">
            <p className="text-teal-800 font-semibold">Showing {filteredEvents.length} event(s) matching your filters.</p>
        </div>
      )}

      {/* Empty state when absolutely no events exist */}
      {events.length === 0 && (
        <div className="mt-6">
          <div className="flex flex-col items-center justify-center text-center bg-white p-8 rounded-xl shadow-lg border border-teal-100">
            <svg className="w-12 h-12 text-teal-600 mb-3" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a10 10 0 100 20 10 10 0 000-20zm1 10h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H8a1 1 0 110-2h3V9a1 1 0 112 0v3z"/></svg>
            <h3 className="text-2xl font-bold text-gray-800">No events</h3>
            <p className="text-gray-600 mt-2 max-w-md">Kickstart your community cleanup by creating the first event. It takes just a minute!</p>
            <button
              onClick={onCreateEvent}
              className="mt-6 bg-teal-600 text-white font-semibold py-2 px-6 rounded-lg hover:bg-teal-700 transition duration-300 shadow-md"
            >
              Create new event
            </button>
          </div>
        </div>
      )}

      {events.length > 0 && (
      <section>
        <h3 className="text-2xl font-bold text-gray-800 border-b-2 border-teal-200 pb-2 mb-4">Upcoming Events</h3>
        {upcomingEvents.length > 0 ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" data-testid="upcoming-grid">
                  {pagedUpcoming.map(event => (
                  <EventCard key={event.id} event={event} onSelectEvent={onSelectEvent} currentUser={currentUser} />
                  ))}
              </div>
              
              <div className="flex items-center justify-center gap-4 mt-6">
                <button
                  aria-label="Previous page"
                  disabled={upcomingPage === 1}
                  onClick={() => setUpcomingPage(p => Math.max(1, p - 1))}
                  className="px-3 py-1 border rounded disabled:opacity-50"
                >Prev</button>
                <span className="text-sm text-gray-600">Page {upcomingPage} of {upcomingTotalPages}</span>
                <button
                  aria-label="Next page"
                  disabled={upcomingPage >= upcomingTotalPages}
                  onClick={() => setUpcomingPage(p => Math.min(upcomingTotalPages, p + 1))}
                  className="px-3 py-1 border rounded disabled:opacity-50"
                >Next</button>
              </div>
            </>
        ) : (
            <p className="text-gray-500 italic">No upcoming events match your filters. Try expanding your search criteria.</p>
        )}
      </section>
      )}

      {events.length > 0 && (
      <section className="mt-12">
        <h3 className="text-2xl font-bold text-gray-800 border-b-2 border-teal-200 pb-2 mb-4">Past & Active Events</h3>
         {otherEvents.length > 0 ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" data-testid="other-grid">
                  {pagedOther.map(event => (
                      <EventCard key={event.id} event={event} onSelectEvent={onSelectEvent} currentUser={currentUser}/>
                  ))}
              </div>
              <div className="flex items-center justify-center gap-4 mt-6">
                <button
                  aria-label="Previous page"
                  disabled={otherPage === 1}
                  onClick={() => setOtherPage(p => Math.max(1, p - 1))}
                  className="px-3 py-1 border rounded disabled:opacity-50"
                >Prev</button>
                <span className="text-sm text-gray-600">Page {otherPage} of {otherTotalPages}</span>
                <button
                  aria-label="Next page"
                  disabled={otherPage >= otherTotalPages}
                  onClick={() => setOtherPage(p => Math.min(otherTotalPages, p + 1))}
                  className="px-3 py-1 border rounded disabled:opacity-50"
                >Next</button>
              </div>
            </>
          ) : (
            <p className="text-gray-500 italic">No past or active events match your filters.</p>
         )}
      </section>
      )}
      <style>{`
        details > summary {
            list-style: none;
        }
        details > summary::-webkit-details-marker {
            display: none;
        }
        details[open] .details-arrow {
            transform: rotate(180deg);
        }
      `}</style>
    </div>
  );
};

export default EventList;