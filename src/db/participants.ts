import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import { SUPABASE_CLIENT } from './client';
import { DB_TABLES } from './constants';
import { subscribeToTable } from './realtime';
import type { ParticipantInsert, ParticipantRow } from './types';

export const getParticipantForUser = async (
  contestId: string,
  userId: string,
): Promise<ParticipantRow | null> => {
  const { data, error } = await SUPABASE_CLIENT.from(DB_TABLES.PARTICIPANTS)
    .select('*')
    .eq('contest_id', contestId)
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to fetch participant for contest ${contestId}: ${error.message}`);
  }

  return (data as ParticipantRow) ?? null;
};

export const getActiveParticipantCount = async (contestId: string): Promise<number> => {
  const { count, error } = await SUPABASE_CLIENT.from(DB_TABLES.PARTICIPANTS)
    .select('id', { count: 'exact', head: true })
    .eq('contest_id', contestId)
    .eq('active', true);

  if (error) {
    throw new Error(`Failed to fetch participant count for contest ${contestId}: ${error.message}`);
  }

  return count ?? 0;
};

export const createParticipant = async (payload: ParticipantInsert): Promise<ParticipantRow> => {
  const { data, error } = await SUPABASE_CLIENT.from('participants')
    .insert(payload)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create participant: ${error.message}`);
  }

  return data as ParticipantRow;
};

export const getOrCreateParticipant = async (
  contestId: string,
  userId: string,
): Promise<ParticipantRow> => {
  const existing = await getParticipantForUser(contestId, userId);
  if (existing) {
    return existing;
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
