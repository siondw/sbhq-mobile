import * as Application from 'expo-application';
import { useCallback, useEffect, useRef, useState } from 'react';
import { getAppVersionPolicy } from '../../db/appVersionPolicy';
import { getErrorMessage } from '../../db/errors';

export interface VersionCheckResult {
  needsUpdate: boolean;
  shouldForce: boolean;
  message: string | null;
  loading: boolean;
  error: string | null;
  checkVersion: () => Promise<void>;
}

export const useAppVersionPolicy = (): VersionCheckResult => {
  const [needsUpdate, setNeedsUpdate] = useState(false);
  const [shouldForce, setShouldForce] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const hasCheckedRef = useRef(false);

  const checkVersion = useCallback(async () => {
    const buildVersion = Application.nativeBuildVersion;
    const currentBuild = buildVersion ? parseInt(buildVersion, 10) : 0;

    const result = await getAppVersionPolicy(__DEV__);

    if (!result.ok) {
      setError(getErrorMessage(result.error));
      setLoading(false);
      return;
    }

    const policy = result.value;

    if (!policy) {
      setLoading(false);
      return;
    }

    const isOutdated = currentBuild > 0 && currentBuild < policy.min_build;
    setNeedsUpdate(isOutdated);
    setShouldForce(policy.should_force);
    setMessage(policy.message);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!hasCheckedRef.current) {
      hasCheckedRef.current = true;
      void checkVersion();
    }
  }, [checkVersion]);

  return {
    needsUpdate,
    shouldForce,
    message,
    loading,
    error,
    checkVersion,
  };
};
