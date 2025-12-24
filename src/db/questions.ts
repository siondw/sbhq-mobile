import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import { SUPABASE_CLIENT } from './client';
import { DB_TABLES } from './constants';
import { subscribeToTable } from './realtime';
import type { QuestionRow } from './types';

export const getQuestionsForContest = async (contestId: string): Promise<QuestionRow[]> => {
  const { data, error } = await SUPABASE_CLIENT.from(DB_TABLES.QUESTIONS)
    .select('*')
    .eq('contest_id', contestId)
    .order('round', { ascending: true });

  if (error) {
    throw new Error(`Failed to fetch questions for contest ${contestId}: ${error.message}`);
  }

  return (data as QuestionRow[]) ?? [];
};

export const getQuestionForRound = async (
  contestId: string,
  round: number,
): Promise<QuestionRow | null> => {
  const { data, error } = await SUPABASE_CLIENT.from(DB_TABLES.QUESTIONS)
    .select('*')
    .eq('contest_id', contestId)
    .eq('round', round)
    .maybeSingle();

  if (error) {
    throw new Error(
      `Failed to fetch question for contest ${contestId} round ${round}: ${error.message}`,
    );
  }

  return (data as QuestionRow) ?? null;
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
