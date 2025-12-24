import { useCallback, useEffect, useState } from 'react';
import { getOrCreateParticipant, getParticipantForUser } from '../../db/participants';
import type { ContestRow, ParticipantRow } from '../../db/types';

export interface UseContestRegistrationResult {
  participants: Map<string, ParticipantRow>;
  loading: boolean;
  error: string | null;
  registerForContest: (contestId: string) => Promise<ParticipantRow | null>;
  getParticipantStatus: (contestId: string) => ParticipantRow | undefined;
}

export const useContestRegistration = (
  contests: ContestRow[],
  userId?: string,
): UseContestRegistrationResult => {
  const [participants, setParticipants] = useState<Map<string, ParticipantRow>>(new Map());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchParticipantStatuses = useCallback(async () => {
    if (!userId || contests.length === 0) return;

    setLoading(true);
    setError(null);
    try {
      const participantMap = new Map<string, ParticipantRow>();
      await Promise.all(
        contests.map(async (contest) => {
          const participant = await getParticipantForUser(contest.id, userId);
          if (participant) {
            participantMap.set(contest.id, participant);
          }
        }),
      );
      setParticipants(participantMap);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [contests, userId]);

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
      try {
        const participant = await getOrCreateParticipant(contestId, userId);
        setParticipants((prev) => new Map(prev).set(contestId, participant));
        return participant;
      } catch (err) {
        setError((err as Error).message);
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
  };
};
