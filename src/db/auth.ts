import type {
  AuthChangeEvent,
  OAuthResponse,
  Session,
  SignInWithOAuthCredentials,
  User,
} from '@supabase/supabase-js';
import { SUPABASE_CLIENT } from './client';

export type { AuthChangeEvent, Session, User };

export const getSession = async (): Promise<Session | null> => {
  const {
    data: { session },
    error,
  } = await SUPABASE_CLIENT.auth.getSession();

  if (error) {
    throw new Error(error.message);
  }

  return session;
};

export const onAuthStateChange = (
  callback: (event: AuthChangeEvent, session: Session | null) => void | Promise<void>,
): (() => void) => {
  const { data } = SUPABASE_CLIENT.auth.onAuthStateChange(callback);
  return () => data.subscription.unsubscribe();
};

export const startAutoRefresh = async (): Promise<void> => {
  await SUPABASE_CLIENT.auth.startAutoRefresh();
};

export const stopAutoRefresh = async (): Promise<void> => {
  await SUPABASE_CLIENT.auth.stopAutoRefresh();
};

export const signInWithOAuth = async (
  credentials: SignInWithOAuthCredentials,
): Promise<OAuthResponse['data']> => {
  const { data, error } = await SUPABASE_CLIENT.auth.signInWithOAuth(credentials);

  if (error) {
    throw new Error(error.message);
  }

  return data;
};

export const exchangeCodeForSession = async (authCode: string): Promise<void> => {
  const { error } = await SUPABASE_CLIENT.auth.exchangeCodeForSession(authCode);

  if (error) {
    throw new Error(error.message);
  }
};

export const setSession = async (tokens: {
  access_token: string;
  refresh_token: string;
}): Promise<void> => {
  const { error } = await SUPABASE_CLIENT.auth.setSession(tokens);

  if (error) {
    throw new Error(error.message);
  }
};

export const signInWithOtp = async (email: string): Promise<void> => {
  const { error } = await SUPABASE_CLIENT.auth.signInWithOtp({
    email,
    options: { shouldCreateUser: true },
  });

  if (error) {
    throw new Error(error.message);
  }
};

export const verifyOtp = async (email: string, token: string): Promise<void> => {
  const { error } = await SUPABASE_CLIENT.auth.verifyOtp({
    email,
    token,
    type: 'email',
  });

  if (error) {
    throw new Error(error.message);
  }
};

export const signOut = async (): Promise<void> => {
  const { error } = await SUPABASE_CLIENT.auth.signOut();

  if (error) {
    throw new Error(error.message);
  }
};
