import { useCallback, useState } from 'react';
import { ANIMATION_DURATION } from '../../ui/animations';
import { lightImpact } from '../../utils/haptics';

export const useRefresh = (refreshFns: Array<() => Promise<void>>) => {
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    lightImpact();
    setRefreshing(true);

    const startTime = Date.now();
    await Promise.all(refreshFns.map((fn) => fn()));

    // Ensure spinner shows for at least REFRESH_MIN duration
    const elapsed = Date.now() - startTime;
    if (elapsed < ANIMATION_DURATION.REFRESH_MIN) {
      await new Promise((resolve) => setTimeout(resolve, ANIMATION_DURATION.REFRESH_MIN - elapsed));
    }

    setRefreshing(false);
  }, [refreshFns]);

  return { refreshing, onRefresh };
};
