import type { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import { SUPABASE_CLIENT } from './client';

export type { RealtimePostgresChangesPayload } from '@supabase/supabase-js';

export type PostgresEvent = 'INSERT' | 'UPDATE' | 'DELETE' | '*';

export interface RealtimeSubscriptionConfig<TRow extends Record<string, unknown>> {
  channel: string;
  event: PostgresEvent;
  table: string;
  schema?: string;
  filter?: string;
  callback: (payload: RealtimePostgresChangesPayload<TRow>) => void;
}

export const subscribeToTable = <TRow extends Record<string, unknown>>({
  channel,
  event,
  table,
  schema = 'public',
  filter,
  callback,
}: RealtimeSubscriptionConfig<TRow>): (() => void) => {
  const realtimeChannel: RealtimeChannel = SUPABASE_CLIENT.channel(channel).on(
    'postgres_changes' as 'system',
    { event, schema, table, filter } as Parameters<RealtimeChannel['on']>[1],
    callback as Parameters<RealtimeChannel['on']>[2],
  );

  void realtimeChannel.subscribe();

  return () => {
    void SUPABASE_CLIENT.removeChannel(realtimeChannel);
  };
};
