import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';

export interface NotificationRouteIntent {
  contestId: string;
  path: string;
  receivedAt: number;
}

export interface NotificationRoutingContextValue {
  pendingResultIntent: NotificationRouteIntent | null;
  setPendingResultIntent: (intent: NotificationRouteIntent | null) => void;
  clearPendingResultIntent: () => void;
}

const NotificationRoutingContext = createContext<NotificationRoutingContextValue | null>(null);

export const NotificationRoutingProvider = ({ children }: { children: React.ReactNode }) => {
  const [pendingResultIntent, setPendingResultIntent] = useState<NotificationRouteIntent | null>(
    null,
  );

  const clearPendingResultIntent = useCallback(() => {
    setPendingResultIntent(null);
  }, []);

  const value = useMemo(
    () => ({
      pendingResultIntent,
      setPendingResultIntent,
      clearPendingResultIntent,
    }),
    [pendingResultIntent, clearPendingResultIntent],
  );

  return (
    <NotificationRoutingContext.Provider value={value}>
      {children}
    </NotificationRoutingContext.Provider>
  );
};

export const useNotificationRouting = (): NotificationRoutingContextValue => {
  const context = useContext(NotificationRoutingContext);
  if (!context) {
    throw new Error('useNotificationRouting must be used within a NotificationRoutingProvider');
  }
  return context;
};
