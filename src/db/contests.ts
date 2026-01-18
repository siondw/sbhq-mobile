import type { AsyncResult } from '../utils/result';
import { Err, Ok } from '../utils/result';
import { SUPABASE_CLIENT } from './client';
import { DB_TABLES } from './constants';
import { networkError } from './errors';
import type { DbError } from './errors';
import type { ContestRow } from './types';

export const getContests = async (): AsyncResult<ContestRow[], DbError> => {
  const { data, error } = await SUPABASE_CLIENT.from(DB_TABLES.CONTESTS)
    .select('*')
    .order('start_time', {
      ascending: true,
    });

  if (error) {
    return Err(networkError(`Failed to fetch contests: ${error.message}`));
  }

  return Ok((data ?? []) as ContestRow[]);
};

export const getContestById = async (
  contestId: string,
): AsyncResult<ContestRow | null, DbError> => {
  const { data, error } = await SUPABASE_CLIENT.from(DB_TABLES.CONTESTS)
    .select('*')
    .eq('id', contestId)
    .maybeSingle();

  if (error) {
    return Err(networkError(`Failed to fetch contest ${contestId}: ${error.message}`));
  }

  return Ok((data as ContestRow | null) ?? null);
};

// State check helpers
export const isContestActive = (contest: ContestRow): boolean => {
  return (
    contest.state === 'LOBBY_OPEN' ||
    contest.state === 'ROUND_IN_PROGRESS' ||
    contest.state === 'ROUND_CLOSED'
  );
};

export const canAcceptParticipants = (contest: ContestRow): boolean => {
  return contest.state === 'LOBBY_OPEN';
};

export const canSubmitAnswers = (contest: ContestRow): boolean => {
  return contest.state === 'ROUND_IN_PROGRESS';
};

export const isContestFinished = (contest: ContestRow): boolean => {
  return contest.state === 'FINISHED';
};
