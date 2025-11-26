import { useEffect, useMemo, useState, useCallback } from 'react';
import { AppState } from 'react-native';
import type { AppStateStatus } from 'react-native';
import type { Session, User } from '@supabase/supabase-js';
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

export interface UseAuthResult extends AuthState {
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

const startAuthRefreshListeners = () =>
  AppState.addEventListener('change', (state: AppStateStatus) => {
    if (state === 'active') {
      void SUPABASE_CLIENT.auth.startAutoRefresh();
    } else {
      void SUPABASE_CLIENT.auth.stopAutoRefresh();
    }
  });

export const useAuth = (): UseAuthResult => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = useCallback(
    async (userId: string) => {
      try {
        const nextProfile = await getUserById(userId);
        setProfile(nextProfile);
      } catch (err) {
        setError((err as Error).message);
        setProfile(null);
      }
    },
    [setProfile],
  );

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
    const { error: authError } = await SUPABASE_CLIENT.auth.signInWithOAuth({
      provider: 'google',
      options: {
        skipBrowserRedirect: false,
      },
    });
    if (authError) {
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

  return {
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
  };
};

export default useAuth;
