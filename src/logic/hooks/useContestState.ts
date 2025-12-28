import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  getAnswerForQuestion,
  submitAnswer,
  subscribeToAnswersForParticipant,
  type SubmitAnswerParams,
} from '../../db/answers';
import { getContestById, subscribeToContest } from '../../db/contests';
import { getErrorMessage } from '../../db/errors';
import {
  getOrCreateParticipant,
  getParticipantForUser,
  subscribeToParticipant,
} from '../../db/participants';
import { getQuestionForRound, subscribeToQuestions } from '../../db/questions';
import type { AnswerRow, ContestRow, ParticipantRow, QuestionRow } from '../../db/types';
import type { Result } from '../../utils/result';
import type { PlayerState } from '../constants';
import { derivePlayerState } from '../contest/derivePlayerState';

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

export const useContestState = (contestId?: string, userId?: string): UseContestStateResult => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [contest, setContest] = useState<ContestRow | null>(null);
  const [participant, setParticipant] = useState<ParticipantRow | null>(null);
  const [question, setQuestion] = useState<QuestionRow | null>(null);
  const [answer, setAnswer] = useState<AnswerRow | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  const fetchContestState = useCallback(async () => {
    if (!contestId) {
      setContest(null);
      setParticipant(null);
      setQuestion(null);
      setAnswer(null);
      setError('Missing contest. Please pick a contest from the list and try again.');
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);

    const [contestResult, participantResult] = await Promise.all([
      getContestById(contestId),
      userId
        ? getParticipantForUser(contestId, userId)
        : Promise.resolve<Result<ParticipantRow | null, never>>({ ok: true, value: null }),
    ]);

    if (!contestResult.ok) {
      setError(getErrorMessage(contestResult.error));
      setLoading(false);
      return;
    }

    if (!participantResult.ok) {
      setError(getErrorMessage(participantResult.error));
      setLoading(false);
      return;
    }

    const contest = contestResult.value;
    setContest(contest);

    let ensuredParticipant = participantResult.value;
    if (contest && userId && !ensuredParticipant) {
      const createResult = await getOrCreateParticipant(contest.id, userId);
      if (!createResult.ok) {
        setError(getErrorMessage(createResult.error));
        setLoading(false);
        return;
      }
      ensuredParticipant = createResult.value;
    }
    setParticipant(ensuredParticipant);

    if (contest) {
      if (contest.current_round) {
        const questionResult = await getQuestionForRound(contest.id, contest.current_round);
        if (!questionResult.ok) {
          setError(getErrorMessage(questionResult.error));
          setLoading(false);
          return;
        }
        const roundQuestion = questionResult.value;
        setQuestion(roundQuestion);

        if (ensuredParticipant && roundQuestion) {
          const answerResult = await getAnswerForQuestion(ensuredParticipant.id, roundQuestion.id);
          if (!answerResult.ok) {
            setError(getErrorMessage(answerResult.error));
            setLoading(false);
            return;
          }
          setAnswer(answerResult.value);
        } else {
          setAnswer(null);
        }
      } else {
        setQuestion(null);
        setAnswer(null);
      }
    }
    setIsInitialized(true);
    setLoading(false);
  }, [contestId, userId]);

  useEffect(() => {
    void fetchContestState();
  }, [fetchContestState]);

  useEffect(() => {
    if (!contestId || !isInitialized) return undefined;

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
          if (payload.new && typeof payload.new === 'object') {
            setAnswer(payload.new as AnswerRow);
          }
        },
      );
      unsubscribes.push(answersUnsub);
    }

    const questionsUnsub = subscribeToQuestions(contestId, (payload) => {
      const nextQuestion = payload.new as QuestionRow | null;
      if (nextQuestion) {
        setQuestion((current) =>
          nextQuestion.round >= (current?.round ?? 0) ? nextQuestion : current,
        );
      }
    });
    unsubscribes.push(questionsUnsub);

    return () => {
      unsubscribes.forEach((unsub) => unsub());
    };
  }, [contestId, participant?.id, isInitialized]);

  useEffect(() => {
    const loadCurrentQuestion = async () => {
      if (!contestId || !contest?.current_round || !isInitialized) return;

      const questionResult = await getQuestionForRound(contestId, contest.current_round);
      if (!questionResult.ok) {
        setError(getErrorMessage(questionResult.error));
        return;
      }

      const roundQuestion = questionResult.value;
      setQuestion((prev) => {
        if (!roundQuestion) return prev;
        if (prev?.id === roundQuestion.id) return prev;
        return roundQuestion;
      });

      if (participant?.id && roundQuestion) {
        const answerResult = await getAnswerForQuestion(participant.id, roundQuestion.id);
        if (!answerResult.ok) {
          setError(getErrorMessage(answerResult.error));
          return;
        }
        setAnswer((prev) => {
          if (prev?.question_id === roundQuestion.id) return prev;
          return answerResult.value;
        });
      }
    };

    void loadCurrentQuestion();
  }, [contest?.current_round, contestId, participant?.id, isInitialized]);

  const playerState = useMemo(
    () => derivePlayerState(contest, participant, question, answer),
    [answer, contest, participant, question],
  );

  const handleSubmit = useCallback(async (payload: SubmitAnswerParams) => {
    const result = await submitAnswer(payload);
    if (!result.ok) {
      setError(getErrorMessage(result.error));
    }
  }, []);

  return useMemo(
    () => ({
      loading,
      error,
      contest,
      participant,
      question,
      answer,
      playerState,
      refresh: fetchContestState,
      submit: handleSubmit,
    }),
    [loading, error, contest, participant, question, answer, playerState, fetchContestState, handleSubmit],
  );
};

export default useContestState;
