import * as AppleAuthentication from 'expo-apple-authentication';
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
  signInWithIdToken,
  signInWithOAuth,
  signOut,
  startAutoRefresh,
  stopAutoRefresh,
} from '../../db/auth';
import { getErrorMessage } from '../../db/errors';
import type { UserRow } from '../../db/types';
import { getUserById, updateUserProfile } from '../../db/users';

WebBrowser.maybeCompleteAuthSession();

export interface AuthState {
  session: Session | null;
  user: User | null;
  profile: UserRow | null;
  loading: boolean;
  error: string | null;
}

export interface DerivedUser {
  id: string;
  email: string | null;
  role: UserRow['role'];
  username: string | null;
}

export interface AuthContextValue extends AuthState {
  loginWithGoogle: () => Promise<void>;
  loginWithApple: () => Promise<void>;
  logout: () => Promise<void>;
  derivedUser: DerivedUser | null;
  isOnboardingComplete: boolean;
  needsOnboarding: boolean;
  completeOnboarding: (username: string, phoneNumber: string) => Promise<boolean>;
  refreshProfile: () => Promise<void>;
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
    const result = await getUserById(userId);
    if (result.ok) {
      setProfile(result.value);
    } else {
      setError(getErrorMessage(result.error));
      setProfile(null);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    const init = async () => {
      const result = await getSession();
      if (!isMounted) return;

      if (result.ok) {
        const initialSession = result.value;
        setSession(initialSession);
        setUser(initialSession?.user ?? null);
        if (initialSession?.user) {
          await fetchProfile(initialSession.user.id);
        }
      } else {
        setError(getErrorMessage(result.error));
        setSession(null);
        setUser(null);
        setProfile(null);
      }

      if (isMounted) {
        setLoading(false);
      }
    };

    void init();

    const unsubscribe = onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setUser(nextSession?.user ?? null);
      if (nextSession?.user) {
        void fetchProfile(nextSession.user.id);
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
      const result = await signInWithOAuth({
        provider: 'google',
        options: {
          skipBrowserRedirect: false,
        },
      });
      if (!result.ok) {
        setError(getErrorMessage(result.error));
      }
      return;
    }

    const redirectTo = Linking.createURL('auth/callback');

    const oauthResult = await signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo,
        skipBrowserRedirect: true,
      },
    });

    if (!oauthResult.ok) {
      setError(getErrorMessage(oauthResult.error));
      return;
    }

    const data = oauthResult.value;
    if (!data?.url) {
      setError('No auth URL returned from Supabase');
      return;
    }

    const browserResult = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
    if (browserResult.type !== 'success' || !browserResult.url) {
      setError('Authentication was cancelled or failed');
      return;
    }

    const { errorDescription, code, accessToken, refreshToken } = parseAuthCallbackUrl(
      browserResult.url,
    );

    if (errorDescription) {
      setError(errorDescription);
      return;
    }

    if (code) {
      const codeResult = await exchangeCodeForSession(code);
      if (!codeResult.ok) {
        setError(getErrorMessage(codeResult.error));
      }
      return;
    }

    if (accessToken && refreshToken) {
      const sessionResult = await setSupabaseSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      });
      if (!sessionResult.ok) {
        setError(getErrorMessage(sessionResult.error));
      }
      return;
    }

    setError('No auth code returned from Supabase');
  }, []);

  const loginWithApple = useCallback(async () => {
    setError(null);

    try {
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });

      if (!credential.identityToken) {
        setError('No identity token returned from Apple');
        return;
      }

      const result = await signInWithIdToken('apple', credential.identityToken);
      if (!result.ok) {
        setError(getErrorMessage(result.error));
      }
    } catch (e) {
      const error = e as { code?: string };
      if (error.code === 'ERR_REQUEST_CANCELED') {
        // User cancelled - don't show error
        return;
      }
      setError('Apple sign-in failed');
    }
  }, []);

  const logout = useCallback(async () => {
    setError(null);
    const result = await signOut();
    if (!result.ok) {
      setError(getErrorMessage(result.error));
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

  const isOnboardingComplete = useMemo(() => {
    if (!profile) return false;
    return Boolean(profile.username && profile.phone_number);
  }, [profile]);

  // Show onboarding if profile is incomplete (missing username or phone)
  // Also show if profile is null (user row doesn't exist yet)
  const needsOnboarding = useMemo(() => {
    if (!session) return false;
    if (profile === null) return true;
    return !isOnboardingComplete;
  }, [session, profile, isOnboardingComplete]);

  const refreshProfile = useCallback(async () => {
    if (!user) return;
    await fetchProfile(user.id);
  }, [user, fetchProfile]);

  const completeOnboarding = useCallback(
    async (username: string, phoneNumber: string): Promise<boolean> => {
      if (!user) {
        setError('No user logged in');
        return false;
      }

      setError(null);

      const result = await updateUserProfile(user.id, {
        username,
        phone_number: phoneNumber,
      });

      if (!result.ok) {
        setError(getErrorMessage(result.error));
        return false;
      }

      await fetchProfile(user.id);
      return true;
    },
    [user, fetchProfile],
  );

  const value = useMemo(
    () => ({
      session,
      user,
      profile,
      loading,
      error,
      loginWithGoogle,
      loginWithApple,
      logout,
      derivedUser,
      isOnboardingComplete,
      needsOnboarding,
      completeOnboarding,
      refreshProfile,
    }),
    [
      session,
      user,
      profile,
      loading,
      error,
      loginWithGoogle,
      loginWithApple,
      logout,
      derivedUser,
      isOnboardingComplete,
      needsOnboarding,
      completeOnboarding,
      refreshProfile,
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
