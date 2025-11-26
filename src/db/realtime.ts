import type { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import { SUPABASE_CLIENT } from './client';

export type PostgresEvent = 'INSERT' | 'UPDATE' | 'DELETE' | '*';

export interface RealtimeSubscriptionConfig<TRow> {
  channel: string;
  event: PostgresEvent;
  table: string;
  schema?: string;
  filter?: string;
  callback: (payload: RealtimePostgresChangesPayload<TRow>) => void;
}

export const subscribeToTable = <TRow>({
  channel,
  event,
  table,
  schema = 'public',
  filter,
  callback,
}: RealtimeSubscriptionConfig<TRow>): (() => void) => {
  const realtimeChannel: RealtimeChannel = SUPABASE_CLIENT.channel(channel).on(
    'postgres_changes',
    { event, schema, table, filter },
    (payload: RealtimePostgresChangesPayload<TRow>) => callback(payload),
  );

  void realtimeChannel.subscribe();

  return () => {
    void SUPABASE_CLIENT.removeChannel(realtimeChannel);
  };
};
