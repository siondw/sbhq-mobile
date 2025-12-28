import React, { createContext, useContext, useMemo } from 'react';

import { useContestState, type UseContestStateResult } from '../hooks/useContestState';

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
  const contestState = useContestState(contestId, userId);

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

