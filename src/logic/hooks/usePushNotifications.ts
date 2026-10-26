import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, Platform } from 'react-native';

import { getErrorMessage } from '../../db/errors';
import { clearPushToken, updatePushToken } from '../../db/users';
import { Err, Ok } from '../../utils/result';
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
  const registrationScopeRef = useRef<{
    userId: string | null;
    registering: boolean;
  } | null>(null);

  useEffect(() => {
    const currentUserId = user?.id ?? null;
    const scope = { userId: currentUserId, registering: false };
    registrationScopeRef.current = scope;
    setExpoPushToken(null);
    setIsRegistered(false);
    setError(null);

    const previousUserId = lastUserIdRef.current;
    lastUserIdRef.current = currentUserId;

    if (!currentUserId && previousUserId) {
      void clearPushToken(previousUserId).then((result) => {
        if (registrationScopeRef.current === scope && !result.ok) {
          setError(getErrorMessage(result.error));
        }
      });
    }

    return () => {
      registrationScopeRef.current = null;
    };
  }, [user?.id]);

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
      return Err('Push notifications require a physical device');
    }

    const projectId = getExpoProjectId();
    if (!projectId) {
      return Err('Missing Expo project id for push notifications');
    }

    try {
      await ensureAndroidChannel();
      const token = await Notifications.getExpoPushTokenAsync({ projectId });
      return Ok(token.data);
    } catch {
      return Err('Failed to fetch Expo push token');
    }
  }, [ensureAndroidChannel]);

  const registerToken = useCallback(
    async (
      tokenOverride?: string,
      permissionOverride?: Notifications.NotificationPermissionsStatus,
    ) => {
      const scope = registrationScopeRef.current;
      if (!scope || scope.userId !== (user?.id ?? null) || scope.registering) {
        return;
      }

      setError(null);

      if (!user?.id) {
        setIsRegistered(false);
        return;
      }

      scope.registering = true;

      try {
        const settings = permissionOverride ?? (await Notifications.getPermissionsAsync());
        if (registrationScopeRef.current !== scope) {
          return;
        }
        setPermissionStatus(settings);

        if (!isPermissionGranted(settings)) {
          setIsRegistered(false);
          return;
        }

        const tokenResult = tokenOverride ? Ok(tokenOverride) : await getExpoPushToken();
        if (registrationScopeRef.current !== scope) {
          return;
        }
        if (!tokenResult.ok) {
          setError(tokenResult.error);
          setIsRegistered(false);
          return;
        }

        const result = await updatePushToken(user.id, tokenResult.value);
        if (registrationScopeRef.current !== scope) {
          return;
        }
        if (!result.ok) {
          setError(getErrorMessage(result.error));
          setIsRegistered(false);
          return;
        }

        setExpoPushToken(tokenResult.value);
        setIsRegistered(true);
      } catch {
        if (registrationScopeRef.current === scope) {
          setError('Failed to register push notifications');
          setIsRegistered(false);
        }
      } finally {
        scope.registering = false;
      }
    },
    [user?.id, getExpoPushToken],
  );

  const refreshPermissions = useCallback(async () => {
    const scope = registrationScopeRef.current;
    if (!scope) {
      return;
    }
    setLoading(true);
    try {
      const settings = await Notifications.getPermissionsAsync();
      if (registrationScopeRef.current !== scope) {
        return settings;
      }
      setPermissionStatus(settings);

      if (isPermissionGranted(settings)) {
        await registerToken(undefined, settings);
      }

      return settings;
    } finally {
      if (registrationScopeRef.current === scope) {
        setLoading(false);
      }
    }
  }, [registerToken]);

  const requestPermissions = useCallback(async () => {
    const scope = registrationScopeRef.current;
    setError(null);
    await ensureAndroidChannel();

    const settings = await Notifications.requestPermissionsAsync({
      ios: {
        allowAlert: true,
        allowBadge: true,
        allowSound: true,
      },
    });

    if (registrationScopeRef.current !== scope) {
      return settings;
    }
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
    const pushTokenListener = Notifications.addPushTokenListener(() => {
      void registerToken();
    });

    return () => {
      pushTokenListener.remove();
    };
  }, [registerToken]);

  // Detect permission changes when app returns from settings
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'active') {
        void (async () => {
          const settings = await Notifications.getPermissionsAsync();
          if (isPermissionGranted(settings) && !isRegistered) {
            await refreshPermissions();
          }
        })();
      }
    });

    return () => subscription.remove();
  }, [refreshPermissions, isRegistered]);

  return {
    expoPushToken,
    permissionStatus,
    loading,
    error,
    requestPermissions,
    isRegistered,
  };
};
