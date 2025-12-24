import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';
import { ENV } from '../configs/env';
import type { Database as DB } from './types';

// @sdweck 12/24/25
// Strip internal Supabase type to fix query builder type inference
// Community recommended way to address ts issues on supabase generated types
type Database = Omit<DB, '__InternalSupabase'>;

const authOptions =
  Platform.OS === 'web'
    ? {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
      }
    : {
        storage: AsyncStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
        flowType: 'pkce' as const,
      };

export const SUPABASE_CLIENT = createClient<Database>(ENV.SUPABASE_URL, ENV.SUPABASE_ANON_KEY, {
  auth: authOptions,
});
