import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { AppStateStatus } from 'react-native';
import { AppState, Platform } from 'react-native';

import type { Session, User } from '../../db/auth';
import {
  exchangeCodeForSession,
  getSession,
  onAuthStateChange,
  setSession as setSupabaseSession,
  signInWithOAuth,
  signInWithOtp,
  signOut,
  startAutoRefresh,
  stopAutoRefresh,
  verifyOtp,
} from '../../db/auth';
import type { UserRow } from '../../db/types';
import { getUserById } from '../../db/users';

WebBrowser.maybeCompleteAuthSession();

export interface AuthState {
  session: Session | null;
  user: User | null;
  profile: UserRow | null;
  loading: boolean;
  error: string | null;
}

export interface AuthContextValue extends AuthState {
  loginWithGoogle: () => Promise<void>;
  sendEmailOtp: (email: string) => Promise<void>;
  verifyEmailOtp: (email: string, token: string) => Promise<void>;
  logout: () => Promise<void>;
  derivedUser: {
    id: string;
    email: string | null;
    role: UserRow['role'];
    username: string | null;
  } | null;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const startAuthRefreshListeners = () =>
  AppState.addEventListener('change', (state: AppStateStatus) => {
    if (state === 'active') {
      void startAutoRefresh();
    } else {
      void stopAutoRefresh();
    }
  });

const parseAuthCallbackUrl = (url: string) => {
  const parsedUrl = new URL(url);
  const errorDescription =
    parsedUrl.searchParams.get('error_description') ??
    parsedUrl.searchParams.get('error') ??
    parsedUrl.searchParams.get('error_code');

  const code = parsedUrl.searchParams.get('code');

  const hashParams = new URLSearchParams(parsedUrl.hash.replace(/^#/, ''));
  const accessToken = hashParams.get('access_token');
  const refreshToken = hashParams.get('refresh_token');

  return { errorDescription, code, accessToken, refreshToken };
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = useCallback(async (userId: string) => {
    try {
      const nextProfile = await getUserById(userId);
      setProfile(nextProfile);
    } catch (err) {
      setError((err as Error).message);
      setProfile(null);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    const init = async () => {
      try {
        const initialSession = await getSession();
        if (!isMounted) return;
        setSession(initialSession);
        setUser(initialSession?.user ?? null);
        if (initialSession?.user) {
          await fetchProfile(initialSession.user.id);
        }
      } catch (err) {
        if (!isMounted) return;
        setError((err as Error).message);
        setSession(null);
        setUser(null);
        setProfile(null);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    void init();

    const unsubscribe = onAuthStateChange(async (_event, nextSession) => {
      setSession(nextSession);
      setUser(nextSession?.user ?? null);
      if (nextSession?.user) {
        await fetchProfile(nextSession.user.id);
      } else {
        setProfile(null);
      }
    });

    const appStateSubscription = startAuthRefreshListeners();

    return () => {
      isMounted = false;
      unsubscribe();
      appStateSubscription.remove();
    };
  }, [fetchProfile]);

  const loginWithGoogle = useCallback(async () => {
    setError(null);

    if (Platform.OS === 'web') {
      try {
        await signInWithOAuth({
          provider: 'google',
          options: {
            skipBrowserRedirect: false,
          },
        });
      } catch (err) {
        setError((err as Error).message);
      }
      return;
    }

    const redirectTo = Linking.createURL('auth/callback');

    try {
      const data = await signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo,
          skipBrowserRedirect: true,
        },
      });

      if (!data?.url) {
        setError('No auth URL returned from Supabase');
        return;
      }

      const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
      if (result.type !== 'success' || !result.url) {
        setError('Authentication was cancelled or failed');
        return;
      }

      const { errorDescription, code, accessToken, refreshToken } = parseAuthCallbackUrl(result.url);

      if (errorDescription) {
        setError(errorDescription);
        return;
      }

      if (code) {
        await exchangeCodeForSession(code);
        return;
      }

      if (accessToken && refreshToken) {
        await setSupabaseSession({ access_token: accessToken, refresh_token: refreshToken });
        return;
      }

      setError('No auth code returned from Supabase');
    } catch (err) {
      setError((err as Error).message);
    }
  }, []);

  const sendEmailOtp = useCallback(async (email: string) => {
    setError(null);
    try {
      await signInWithOtp(email);
    } catch (err) {
      setError((err as Error).message);
    }
  }, []);

  const verifyEmailOtp = useCallback(async (email: string, token: string) => {
    setError(null);
    try {
      await verifyOtp(email, token);
    } catch (err) {
      setError((err as Error).message);
    }
  }, []);

  const logout = useCallback(async () => {
    setError(null);
    try {
      await signOut();
    } catch (err) {
      setError((err as Error).message);
    }
  }, []);

  const derivedUser = useMemo(() => {
    if (!user) return null;
    return {
      id: user.id,
      email: user.email ?? null,
      role: profile?.role ?? null,
      username: profile?.username ?? null,
    };
  }, [user, profile]);

  const value = useMemo(
    () => ({
      session,
      user,
      profile,
      loading,
      error,
      loginWithGoogle,
      sendEmailOtp,
      verifyEmailOtp,
      logout,
      derivedUser,
    }),
    [session, user, profile, loading, error, loginWithGoogle, sendEmailOtp, verifyEmailOtp, logout, derivedUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextValue => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
