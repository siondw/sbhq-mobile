import { useEffect, useState } from 'react';

import { getErrorMessage } from '../../db/errors';
import { getQuestionForRound } from '../../db/questions';
import type { QuestionRow } from '../../db/types';

export interface UseEliminationQuestionResult {
  question: QuestionRow | null;
  loading: boolean;
  error: string | null;
}

export const useEliminationQuestion = (
  contestId?: string,
  eliminationRound?: number | null,
): UseEliminationQuestionResult => {
  const [question, setQuestion] = useState<QuestionRow | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!contestId || eliminationRound === undefined || eliminationRound === null) {
      setQuestion(null);
      setLoading(false);
      return undefined;
    }

    let isMounted = true;

    const loadQuestion = async () => {
      setLoading(true);
      setError(null);

      const result = await getQuestionForRound(contestId, eliminationRound);
      if (isMounted) {
        if (result.ok) {
          setQuestion(result.value);
        } else {
          setError(getErrorMessage(result.error));
          setQuestion(null);
        }
        setLoading(false);
      }
    };

    void loadQuestion();

    return () => {
      isMounted = false;
    };
  }, [contestId, eliminationRound]);

  return {
    question,
    loading,
    error,
  };
};
