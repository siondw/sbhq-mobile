import type { AsyncResult } from '../utils/result';
import { Err, Ok } from '../utils/result';
import { SUPABASE_CLIENT } from './client';
import { DB_TABLES } from './constants';
import { networkError } from './errors';
import type { DbError } from './errors';
import type { QuestionRow } from './types';

export const getQuestionsForContest = async (
  contestId: string,
): AsyncResult<QuestionRow[], DbError> => {
  const { data, error } = await SUPABASE_CLIENT.from(DB_TABLES.QUESTIONS)
    .select('*')
    .eq('contest_id', contestId)
    .order('round', { ascending: true });

  if (error) {
    return Err(
      networkError(`Failed to fetch questions for contest ${contestId}: ${error.message}`),
    );
  }

  return Ok((data as QuestionRow[]) ?? []);
};

export const getQuestionForRound = async (
  contestId: string,
  round: number,
): AsyncResult<QuestionRow | null, DbError> => {
  const { data, error } = await SUPABASE_CLIENT.from(DB_TABLES.QUESTIONS)
    .select('*')
    .eq('contest_id', contestId)
    .eq('round', round)
    .maybeSingle();

  if (error) {
    return Err(
      networkError(
        `Failed to fetch question for contest ${contestId} round ${round}: ${error.message}`,
      ),
    );
  }

  return Ok((data as QuestionRow | null) ?? null);
};
