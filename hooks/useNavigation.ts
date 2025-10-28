import { useState } from 'react';
import { logger } from '../utils/logger';

export type ViewType = 'list' | 'detail' | 'create' | 'profile';

interface UseNavigationReturn {
  view: ViewType;
  selectedEventId: string | null;
  selectedProfileUserId: string | null;
  navigateToList: () => void;
  navigateToDetail: (eventId: string) => void;
  navigateToCreate: () => void;
  navigateToProfile: (userId: string) => void;
  navigateBack: () => void;
}

export const useNavigation = (): UseNavigationReturn => {
  const [view, setView] = useState<ViewType>('list');
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [selectedProfileUserId, setSelectedProfileUserId] = useState<string | null>(null);

  const navigateToList = () => {
    logger.info('Navigating to event list');
    setSelectedEventId(null);
    setSelectedProfileUserId(null);
    setView('list');
  };

  const navigateToDetail = (eventId: string) => {
    logger.info('Navigating to event detail', { eventId });
    setSelectedEventId(eventId);
    setView('detail');
  };

  const navigateToCreate = () => {
    logger.info('Navigating to create event form');
    setView('create');
  };

  const navigateToProfile = (userId: string) => {
    logger.info('Navigating to user profile', { userId });
    setSelectedProfileUserId(userId);
    setView('profile');
  };

  const navigateBack = () => {
    logger.info('Navigating back to list');
    navigateToList();
  };

  return {
    view,
    selectedEventId,
    selectedProfileUserId,
    navigateToList,
    navigateToDetail,
    navigateToCreate,
    navigateToProfile,
    navigateBack
  };
};