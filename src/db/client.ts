import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { createClient, type SupabaseClientOptions } from '@supabase/supabase-js';
import { ENV } from '../configs/env';
import type { Database } from './types';

const authOptions: SupabaseClientOptions<Database>['auth'] =
  Platform.OS === 'web'
    ? {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
        // On web, supabase-js will default to localStorage; no AsyncStorage to avoid `window` reference on the server.
      }
    : {
        storage: AsyncStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
      };

export const SUPABASE_CLIENT = createClient<Database>(ENV.SUPABASE_URL, ENV.SUPABASE_ANON_KEY, {
  auth: authOptions,
});
