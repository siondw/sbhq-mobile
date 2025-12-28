import { useRouter } from 'expo-router';
import React, { useEffect } from 'react';
import { StyleSheet } from 'react-native';

import { ROUTES } from '../configs/routes';
import { useAuth } from '../logic/hooks/useAuth';
import LoadingView from '../ui/components/LoadingView';
import { SPACING, useTheme } from '../ui/theme';
import DevLandingScreen from './DevLandingScreen';
import LoginScreen from './LoginScreen';

const IndexScreen = () => {
  const { session, loading } = useAuth();
  const { colors } = useTheme();
  const router = useRouter();
  const isDev = __DEV__;

  useEffect(() => {
    if (!isDev && session) {
      router.replace(ROUTES.CONTESTS);
    }
  }, [isDev, session, router]);

  if (isDev) {
    return <DevLandingScreen />;
  }

  if (loading) {
    return <LoadingView />;
  }

  if (session) {
    return <LoadingView />;
  }

  return <LoginScreen />;
};

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.LG,
  },
});

export default IndexScreen;
