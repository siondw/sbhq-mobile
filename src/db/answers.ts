import type { AnswerOptionValue } from '../configs/constants';
import type { AsyncResult } from '../utils/result';
import { Err, Ok } from '../utils/result';
import { SUPABASE_CLIENT } from './client';
import { DB_TABLES } from './constants';
import type { DbError } from './errors';
import { networkError } from './errors';
import type { AnswerInsert, AnswerRow } from './types';

export interface SubmitAnswerParams {
  participantId: string;
  contestId: string;
  questionId: string;
  round: number;
  answer: AnswerOptionValue;
}

type AnswerInsertInput = Omit<AnswerInsert, 'id'>;

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

  const payload: AnswerInsertInput = {
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

  const { data, error } = await SUPABASE_CLIENT.from('answers')
    .insert(payload as AnswerInsert)
    .select()
    .single();

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
  const { data, error } = await SUPABASE_CLIENT.from(DB_TABLES.ANSWERS)
    .select('*')
    .eq('participant_id', participantId)
    .eq('contest_id', contestId)
    .eq('round', round)
    .maybeSingle();

  if (error) {
    return Err(
      networkError(
        `Failed to fetch answer for participant ${participantId} round ${round}: ${error.message}`,
      ),
    );
  }

  return Ok((data as AnswerRow | null) ?? null);
};

export interface AnswerDistribution {
  answer: string;
  count: number;
}

export const getAnswerDistribution = async (
  contestId: string,
  round: number,
): AsyncResult<AnswerDistribution[], DbError> => {
  const { data, error } = await SUPABASE_CLIENT.rpc('get_answer_distribution', {
    p_contest_id: contestId,
    p_round: round,
  });

  if (error) {
    return Err(networkError(`Failed to get answer distribution: ${error.message}`));
  }

  return Ok(data as AnswerDistribution[]);
};
