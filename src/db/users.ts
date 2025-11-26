import { DB_TABLES } from './constants';
import { SUPABASE_CLIENT } from './client';
import type { UserRow } from './types';

export const getUserById = async (userId: string): Promise<UserRow | null> => {
  const { data, error } = await SUPABASE_CLIENT.from(DB_TABLES.USERS).select('*').eq('id', userId).maybeSingle();

  if (error) {
    throw new Error(`Failed to fetch user ${userId}: ${error.message}`);
  }

  return data ?? null;
};
