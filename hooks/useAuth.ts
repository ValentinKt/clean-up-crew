import { useState, useEffect } from 'react';
import { User } from '../types';
import { supabase, getPublicProfile } from '../services/supabaseClient';
import { logger } from '../utils/logger';
import { errorHandler, ErrorType } from '../utils/errorHandler';

interface UseAuthReturn {
  currentUser: User | null;
  isLoading: boolean;
  logout: () => Promise<void>;
}

export const useAuth = (): UseAuthReturn => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    logger.info('Setting up auth state listener');
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      logger.info('Auth state changed', { event, hasSession: !!session });
      setIsLoading(true);
      
      if (session?.user) {
        try {
          const profile = await getPublicProfile(session.user.id);
          if (profile) {
            setCurrentUser(profile);
            logger.info('User profile loaded', { userId: profile.id, name: profile.name });
          } else {
            // Profile not found, using auth data
            const fallbackUser: User = {
              id: session.user.id,
              email: session.user.email || '',
              name: session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'User',
              avatarUrl: session.user.user_metadata?.avatar_url || ''
            };
            setCurrentUser(fallbackUser);
            logger.warn('Profile not found, using fallback user data', { userId: fallbackUser.id });
          }
        } catch (error) {
          logger.error('Error fetching profile', { error, userId: session.user.id });
          errorHandler.handleError(error, 'fetchProfile', session.user.id);
          
          // Fallback to basic user from auth data
          const fallbackUser: User = {
            id: session.user.id,
            email: session.user.email || '',
            name: session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'User',
            avatarUrl: session.user.user_metadata?.avatar_url || ''
          };
          setCurrentUser(fallbackUser);
        }
      } else {
        setCurrentUser(null);
        logger.info('User signed out');
      }
      
      setIsLoading(false);
    });

    return () => {
      logger.info('Cleaning up auth state listener');
      subscription.unsubscribe();
    };
  }, []);

  // Handle non-persistent sessions: sign out when tab is hidden/closed if Remember Me is disabled
  useEffect(() => {
    const remember = localStorage.getItem('rememberMe') !== 'false';
    if (!remember) {
      const onVisibilityChange = () => {
        if (document.visibilityState === 'hidden') {
          logger.info('Tab hidden, signing out due to non-persistent session');
          supabase.auth.signOut().catch((error) => {
            logger.error('Error during auto sign out', { error });
          });
        }
      };
      
      document.addEventListener('visibilitychange', onVisibilityChange);
      return () => document.removeEventListener('visibilitychange', onVisibilityChange);
    }
  }, []);

  const logout = async (): Promise<void> => {
    try {
      logger.info('User logout initiated');
      await supabase.auth.signOut();
      setCurrentUser(null);
      logger.info('User logout completed');
    } catch (error) {
      logger.error('Error during logout', { error });
      errorHandler.handleError(error, 'logout');
      throw error;
    }
  };

  return {
    currentUser,
    isLoading,
    logout
  };
};