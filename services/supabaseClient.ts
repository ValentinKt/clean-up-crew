/// <reference types="vite/client" />
import { createClient } from '@supabase/supabase-js';
import { User } from '../types';

// Environment variables for Vite (must be prefixed with VITE_)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "https://bshbpfgjgwqocczlzztb.supabase.co";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJzaGJwZmdqZ3dxb2Njemx6enRiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAwOTcxOTcsImV4cCI6MjA3NTY3MzE5N30.HXb0XvfXRtrcOA1030egkvlX-g3kwINdIlglWZ_bzIM";

// Create Supabase client with explicit schema configuration
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  db: {
    // Align with PostgREST exposed schema configuration
    schema: 'api'
  },
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
});

// Helper function to get the full user profile from the public table.
// Supabase auth.user() provides only auth-related data.
export const getPublicProfile = async (userId: string): Promise<User | null> => {
    try {
        const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('id', userId)
            .single();

        if (error) {
            console.error('Error fetching user profile:', error);
            // If the table doesn't exist or schema issue, return a basic user object
            if (error.code === 'PGRST106' || error.code === '42P01') {
                const { data: { user } } = await supabase.auth.getUser();
                if (user && user.id === userId) {
                    return {
                        id: user.id,
                        email: user.email || '',
                        name: user.user_metadata?.name || user.email?.split('@')[0] || 'User',
                        avatarUrl: user.user_metadata?.avatar_url || ''
                    };
                }
            }
            return null;
        }
        
        return data;
    } catch (error) {
        console.error('Unexpected error fetching user profile:', error);
        return null;
    }
}