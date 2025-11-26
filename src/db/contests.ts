import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import { DB_TABLES } from './constants';
import { SUPABASE_CLIENT } from './client';
import type { ContestRow } from './types';
import { subscribeToTable } from './realtime';

export const getContests = async (): Promise<ContestRow[]> => {
  const { data, error } = await SUPABASE_CLIENT.from(DB_TABLES.CONTESTS).select('*').order('start_time', {
    ascending: true,
  });

  if (error) {
    throw new Error(`Failed to fetch contests: ${error.message}`);
  }

  return data ?? [];
};

export const getContestById = async (contestId: string): Promise<ContestRow | null> => {
  const { data, error } = await SUPABASE_CLIENT
    .from(DB_TABLES.CONTESTS)
    .select('*')
    .eq('id', contestId)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to fetch contest ${contestId}: ${error.message}`);
  }

  return data ?? null;
};

export const subscribeToContest = (
  contestId: string,
  onChange: (contest: ContestRow) => void,
): (() => void) =>
  subscribeToTable<ContestRow>({
    channel: `contest-${contestId}`,
    event: 'UPDATE',
    table: DB_TABLES.CONTESTS,
    filter: `id=eq.${contestId}`,
    callback: (payload: RealtimePostgresChangesPayload<ContestRow>) => {
      if (payload.new) {
        onChange(payload.new);
      }
    },
  });
