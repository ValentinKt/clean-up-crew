import { useState, useMemo } from 'react';
import { Event, EventStatus } from '../types';

interface DateRange {
  start: string;
  end: string;
}

interface FilterState {
  searchTerm: string;
  dateRange: DateRange;
  selectedStatuses: Set<EventStatus>;
  distanceFilter: number;
}

interface PaginationState {
  upcomingPage: number;
  otherPage: number;
}

interface UseEventFiltersProps {
  events: Event[];
  maxDistance?: number;
  pageSize?: number;
}

interface UseEventFiltersReturn {
  // Filter state
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  dateRange: DateRange;
  setDateRange: (range: DateRange) => void;
  selectedStatuses: Set<EventStatus>;
  setSelectedStatuses: (statuses: Set<EventStatus>) => void;
  distanceFilter: number;
  setDistanceFilter: (distance: number) => void;
  
  // Pagination state
  upcomingPage: number;
  setUpcomingPage: (page: number) => void;
  otherPage: number;
  setOtherPage: (page: number) => void;
  
  // Computed values
  filteredEvents: Event[];
  upcomingEvents: Event[];
  otherEvents: Event[];
  pagedUpcoming: Event[];
  pagedOther: Event[];
  upcomingTotalPages: number;
  otherTotalPages: number;
  hasActiveFilters: boolean;
  
  // Actions
  handleStatusChange: (status: EventStatus) => void;
  resetFilters: () => void;
}

export const useEventFilters = ({ 
  events, 
  maxDistance = 25, 
  pageSize = 6 
}: UseEventFiltersProps): UseEventFiltersReturn => {
  const [searchTerm, setSearchTerm] = useState('');
  const [dateRange, setDateRange] = useState<DateRange>({ start: '', end: '' });
  const [selectedStatuses, setSelectedStatuses] = useState<Set<EventStatus>>(new Set());
  const [distanceFilter, setDistanceFilter] = useState(maxDistance);
  const [upcomingPage, setUpcomingPage] = useState(1);
  const [otherPage, setOtherPage] = useState(1);

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
    setDistanceFilter(maxDistance);
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
    const start = (upcomingPage - 1) * pageSize;
    return upcomingEvents.slice(start, start + pageSize);
  }, [upcomingEvents, upcomingPage, pageSize]);

  const pagedOther = useMemo(() => {
    const start = (otherPage - 1) * pageSize;
    return otherEvents.slice(start, start + pageSize);
  }, [otherEvents, otherPage, pageSize]);

  const upcomingTotalPages = Math.max(1, Math.ceil(upcomingEvents.length / pageSize));
  const otherTotalPages = Math.max(1, Math.ceil(otherEvents.length / pageSize));

  const hasActiveFilters = Boolean(searchTerm || dateRange.start || dateRange.end || selectedStatuses.size > 0 || distanceFilter < maxDistance);

  return {
    // Filter state
    searchTerm,
    setSearchTerm,
    dateRange,
    setDateRange,
    selectedStatuses,
    setSelectedStatuses,
    distanceFilter,
    setDistanceFilter,
    
    // Pagination state
    upcomingPage,
    setUpcomingPage,
    otherPage,
    setOtherPage,
    
    // Computed values
    filteredEvents,
    upcomingEvents,
    otherEvents,
    pagedUpcoming,
    pagedOther,
    upcomingTotalPages,
    otherTotalPages,
    hasActiveFilters,
    
    // Actions
    handleStatusChange,
    resetFilters,
  };
};