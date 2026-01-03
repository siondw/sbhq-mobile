import React, { createContext, useContext, useEffect, useMemo } from 'react';

import { useContestState, type UseContestStateResult } from '../hooks/useContestState';
import { useDemoContestState } from '../hooks/useDemoContestState';
import { useDemoMode } from './DemoModeContext';

export type ContestStateContextValue = UseContestStateResult & {
  contestId?: string;
  userId?: string;
};

const ContestStateContext = createContext<ContestStateContextValue | null>(null);

export const ContestStateProvider = ({
  contestId,
  userId,
  children,
}: {
  contestId?: string;
  userId?: string;
  children: React.ReactNode;
}) => {
  const { isDemoActive, setDemoTip } = useDemoMode();

  // Call both hooks unconditionally (Rules of Hooks)
  // Pass undefined to the unused hook based on demo mode
  const realState = useContestState(
    isDemoActive ? undefined : contestId,
    isDemoActive ? undefined : userId,
  );
  const demoState = useDemoContestState(
    isDemoActive ? contestId : undefined,
    isDemoActive ? userId : undefined,
  );

  // Select which state to use based on mode
  const contestState = isDemoActive ? demoState : realState;

  useEffect(() => {
    if (!isDemoActive) {
      setDemoTip(null);
      return;
    }
    setDemoTip(demoState.demoTip);
  }, [demoState.demoTip, isDemoActive, setDemoTip]);

  const value = useMemo(
    () => ({
      ...contestState,
      contestId,
      userId,
    }),
    [contestState, contestId, userId],
  );

  return <ContestStateContext.Provider value={value}>{children}</ContestStateContext.Provider>;
};

export const useContestData = (): ContestStateContextValue => {
  const context = useContext(ContestStateContext);
  if (!context) {
    throw new Error('useContestData must be used within a ContestStateProvider');
  }
  return context;
};
