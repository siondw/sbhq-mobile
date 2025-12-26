import { useEffect, useState } from 'react';
import type { AnswerDistribution } from '../../db/answers';
import { getAnswerDistribution } from '../../db/answers';
import { getErrorMessage } from '../../db/errors';

export interface UseAnswerDistributionResult {
  distribution: AnswerDistribution[];
  loading: boolean;
  error: string | null;
}

export const useAnswerDistribution = (
  contestId?: string,
  round?: number,
): UseAnswerDistributionResult => {
  const [distribution, setDistribution] = useState<AnswerDistribution[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!contestId || round === undefined || round === null) {
      setDistribution([]);
      setLoading(false);
      return undefined;
    }

    let isMounted = true;

    const loadDistribution = async () => {
      setLoading(true);
      setError(null);

      const result = await getAnswerDistribution(contestId, round);
      if (isMounted) {
        if (result.ok) {
          setDistribution(result.value);
        } else {
          setError(getErrorMessage(result.error));
          setDistribution([]);
        }
        setLoading(false);
      }
    };

    void loadDistribution();

    return () => {
      isMounted = false;
    };
  }, [contestId, round]);

  return {
    distribution,
    loading,
    error,
  };
};
