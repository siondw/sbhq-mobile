import type { Session, User } from '@supabase/supabase-js';
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { AppStateStatus } from 'react-native';
import { AppState, Platform } from 'react-native';
import { SUPABASE_CLIENT } from '../../db/client';
import type { UserRow } from '../../db/types';
import { getUserById } from '../../db/users';

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
      void SUPABASE_CLIENT.auth.startAutoRefresh();
    } else {
      void SUPABASE_CLIENT.auth.stopAutoRefresh();
    }
  });

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
        const {
          data: { session: initialSession },
        } = await SUPABASE_CLIENT.auth.getSession();
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

    const { data } = SUPABASE_CLIENT.auth.onAuthStateChange(async (_event, nextSession) => {
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
      data.subscription.unsubscribe();
      appStateSubscription.remove();
    };
  }, [fetchProfile]);

  const loginWithGoogle = useCallback(async () => {
    setError(null);
    const redirectTo = Linking.createURL('/auth/callback');
    console.warn('Starting Google OAuth with redirect:', redirectTo);
    const { data, error: authError } = await SUPABASE_CLIENT.auth.signInWithOAuth({
      provider: 'google',
      options: {
        skipBrowserRedirect: Platform.OS !== 'web',
        redirectTo,
      },
    });
    console.warn('Google OAuth response data:', data);
    if (!authError && data?.url && Platform.OS !== 'web') {
      const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
      console.warn('WebBrowser auth session result:', result);
    }
    if (authError) {
      console.error('Google OAuth error:', authError);
      setError(authError.message);
    }
  }, []);

  const sendEmailOtp = useCallback(async (email: string) => {
    setError(null);
    const { error: authError } = await SUPABASE_CLIENT.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: true,
      },
    });
    if (authError) {
      setError(authError.message);
    }
  }, []);

  const verifyEmailOtp = useCallback(async (email: string, token: string) => {
    setError(null);
    const { error: authError } = await SUPABASE_CLIENT.auth.verifyOtp({
      email,
      token,
      type: 'email',
    });
    if (authError) {
      setError(authError.message);
    }
  }, []);

  const logout = useCallback(async () => {
    setError(null);
    const { error: authError } = await SUPABASE_CLIENT.auth.signOut();
    if (authError) {
      setError(authError.message);
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
    [
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
    ],
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
