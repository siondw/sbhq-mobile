import { useCallback, useEffect, useMemo, useState } from 'react';
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import { getContestById, subscribeToContest } from '../../db/contests';
import {
  getOrCreateParticipant,
  getParticipantForUser,
  subscribeToParticipant,
} from '../../db/participants';
import { getQuestionForRound, subscribeToQuestions } from '../../db/questions';
import {
  getAnswerForQuestion,
  subscribeToAnswersForParticipant,
  type SubmitAnswerParams,
  submitAnswer,
} from '../../db/answers';
import type { AnswerRow, ContestRow, ParticipantRow, QuestionRow } from '../../db/types';
import { PLAYER_STATE, type PlayerState } from '../constants';

export interface UseContestStateResult {
  loading: boolean;
  error: string | null;
  contest: ContestRow | null;
  participant: ParticipantRow | null;
  question: QuestionRow | null;
  answer: AnswerRow | null;
  playerState: PlayerState;
  refresh: () => Promise<void>;
  submit: (payload: SubmitAnswerParams) => Promise<void>;
}

const derivePlayerState = (
  contest: ContestRow | null,
  participant: ParticipantRow | null,
  question: QuestionRow | null,
  answer: AnswerRow | null,
): PlayerState => {
  if (!contest || !participant) {
    return PLAYER_STATE.UNKNOWN;
  }

  if (participant.active === false || participant.elimination_round !== null) {
    return PLAYER_STATE.ELIMINATED;
  }

  if (contest.finished) {
    return participant.active ? PLAYER_STATE.WINNER : PLAYER_STATE.ELIMINATED;
  }

  if (contest.lobby_open) {
    return PLAYER_STATE.LOBBY;
  }

  if (contest.submission_open) {
    return PLAYER_STATE.ANSWERING;
  }

  if (!contest.submission_open && question) {
    if (!answer) {
      return PLAYER_STATE.ELIMINATED;
    }

    if (question.correct_option === null) {
      return PLAYER_STATE.SUBMITTED_WAITING;
    }

    if (answer.answer === question.correct_option) {
      return PLAYER_STATE.CORRECT_WAITING_NEXT;
    }

    return PLAYER_STATE.ELIMINATED;
  }

  return PLAYER_STATE.UNKNOWN;
};

export const useContestState = (contestId?: string, userId?: string): UseContestStateResult => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [contest, setContest] = useState<ContestRow | null>(null);
  const [participant, setParticipant] = useState<ParticipantRow | null>(null);
  const [question, setQuestion] = useState<QuestionRow | null>(null);
  const [answer, setAnswer] = useState<AnswerRow | null>(null);

  const fetchContestState = useCallback(async () => {
    if (!contestId) return;
    setLoading(true);
    setError(null);
    try {
      const [contestResult, participantResult] = await Promise.all([
        getContestById(contestId),
        userId ? getParticipantForUser(contestId, userId) : Promise.resolve(null),
      ]);
      setContest(contestResult);
      const ensuredParticipant =
        contestResult && userId
          ? participantResult ?? (await getOrCreateParticipant(contestResult.id, userId))
          : participantResult;
      setParticipant(ensuredParticipant ?? null);

      if (contestResult) {
        const roundQuestion = await getQuestionForRound(contestResult.id, contestResult.current_round);
        setQuestion(roundQuestion);
        if (ensuredParticipant && roundQuestion) {
          const existingAnswer = await getAnswerForQuestion(ensuredParticipant.id, roundQuestion.id);
          setAnswer(existingAnswer);
        } else {
          setAnswer(null);
        }
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [contestId, userId]);

  useEffect(() => {
    void fetchContestState();
  }, [fetchContestState]);

  useEffect(() => {
    if (!contestId) return undefined;

    const unsubscribes: Array<() => void> = [];

    const contestUnsub = subscribeToContest(contestId, (updatedContest: ContestRow) => {
      setContest(updatedContest);
    });
    unsubscribes.push(contestUnsub);

    if (participant?.id) {
      const participantUnsub = subscribeToParticipant(participant.id, (updated) => {
        setParticipant(updated);
      });
      unsubscribes.push(participantUnsub);

      const answersUnsub = subscribeToAnswersForParticipant(
        participant.id,
        (payload: RealtimePostgresChangesPayload<AnswerRow>) => {
          if (payload.new) {
            setAnswer(payload.new);
          }
        },
      );
      unsubscribes.push(answersUnsub);
    }

    const questionsUnsub = subscribeToQuestions(contestId, (payload) => {
      const nextQuestion = payload.new as QuestionRow | null;
      if (nextQuestion) {
        setQuestion((current) => (nextQuestion.round >= (current?.round ?? 0) ? nextQuestion : current));
      }
    });
    unsubscribes.push(questionsUnsub);

    return () => {
      unsubscribes.forEach((unsub) => unsub());
    };
  }, [contestId, participant?.id]);

  useEffect(() => {
    const loadCurrentQuestion = async () => {
      if (!contestId || !contest?.current_round) return;
      try {
        const roundQuestion = await getQuestionForRound(contestId, contest.current_round);
        setQuestion(roundQuestion);
        if (participant?.id && roundQuestion) {
          const existingAnswer = await getAnswerForQuestion(participant.id, roundQuestion.id);
          setAnswer(existingAnswer);
        } else {
          setAnswer(null);
        }
      } catch (err) {
        setError((err as Error).message);
      }
    };

    void loadCurrentQuestion();
  }, [contest?.current_round, contestId, participant?.id]);

  const playerState = useMemo(
    () => derivePlayerState(contest, participant, question, answer),
    [answer, contest, participant, question],
  );

  const handleSubmit = useCallback(
    async (payload: SubmitAnswerParams) => {
      await submitAnswer(payload);
    },
    [],
  );

  return {
    loading,
    error,
    contest,
    participant,
    question,
    answer,
    playerState,
    refresh: fetchContestState,
    submit: handleSubmit,
  };
};

export default useContestState;
