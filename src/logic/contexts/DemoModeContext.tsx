import { useRouter } from 'expo-router';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
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
  const { profile, refreshProfile, user } = useAuth();
  const router = useRouter();
  const [isDemoActive, setIsDemoActive] = useState(false);
  const [demoTip, setDemoTip] = useState<string | null>(null);
  const [hasSeenDemoThisSession, setHasSeenDemoThisSession] = useState(false);

  useEffect(() => {
    setHasSeenDemoThisSession(false);
  }, [user?.id]);

  const startDemo = useCallback(() => {
    setHasSeenDemoThisSession(true);

    const userId = user?.id ?? profile?.id;
    if (userId) {
      void (async () => {
        const result = await updateUserProfile(userId, { has_seen_demo: true });
        if (!result.ok) {
          console.error('Failed to update has_seen_demo:', result.error);
          return;
        }
        await refreshProfile();
      })();
    }

    setIsDemoActive(true);
    router.replace(buildLobbyRoute(DEMO_CONTEST_ID));
  }, [profile, refreshProfile, router, user]);

  const exitDemo = useCallback(() => {
    setIsDemoActive(false);
    setDemoTip(null);

    router.replace(ROUTES.CONTESTS);
  }, [router]);

  const shouldShowDemo = useMemo(() => {
    return !hasSeenDemoThisSession && profile?.has_seen_demo !== true;
  }, [hasSeenDemoThisSession, profile]);

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
