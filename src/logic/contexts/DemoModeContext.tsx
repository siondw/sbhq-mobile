import { useRouter } from 'expo-router';
import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { DEMO_CONTEST_ID } from '../../configs/constants';
import { ROUTES, buildLobbyRoute } from '../../configs/routes';
import { updateUserProfile } from '../../db/users';
import DemoOverlay from '../../ui/components/DemoOverlay';
import { useAuth } from '../hooks/useAuth';

export interface DemoModeContextValue {
  isDemoActive: boolean;
  startDemo: () => void;
  exitDemo: () => void;
  shouldShowDemo: boolean;
  setDemoTip: (tip: string | null) => void;
}

const DemoModeContext = createContext<DemoModeContextValue | undefined>(undefined);

export const useDemoMode = (): DemoModeContextValue => {
  const context = useContext(DemoModeContext);
  if (!context) {
    throw new Error('useDemoMode must be used within DemoModeProvider');
  }
  return context;
};

export const DemoModeProvider = ({ children }: { children: React.ReactNode }) => {
  const { profile, refreshProfile } = useAuth();
  const router = useRouter();
  const [isDemoActive, setIsDemoActive] = useState(false);
  const [demoTip, setDemoTip] = useState<string | null>(null);

  const startDemo = useCallback(() => {
    setIsDemoActive(true);
    router.replace(buildLobbyRoute(DEMO_CONTEST_ID));
  }, [router]);

  const exitDemo = useCallback(async () => {
    setIsDemoActive(false);
    setDemoTip(null);

    if (profile?.id) {
      await updateUserProfile(profile.id, { has_seen_demo: true });
      await refreshProfile();
    }

    router.replace(ROUTES.CONTESTS);
  }, [profile, router, refreshProfile]);

  const shouldShowDemo = useMemo(() => {
    return profile?.has_seen_demo !== true;
  }, [profile]);

  const value = useMemo(
    () => ({
      isDemoActive,
      startDemo,
      exitDemo,
      shouldShowDemo,
      setDemoTip,
    }),
    [isDemoActive, startDemo, exitDemo, shouldShowDemo],
  );

  return (
    <DemoModeContext.Provider value={value}>
      {children}
      {isDemoActive && <DemoOverlay tip={demoTip} />}
    </DemoModeContext.Provider>
  );
};
