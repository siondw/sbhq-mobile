import { useRouter } from 'expo-router';
import React, { useEffect } from 'react';
import { View } from 'react-native';

import { ROUTES } from '../configs/routes';
import { useDemoMode } from '../logic/contexts/DemoModeContext';
import { useAuth } from '../logic/hooks/useAuth';
import LoadingView from '../ui/components/LoadingView';
import OnboardingModal from '../ui/components/OnboardingModal';
import DevLandingScreen from './DevLandingScreen';
import LoginScreen from './LoginScreen';

const IndexScreen = () => {
  const { session, loading, needsOnboarding, completeOnboarding, error } = useAuth();
  const { shouldShowDemo, startDemo } = useDemoMode();
  const router = useRouter();
  const isDev = __DEV__;

  useEffect(() => {
    if (!isDev && session && !needsOnboarding) {
      if (shouldShowDemo) {
        startDemo();
      } else {
        router.replace(ROUTES.CONTESTS);
      }
    }
  }, [isDev, session, needsOnboarding, shouldShowDemo, startDemo, router]);

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
