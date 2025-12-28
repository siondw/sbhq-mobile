import { useEffect, useState } from 'react';
import { getErrorMessage } from '../../db/errors';
import { getActiveParticipantCount } from '../../db/participants';

export interface UseParticipantCountResult {
  count: number;
  loading: boolean;
  error: string | null;
}

export const useParticipantCount = (
  contestId?: string,
  pollIntervalMs: number = 0,
): UseParticipantCountResult => {
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!contestId) {
      setCount(0);
      setLoading(false);
      return undefined;
    }

    let isMounted = true;

    const loadCount = async (isPolling = false) => {
      // Don't set loading to true for background polls to avoid UI flicker
      if (!isPolling) setLoading(true);
      setError(null);

      const result = await getActiveParticipantCount(contestId);
      if (isMounted) {
        if (result.ok) {
          setCount(result.value);
        } else {
          // Only show error on initial load, swallow polling errors to avoid alerting user unnecessarily
          if (!isPolling) {
            setError(getErrorMessage(result.error));
            setCount(0);
          }
        }
        if (!isPolling) setLoading(false);
      }
    };

    // Initial load
    void loadCount();

    // Setup polling
    let intervalId: NodeJS.Timeout | null = null;
    if (pollIntervalMs > 0) {
      intervalId = setInterval(() => {
        void loadCount(true);
      }, pollIntervalMs);
    }

    return () => {
      isMounted = false;
      if (intervalId) clearInterval(intervalId);
    };
  }, [contestId, pollIntervalMs]);

  return {
    count,
    loading,
    error,
  };
};
