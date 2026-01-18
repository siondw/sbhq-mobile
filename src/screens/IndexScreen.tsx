import { useRouter } from 'expo-router';
import React, { useEffect } from 'react';
import { View } from 'react-native';

import { ROUTES } from '../configs/routes';
import { useAuth } from '../logic/hooks/useAuth';
import LoadingView from '../ui/components/LoadingView';
import OnboardingModal from '../ui/components/OnboardingModal';
import DevLandingScreen from './DevLandingScreen';
import LoginScreen from './LoginScreen';

const IndexScreen = () => {
  const { session, loading, needsOnboarding, completeOnboarding, error } = useAuth();
  const router = useRouter();
  const isDev = __DEV__;

  useEffect(() => {
    if (!isDev && session && !needsOnboarding) {
      router.replace(ROUTES.CONTESTS);
    }
  }, [isDev, session, needsOnboarding, router]);

  if (loading) {
    return <LoadingView />;
  }

  if (!session) {
    return <LoginScreen />;
  }

  if (needsOnboarding) {
    return (
      <View style={{ flex: 1 }}>
        <LoginScreen />
        <OnboardingModal visible={true} onComplete={completeOnboarding} error={error} />
      </View>
    );
  }

  if (isDev) {
    return <DevLandingScreen />;
  }

  return <LoadingView />;
};

export default IndexScreen;
