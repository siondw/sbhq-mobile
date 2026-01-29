import { useRouter } from 'expo-router';
import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { DEMO_CONTEST_ID } from '../../configs/constants';
import { ROUTES, buildLobbyRoute } from '../../configs/routes';
import DemoOverlay from '../../ui/components/DemoOverlay';

export interface DemoModeContextValue {
  isDemoActive: boolean;
  demoPhase: string | null;
  startDemo: () => void;
  exitDemo: () => void;
  setDemoTip: (tip: string | null) => void;
  setDemoPhase: (phase: string | null) => void;
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
  const router = useRouter();
  const [isDemoActive, setIsDemoActive] = useState(false);
  const [demoTip, setDemoTip] = useState<string | null>(null);
  const [demoPhase, setDemoPhase] = useState<string | null>(null);

  const startDemo = useCallback(() => {
    setIsDemoActive(true);
    router.replace(buildLobbyRoute(DEMO_CONTEST_ID));
  }, [router]);

  const exitDemo = useCallback(() => {
    setIsDemoActive(false);
    setDemoTip(null);
    setDemoPhase(null);
    router.replace(ROUTES.CONTESTS);
  }, [router]);

  const value = useMemo(
    () => ({
      isDemoActive,
      demoPhase,
      startDemo,
      exitDemo,
      setDemoTip,
      setDemoPhase,
    }),
    [isDemoActive, demoPhase, startDemo, exitDemo],
  );

  return (
    <DemoModeContext.Provider value={value}>
      {children}
      {isDemoActive && <DemoOverlay tip={demoTip} phase={demoPhase} onExit={exitDemo} />}
    </DemoModeContext.Provider>
  );
};
