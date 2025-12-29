import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';

import { getErrorMessage } from '../../db/errors';
import { clearPushToken, updatePushToken } from '../../db/users';
import {
  DEFAULT_NOTIFICATION_CHANNEL_ID,
  DEFAULT_NOTIFICATION_CHANNEL_NAME,
} from '../notifications';
import { useAuth } from './useAuth';

const getExpoProjectId = (): string | undefined => {
  const easProjectId = Constants.easConfig?.projectId;
  if (typeof easProjectId === 'string') {
    return easProjectId;
  }

  const extraProjectId = (Constants.expoConfig?.extra as { eas?: { projectId?: unknown } })?.eas
    ?.projectId;
  if (typeof extraProjectId === 'string') {
    return extraProjectId;
  }

  return undefined;
};

const isPermissionGranted = (settings: Notifications.NotificationPermissionsStatus) => {
  if (settings.granted) {
    return true;
  }

  const iosStatus = settings.ios?.status;
  return (
    iosStatus === Notifications.IosAuthorizationStatus.AUTHORIZED ||
    iosStatus === Notifications.IosAuthorizationStatus.PROVISIONAL ||
    iosStatus === Notifications.IosAuthorizationStatus.EPHEMERAL
  );
};

export const usePushNotifications = () => {
  const { user } = useAuth();
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
  const [permissionStatus, setPermissionStatus] =
    useState<Notifications.NotificationPermissionsStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRegistered, setIsRegistered] = useState(false);

  const lastUserIdRef = useRef<string | null>(null);

  const ensureAndroidChannel = useCallback(async () => {
    if (Platform.OS !== 'android') {
      return;
    }

    await Notifications.setNotificationChannelAsync(DEFAULT_NOTIFICATION_CHANNEL_ID, {
      name: DEFAULT_NOTIFICATION_CHANNEL_NAME,
      importance: Notifications.AndroidImportance.MAX,
    });
  }, []);

  const getExpoPushToken = useCallback(async () => {
    if (!Device.isDevice) {
      setError('Push notifications require a physical device');
      return null;
    }

    const projectId = getExpoProjectId();
    if (!projectId) {
      setError('Missing Expo project id for push notifications');
      return null;
    }

    try {
      await ensureAndroidChannel();
      const token = await Notifications.getExpoPushTokenAsync({ projectId });
      return token.data;
    } catch {
      setError('Failed to fetch Expo push token');
      return null;
    }
  }, [ensureAndroidChannel]);

  const registerToken = useCallback(
    async (
      tokenOverride?: string,
      permissionOverride?: Notifications.NotificationPermissionsStatus,
    ) => {
      setError(null);

      if (!user?.id) {
        setIsRegistered(false);
        return;
      }

      const settings =
        permissionOverride ?? permissionStatus ?? (await Notifications.getPermissionsAsync());
      setPermissionStatus(settings);

      if (!isPermissionGranted(settings)) {
        setIsRegistered(false);
        return;
      }

      const token = tokenOverride ?? (await getExpoPushToken());
      if (!token) {
        setIsRegistered(false);
        return;
      }

      const result = await updatePushToken(user.id, token);
      if (!result.ok) {
        setError(getErrorMessage(result.error));
        setIsRegistered(false);
        return;
      }

      setExpoPushToken(token);
      setIsRegistered(true);
    },
    [user?.id, permissionStatus, getExpoPushToken],
  );

  const refreshPermissions = useCallback(async () => {
    setLoading(true);
    try {
      const settings = await Notifications.getPermissionsAsync();
      setPermissionStatus(settings);

      if (isPermissionGranted(settings)) {
        await registerToken(undefined, settings);
      }

      return settings;
    } finally {
      setLoading(false);
    }
  }, [registerToken]);

  const requestPermissions = useCallback(async () => {
    setError(null);
    await ensureAndroidChannel();

    const settings = await Notifications.requestPermissionsAsync({
      ios: {
        allowAlert: true,
        allowBadge: true,
        allowSound: true,
      },
    });

    setPermissionStatus(settings);

    if (isPermissionGranted(settings)) {
      await registerToken(undefined, settings);
    }

    return settings;
  }, [ensureAndroidChannel, registerToken]);

  useEffect(() => {
    void refreshPermissions();
  }, [refreshPermissions]);

  useEffect(() => {
    const currentUserId = user?.id ?? null;
    if (currentUserId) {
      lastUserIdRef.current = currentUserId;
      return;
    }

    const previousUserId = lastUserIdRef.current;
    if (!previousUserId) {
      return;
    }

    lastUserIdRef.current = null;
    setExpoPushToken(null);
    setIsRegistered(false);

    void clearPushToken(previousUserId).then((result) => {
      if (!result.ok) {
        setError(getErrorMessage(result.error));
      }
    });
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id) {
      return;
    }

    if (!permissionStatus || !isPermissionGranted(permissionStatus)) {
      return;
    }

    if (isRegistered && expoPushToken) {
      return;
    }

    void registerToken(expoPushToken ?? undefined, permissionStatus);
  }, [user?.id, permissionStatus, expoPushToken, isRegistered, registerToken]);

  useEffect(() => {
    // When the native device token (APNs/FCM) changes, we need to re-register.
    // Note: The callback receives the native token, but we need the Expo token,
    // so we call registerToken() without arguments to fetch a fresh Expo token.
    const pushTokenListener = Notifications.addPushTokenListener(() => {
      void registerToken();
    });

    return () => {
      pushTokenListener.remove();
    };
  }, [registerToken]);

  return {
    expoPushToken,
    permissionStatus,
    loading,
    error,
    requestPermissions,
    isRegistered,
  };
};
