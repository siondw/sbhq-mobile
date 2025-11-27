import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import { DB_TABLES } from './constants';
import { SUPABASE_CLIENT } from './client';
import type { AnswerInsert, AnswerRow } from './types';
import { subscribeToTable } from './realtime';

export interface SubmitAnswerParams {
  participantId: string;
  contestId: string;
  questionId: string;
  round: number;
  answer: string;
}

export const submitAnswer = async ({
  participantId,
  contestId,
  questionId,
  round,
  answer,
}: SubmitAnswerParams): Promise<AnswerRow> => {
  const existing = await getAnswerForQuestion(participantId, questionId);
  const payload: AnswerInsert = {
    participant_id: participantId,
    contest_id: contestId,
    question_id: questionId,
    round,
    answer,
    timestamp: new Date().toISOString(),
  };

  if (existing) {
    const { data, error } = await SUPABASE_CLIENT
      .from(DB_TABLES.ANSWERS)
      .update(payload)
      .eq('id', existing.id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update answer: ${error.message}`);
    }

    return data;
  }

  const { data, error } = await SUPABASE_CLIENT
    .from(DB_TABLES.ANSWERS)
    .insert(payload)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to submit answer: ${error.message}`);
  }

  return data;
};

export const getAnswerForQuestion = async (
  participantId: string,
  questionId: string,
): Promise<AnswerRow | null> => {
  const { data, error } = await SUPABASE_CLIENT
    .from(DB_TABLES.ANSWERS)
    .select('*')
    .eq('participant_id', participantId)
    .eq('question_id', questionId)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to fetch answer for question ${questionId}: ${error.message}`);
  }

  return data ?? null;
};

export const getAnswerForRound = async (
  participantId: string,
  contestId: string,
  round: number,
): Promise<AnswerRow | null> => {
  const { data, error } = await SUPABASE_CLIENT
    .from(DB_TABLES.ANSWERS)
    .select('*')
    .eq('participant_id', participantId)
    .eq('contest_id', contestId)
    .eq('round', round)
    .maybeSingle();

  if (error) {
    throw new Error(
      `Failed to fetch answer for participant ${participantId} round ${round}: ${error.message}`,
    );
  }

  return data ?? null;
};

export const subscribeToAnswersForParticipant = (
  participantId: string,
  onChange: (payload: RealtimePostgresChangesPayload<AnswerRow>) => void,
): (() => void) =>
  subscribeToTable<AnswerRow>({
    channel: `answers-${participantId}`,
    event: '*',
    table: DB_TABLES.ANSWERS,
    filter: `participant_id=eq.${participantId}`,
    callback: onChange,
  });
