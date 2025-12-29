import { useCallback, useEffect, useRef, useState } from 'react';
import { getErrorMessage } from '../../db/errors';
import { getOrCreateParticipant, getParticipantForUser } from '../../db/participants';
import type { ContestRow, ParticipantRow } from '../../db/types';

export interface UseContestRegistrationResult {
  participants: Map<string, ParticipantRow>;
  loading: boolean;
  error: string | null;
  registerForContest: (contestId: string) => Promise<ParticipantRow | null>;
  getParticipantStatus: (contestId: string) => ParticipantRow | undefined;
  refresh: () => Promise<void>;
}

export const useContestRegistration = (
  contests: ContestRow[],
  userId?: string,
): UseContestRegistrationResult => {
  const [participants, setParticipants] = useState<Map<string, ParticipantRow>>(new Map());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const hasLoadedRef = useRef(false);

  const fetchParticipantStatuses = useCallback(
    async (isRefresh = false) => {
      if (!userId || contests.length === 0) return;

      // Only show loading on initial load, not on refresh or re-fetches
      if (!isRefresh && !hasLoadedRef.current) {
        setLoading(true);
      }
      setError(null);

      const participantMap = new Map<string, ParticipantRow>();
      const results = await Promise.all(
        contests.map(async (contest) => {
          const result = await getParticipantForUser(contest.id, userId);
          return { contestId: contest.id, result };
        }),
      );

      for (const { contestId, result } of results) {
        if (result.ok && result.value) {
          participantMap.set(contestId, result.value);
        } else if (!result.ok) {
          setError(getErrorMessage(result.error));
        }
      }

      setParticipants(participantMap);
      hasLoadedRef.current = true;
      setLoading(false);
    },
    [contests, userId],
  );

  useEffect(() => {
    void fetchParticipantStatuses();
  }, [fetchParticipantStatuses]);

  const registerForContest = useCallback(
    async (contestId: string): Promise<ParticipantRow | null> => {
      if (!userId) {
        setError('User ID is required to register for a contest');
        return null;
      }

      setError(null);
      const result = await getOrCreateParticipant(contestId, userId);
      if (result.ok) {
        setParticipants((prev) => new Map(prev).set(contestId, result.value));
        return result.value;
      } else {
        setError(getErrorMessage(result.error));
        return null;
      }
    },
    [userId],
  );

  const getParticipantStatus = useCallback(
    (contestId: string) => participants.get(contestId),
    [participants],
  );

  return {
    participants,
    loading,
    error,
    registerForContest,
    getParticipantStatus,
    refresh: () => fetchParticipantStatuses(true),
  };
};
