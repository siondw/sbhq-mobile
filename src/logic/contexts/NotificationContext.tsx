import type * as Notifications from 'expo-notifications';
import React, { createContext, useContext } from 'react';

import { usePushNotifications } from '../hooks/usePushNotifications';

export interface NotificationContextValue {
  expoPushToken: string | null;
  permissionStatus: Notifications.NotificationPermissionsStatus | null;
  loading: boolean;
  error: string | null;
  requestPermissions: () => Promise<Notifications.NotificationPermissionsStatus>;
  isRegistered: boolean;
}

const NotificationContext = createContext<NotificationContextValue | null>(null);

export const NotificationProvider = ({ children }: { children: React.ReactNode }) => {
  const notifications = usePushNotifications();

  return (
    <NotificationContext.Provider value={notifications}>{children}</NotificationContext.Provider>
  );
};

export const useNotifications = (): NotificationContextValue => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};
