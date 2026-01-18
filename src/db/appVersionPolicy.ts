import { Platform } from 'react-native';
import type { AsyncResult } from '../utils/result';
import { Err, Ok } from '../utils/result';
import { SUPABASE_CLIENT } from './client';
import { DB_TABLES } from './constants';
import { networkError } from './errors';
import type { DbError } from './errors';

export interface AppVersionPolicy {
  platform: string;
  environment: 'development' | 'production';
  min_build: number;
  should_force: boolean;
  message: string | null;
}

export const getAppVersionPolicy = async (
  isDev: boolean,
): AsyncResult<AppVersionPolicy | null, DbError> => {
  const platform = Platform.OS;
  const environment = isDev ? 'development' : 'production';

  const { data, error } = await SUPABASE_CLIENT.from(DB_TABLES.APP_VERSION_POLICY)
    .select('platform, environment, min_build, should_force, message')
    .eq('platform', platform)
    .eq('environment', environment)
    .maybeSingle();

  if (error) {
    return Err(networkError(`Failed to fetch version policy: ${error.message}`));
  }

  return Ok(data as AppVersionPolicy | null);
};
