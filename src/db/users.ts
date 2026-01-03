import type { AsyncResult } from '../utils/result';
import { Err, Ok } from '../utils/result';
import { SUPABASE_CLIENT } from './client';
import { DB_TABLES } from './constants';
import { networkError, validationError } from './errors';
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

export const checkUsernameAvailable = async (username: string): AsyncResult<boolean, DbError> => {
  const { data, error } = await SUPABASE_CLIENT.rpc('check_username_available', {
    requested_username: username,
  });

  if (error) {
    return Err(networkError(`Failed to check username: ${error.message}`));
  }

  return Ok(data);
};

export interface OnboardingData {
  username?: string;
  phone_number?: string;
  has_seen_demo?: boolean;
}

export const updateUserProfile = async (
  userId: string,
  data: OnboardingData,
): AsyncResult<void, DbError> => {
  const upsertPayload: Record<string, unknown> = {
    id: userId,
    updated_at: new Date().toISOString(),
  };

  if (data.username !== undefined) upsertPayload.username = data.username;
  if (data.phone_number !== undefined) upsertPayload.phone_number = data.phone_number;
  if (data.has_seen_demo !== undefined) upsertPayload.has_seen_demo = data.has_seen_demo;

  const { error } = await SUPABASE_CLIENT.from(DB_TABLES.USERS)
    .upsert(upsertPayload, { onConflict: 'id' });

  if (error) {
    if (error.code === '23505') {
      return Err(validationError('username', 'Username is already taken'));
    }
    return Err(networkError(`Failed to update profile: ${error.message}`));
  }

  return Ok(undefined);
};

export const updatePushToken = async (
  userId: string,
  token: string,
): AsyncResult<UserRow, DbError> => {
  const { data, error } = await SUPABASE_CLIENT.from(DB_TABLES.USERS)
    .update({
      expo_push_token: token,
      push_token_updated_at: new Date().toISOString(),
    })
    .eq('id', userId)
    .select('*')
    .single();

  if (error) {
    return Err(networkError(`Failed to update push token: ${error.message}`));
  }

  return Ok(data as UserRow);
};

export const clearPushToken = async (userId: string): AsyncResult<void, DbError> => {
  const { error } = await SUPABASE_CLIENT.from(DB_TABLES.USERS)
    .update({
      expo_push_token: null,
      push_token_updated_at: new Date().toISOString(),
    })
    .eq('id', userId);

  if (error) {
    return Err(networkError(`Failed to clear push token: ${error.message}`));
  }

  return Ok(undefined);
};
