import { useEffect, useState } from 'react';
import { getErrorMessage } from '../../db/errors';
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

      const result = await getActiveParticipantCount(contestId);
      if (isMounted) {
        if (result.ok) {
          setCount(result.value);
        } else {
          setError(getErrorMessage(result.error));
          setCount(0);
        }
        setLoading(false);
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
