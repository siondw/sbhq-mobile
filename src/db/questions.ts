import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import type { AsyncResult } from '../utils/result';
import { Err, Ok } from '../utils/result';
import { SUPABASE_CLIENT } from './client';
import { DB_TABLES } from './constants';
import { networkError } from './errors';
import type { DbError } from './errors';
import { subscribeToTable } from './realtime';
import type { QuestionRow } from './types';

export const getQuestionsForContest = async (contestId: string): AsyncResult<QuestionRow[], DbError> => {
  const { data, error } = await SUPABASE_CLIENT.from(DB_TABLES.QUESTIONS)
    .select('*')
    .eq('contest_id', contestId)
    .order('round', { ascending: true });

  if (error) {
    return Err(networkError(`Failed to fetch questions for contest ${contestId}: ${error.message}`));
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
    return Err(networkError(
      `Failed to fetch question for contest ${contestId} round ${round}: ${error.message}`,
    ));
  }

  return Ok((data as QuestionRow | null) ?? null);
};

export const subscribeToQuestions = (
  contestId: string,
  onChange: (payload: RealtimePostgresChangesPayload<QuestionRow>) => void,
): (() => void) =>
  subscribeToTable<QuestionRow>({
    channel: `questions-${contestId}`,
    event: '*',
    table: DB_TABLES.QUESTIONS,
    filter: `contest_id=eq.${contestId}`,
    callback: onChange,
  });
