import { useEffect, useState } from 'react';
import { DEMO_CONTEST_ID } from '../../configs/constants';
import type { AnswerDistribution } from '../../db/answers';
import { getAnswerDistribution } from '../../db/answers';
import { getErrorMessage } from '../../db/errors';

export interface UseAnswerDistributionResult {
  distribution: AnswerDistribution[];
  loading: boolean;
  error: string | null;
}

const DEMO_DISTRIBUTION: AnswerDistribution[] = [
  { answer: 'A', count: 456 },
  { answer: 'B', count: 312 },
  { answer: 'C', count: 289 },
  { answer: 'D', count: 190 },
];

export const useAnswerDistribution = (
  contestId?: string,
  round?: number,
): UseAnswerDistributionResult => {
  const [distribution, setDistribution] = useState<AnswerDistribution[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isDemo = contestId === DEMO_CONTEST_ID;

  useEffect(() => {
    if (!contestId || round === undefined || round === null || isDemo) {
      setDistribution([]);
      setLoading(false);
      setError(null);
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
  }, [contestId, round, isDemo]);

  return {
    distribution: isDemo ? DEMO_DISTRIBUTION : distribution,
    loading: isDemo ? false : loading,
    error: isDemo ? null : error,
  };
};
