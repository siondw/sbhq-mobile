import type {
  AuthChangeEvent,
  AuthResponse,
  OAuthResponse,
  Session,
  SignInWithOAuthCredentials,
  User,
} from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { ENV } from '../configs/env';
import type { AsyncResult } from '../utils/result';
import { Err, Ok } from '../utils/result';
import { SUPABASE_CLIENT } from './client';
import { authError } from './errors';
import type { DbError } from './errors';

export type { AuthChangeEvent, Session, User };

export const getSession = async (): AsyncResult<Session | null, DbError> => {
  const {
    data: { session },
    error,
  } = await SUPABASE_CLIENT.auth.getSession();

  if (error) {
    return Err(authError(error.message));
  }

  return Ok(session);
};

export const onAuthStateChange = (
  callback: (event: AuthChangeEvent, session: Session | null) => void | Promise<void>,
): (() => void) => {
  const { data } = SUPABASE_CLIENT.auth.onAuthStateChange(callback);
  return () => data.subscription.unsubscribe();
};

export const startAutoRefresh = async (): AsyncResult<void, DbError> => {
  try {
    await SUPABASE_CLIENT.auth.startAutoRefresh();
    return Ok(undefined);
  } catch (error) {
    return Err(authError((error as Error).message));
  }
};

export const stopAutoRefresh = async (): AsyncResult<void, DbError> => {
  try {
    await SUPABASE_CLIENT.auth.stopAutoRefresh();
    return Ok(undefined);
  } catch (error) {
    return Err(authError((error as Error).message));
  }
};

export const signInWithOAuth = async (
  credentials: SignInWithOAuthCredentials,
): AsyncResult<OAuthResponse['data'], DbError> => {
  const { data, error } = await SUPABASE_CLIENT.auth.signInWithOAuth(credentials);

  if (error) {
    return Err(authError(error.message));
  }

  return Ok(data);
};

export const exchangeCodeForSession = async (authCode: string): AsyncResult<void, DbError> => {
  const { error } = await SUPABASE_CLIENT.auth.exchangeCodeForSession(authCode);

  if (error) {
    return Err(authError(error.message));
  }

  return Ok(undefined);
};

export const setSession = async (tokens: {
  access_token: string;
  refresh_token: string;
}): AsyncResult<void, DbError> => {
  const { error } = await SUPABASE_CLIENT.auth.setSession(tokens);

  if (error) {
    return Err(authError(error.message));
  }

  return Ok(undefined);
};

export const signInWithIdToken = async (
  provider: 'apple' | 'google',
  token: string,
): AsyncResult<AuthResponse['data'], DbError> => {
  const { data, error } = await SUPABASE_CLIENT.auth.signInWithIdToken({
    provider,
    token,
  });

  if (error) {
    return Err(authError(error.message));
  }

  return Ok(data);
};

export const signOut = async (): AsyncResult<void, DbError> => {
  const { error } = await SUPABASE_CLIENT.auth.signOut({ scope: 'global' });

  const host = ENV.SUPABASE_URL.replace(/^https?:\/\//, '').split('/')[0];
  const projectRef = host.split('.')[0];
  const storageKey = `sb-${projectRef}-auth-token`;
  const keysToClear = [storageKey, `${storageKey}-code-verifier`, `${storageKey}-user`];

  try {
    if (Platform.OS === 'web') {
      if (typeof localStorage !== 'undefined') {
        keysToClear.forEach((key) => localStorage.removeItem(key));
      }
    } else {
      await Promise.all(keysToClear.map((key) => AsyncStorage.removeItem(key)));
    }
  } catch (storageError) {
    return Err(authError((storageError as Error).message));
  }

  if (error) {
    return Ok(undefined);
  }

  return Ok(undefined);
};
