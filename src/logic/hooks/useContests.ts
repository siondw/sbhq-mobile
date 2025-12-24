import { useCallback, useEffect, useState } from 'react';
import { getContests } from '../../db/contests';
import { getErrorMessage } from '../../db/errors';
import type { ContestRow } from '../../db/types';

export interface UseContestsResult {
  contests: ContestRow[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export const useContests = (): UseContestsResult => {
  const [contests, setContests] = useState<ContestRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchContests = useCallback(async () => {
    setLoading(true);
    setError(null);

    const result = await getContests();
    if (result.ok) {
      setContests(result.value);
    } else {
      setError(getErrorMessage(result.error));
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    void fetchContests();
  }, [fetchContests]);

  return {
    contests,
    loading,
    error,
    refresh: fetchContests,
  };
};
