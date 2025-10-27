import { supabase, getPublicProfile } from './supabaseClient';
import { User } from '../types';

export const updateUser = async (userId: string, updates: Partial<Pick<User, 'name' | 'avatarUrl'>>): Promise<User | undefined> => {
  const { data, error } = await supabase
    .from('users')
    .update({ name: updates.name, avatar_url: updates.avatarUrl })
    .eq('id', userId)
    .select()
    .single();

  if (error) {
    console.error("Error updating user:", error);
    return undefined;
  }
  return data as User;
};

// createUser is now handled by Supabase Auth triggers (see SQL in Supabase dashboard)
// No need for a client-side createUser function for the `users` table.

export const getUserById = async (id: string): Promise<User | undefined> => {
    const user = await getPublicProfile(id);
    return user || undefined;
};
