import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import type { AsyncResult } from '../utils/result';
import { Err, Ok } from '../utils/result';
import { SUPABASE_CLIENT } from './client';
import { DB_TABLES } from './constants';
import { networkError } from './errors';
import type { DbError } from './errors';
import { subscribeToTable } from './realtime';
import type { ParticipantInsert, ParticipantRow } from './types';

export const getParticipantForUser = async (
  contestId: string,
  userId: string,
): AsyncResult<ParticipantRow | null, DbError> => {
  const { data, error } = await SUPABASE_CLIENT.from(DB_TABLES.PARTICIPANTS)
    .select('*')
    .eq('contest_id', contestId)
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    return Err(networkError(`Failed to fetch participant for contest ${contestId}: ${error.message}`));
  }

  return Ok((data as ParticipantRow | null) ?? null);
};

export const getActiveParticipantCount = async (contestId: string): AsyncResult<number, DbError> => {
  const { count, error } = await SUPABASE_CLIENT.from(DB_TABLES.PARTICIPANTS)
    .select('id', { count: 'exact', head: true })
    .eq('contest_id', contestId)
    .eq('active', true);

  if (error) {
    return Err(networkError(`Failed to fetch participant count for contest ${contestId}: ${error.message}`));
  }

  return Ok(count ?? 0);
};

export const createParticipant = async (payload: ParticipantInsert): AsyncResult<ParticipantRow, DbError> => {
  const { data, error } = await SUPABASE_CLIENT.from('participants')
    .insert(payload)
    .select()
    .single();

  if (error) {
    return Err(networkError(`Failed to create participant: ${error.message}`));
  }

  return Ok(data as ParticipantRow);
};

export const getOrCreateParticipant = async (
  contestId: string,
  userId: string,
): AsyncResult<ParticipantRow, DbError> => {
  const existingResult = await getParticipantForUser(contestId, userId);

  if (!existingResult.ok) {
    return existingResult;
  }

  if (existingResult.value) {
    return Ok(existingResult.value);
  }

  return createParticipant({
    contest_id: contestId,
    user_id: userId,
    active: true,
    elimination_round: null,
  });
};

export const subscribeToParticipant = (
  participantId: string,
  onChange: (participant: ParticipantRow) => void,
): (() => void) =>
  subscribeToTable<ParticipantRow>({
    channel: `participant-${participantId}`,
    event: 'UPDATE',
    table: DB_TABLES.PARTICIPANTS,
    filter: `id=eq.${participantId}`,
    callback: (payload: RealtimePostgresChangesPayload<ParticipantRow>) => {
      if (payload.new && typeof payload.new === 'object') {
        onChange(payload.new as ParticipantRow);
      }
    },
  });
