import type { AsyncResult } from '../utils/result';
import { Err, Ok } from '../utils/result';
import { SUPABASE_CLIENT } from './client';
import { DB_TABLES } from './constants';
import { networkError } from './errors';
import type { DbError } from './errors';
import type { UserRow } from './types';

export const getUserById = async (userId: string): AsyncResult<UserRow | null, DbError> => {
  const { data, error } = await SUPABASE_CLIENT.from(DB_TABLES.USERS)
    .select('*')
    .eq('id', userId)
    .maybeSingle();

  if (error) {
    return Err(networkError(`Failed to fetch user ${userId}: ${error.message}`));
  }

  return Ok((data as UserRow | null) ?? null);
};
