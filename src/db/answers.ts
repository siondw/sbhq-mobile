import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import type { AsyncResult } from '../utils/result';
import { Err, Ok } from '../utils/result';
import { SUPABASE_CLIENT } from './client';
import { DB_TABLES } from './constants';
import { networkError } from './errors';
import type { DbError } from './errors';
import type { AnswerOptionValue } from '../configs/constants';
import { subscribeToTable } from './realtime';
import type { AnswerInsert, AnswerRow } from './types';

export interface SubmitAnswerParams {
  participantId: string;
  contestId: string;
  questionId: string;
  round: number;
  answer: AnswerOptionValue;
}

export const submitAnswer = async ({
  participantId,
  contestId,
  questionId,
  round,
  answer,
}: SubmitAnswerParams): AsyncResult<AnswerRow, DbError> => {
  const existingResult = await getAnswerForQuestion(participantId, questionId);

  if (!existingResult.ok) {
    return existingResult;
  }

  const payload: AnswerInsert = {
    participant_id: participantId,
    contest_id: contestId,
    question_id: questionId,
    round,
    answer,
    timestamp: new Date().toISOString(),
  };

  if (existingResult.value) {
    const { data, error } = await SUPABASE_CLIENT.from('answers')
      .update({
        answer: payload.answer,
        timestamp: payload.timestamp,
      })
      .eq('id', existingResult.value.id)
      .select()
      .single();

    if (error) {
      return Err(networkError(`Failed to update answer: ${error.message}`));
    }

    return Ok(data as AnswerRow);
  }

  const { data, error } = await SUPABASE_CLIENT.from('answers').insert(payload).select().single();

  if (error) {
    return Err(networkError(`Failed to submit answer: ${error.message}`));
  }

  return Ok(data as AnswerRow);
};

export const getAnswerForQuestion = async (
  participantId: string,
  questionId: string,
): AsyncResult<AnswerRow | null, DbError> => {
  const { data, error } = await SUPABASE_CLIENT.from(DB_TABLES.ANSWERS)
    .select('*')
    .eq('participant_id', participantId)
    .eq('question_id', questionId)
    .maybeSingle();

  if (error) {
    return Err(networkError(`Failed to fetch answer for question ${questionId}: ${error.message}`));
  }

  return Ok((data as AnswerRow | null) ?? null);
};

export const getAnswerForRound = async (
  participantId: string,
  contestId: string,
  round: number,
): AsyncResult<AnswerRow | null, DbError> => {
  const { data, error} = await SUPABASE_CLIENT.from(DB_TABLES.ANSWERS)
    .select('*')
    .eq('participant_id', participantId)
    .eq('contest_id', contestId)
    .eq('round', round)
    .maybeSingle();

  if (error) {
    return Err(networkError(
      `Failed to fetch answer for participant ${participantId} round ${round}: ${error.message}`,
    ));
  }

  return Ok((data as AnswerRow | null) ?? null);
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
