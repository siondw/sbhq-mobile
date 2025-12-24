import { useCallback, useEffect, useState } from 'react';
import { getContests } from '../../db/contests';
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
    try {
      const data = await getContests();
      setContests(data);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
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
