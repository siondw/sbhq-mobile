import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEYS = {
  HAS_SEEN_PULL_HINT: 'hasSeenPullHint',
} as const;

export const getHasSeenPullHint = async (): Promise<boolean> => {
  const value = await AsyncStorage.getItem(STORAGE_KEYS.HAS_SEEN_PULL_HINT);
  return value === 'true';
};

export const setHasSeenPullHint = async (): Promise<void> => {
  await AsyncStorage.setItem(STORAGE_KEYS.HAS_SEEN_PULL_HINT, 'true');
};
