import { useRouter } from 'expo-router';
import React, { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { ROUTES } from '../configs/routes';
import { useAuth } from '../logic/hooks/useAuth';
import { COLORS, SPACING } from '../ui/theme';
import DevLandingScreen from './DevLandingScreen';
import LoginScreen from './LoginScreen';

const IndexScreen = () => {
  const { session, loading } = useAuth();
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
    return (
      <View style={styles.center}>
        <ActivityIndicator color={COLORS.PRIMARY} />
      </View>
    );
  }

  if (session) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={COLORS.PRIMARY} />
      </View>
    );
  }

  return <LoginScreen />;
};

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.LG,
    backgroundColor: COLORS.BACKGROUND,
  },
});

export default IndexScreen;
