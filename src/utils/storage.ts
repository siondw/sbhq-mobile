import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEYS = {
  HAS_SEEN_PULL_HINT: 'hasSeenPullHint',
  HAS_DISMISSED_NOTIFICATION_BANNER: 'hasDismissedNotificationBanner',
} as const;

export const getHasSeenPullHint = async (): Promise<boolean> => {
  const value = await AsyncStorage.getItem(STORAGE_KEYS.HAS_SEEN_PULL_HINT);
  return value === 'true';
};

export const setHasSeenPullHint = async (): Promise<void> => {
  await AsyncStorage.setItem(STORAGE_KEYS.HAS_SEEN_PULL_HINT, 'true');
};

export const getHasDismissedNotificationBanner = async (): Promise<boolean> => {
  const value = await AsyncStorage.getItem(STORAGE_KEYS.HAS_DISMISSED_NOTIFICATION_BANNER);
  return value === 'true';
};

export const setHasDismissedNotificationBanner = async (): Promise<void> => {
  await AsyncStorage.setItem(STORAGE_KEYS.HAS_DISMISSED_NOTIFICATION_BANNER, 'true');
};
