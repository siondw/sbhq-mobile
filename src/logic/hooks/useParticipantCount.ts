import { useEffect, useState } from 'react';
import { getActiveParticipantCount } from '../../db/participants';

export interface UseParticipantCountResult {
  count: number;
  loading: boolean;
  error: string | null;
}

export const useParticipantCount = (contestId?: string): UseParticipantCountResult => {
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

    const loadCount = async () => {
      setLoading(true);
      setError(null);
      try {
        const participantCount = await getActiveParticipantCount(contestId);
        if (isMounted) {
          setCount(participantCount);
        }
      } catch (err) {
        if (isMounted) {
          setError((err as Error).message);
          setCount(0);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    void loadCount();

    return () => {
      isMounted = false;
    };
  }, [contestId]);

  return {
    count,
    loading,
    error,
  };
};
