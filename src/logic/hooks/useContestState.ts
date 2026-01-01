import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { RealtimePostgresChangesPayload } from '../../db/realtime';
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
  const hasInitializedRef = useRef(false);
  const hasFocusEffectRunRef = useRef(false);
  const contestRoundRef = useRef<number>(0);
  const questionRoundRef = useRef<number>(0);

  const fetchContestState = useCallback(async () => {
    console.log('[DEBUG] fetchContestState called');
    if (!contestId) {
      console.log('[DEBUG] fetchContestState: No contestId, clearing state');
      setContest(null);
      setParticipant(null);
      setQuestion(null);
      setAnswer(null);
      setError('Missing contest. Please pick a contest from the list and try again.');
      setLoading(false);
      return;
    }
    console.log('[DEBUG] fetchContestState: Starting fetch for contestId:', contestId);
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
    console.log('[DEBUG] fetchContestState: completed successfully');
    setLoading(false);
  }, [contestId, userId]);

  useEffect(() => {
    if (!hasInitializedRef.current && contestId) {
      console.log('[DEBUG] Initial fetch effect triggered');
      hasInitializedRef.current = true;
      void fetchContestState();
    }
  }, [contestId, fetchContestState]);

  useEffect(() => {
    if (!contestId || !hasInitializedRef.current) return undefined;

    const unsubscribes: Array<() => void> = [];

    const contestUnsub = subscribeToContest(contestId, (updatedContest: ContestRow) => {
      console.log('[DEBUG] Realtime contest update:', { state: updatedContest.state, current_round: updatedContest.current_round });
      setContest(updatedContest);
    });
    unsubscribes.push(contestUnsub);

    if (participant?.id) {
      const participantUnsub = subscribeToParticipant(participant.id, (updated) => {
        console.log('[DEBUG] Realtime participant update:', { id: updated.id, eliminated: updated.elimination_round });
        setParticipant(updated);
      });
      unsubscribes.push(participantUnsub);

      const answersUnsub = subscribeToAnswersForParticipant(
        participant.id,
        (payload: RealtimePostgresChangesPayload<AnswerRow>) => {
          if (payload.new && typeof payload.new === 'object') {
            console.log('[DEBUG] Realtime answer update:', { question_id: (payload.new as AnswerRow).question_id });
            setAnswer(payload.new as AnswerRow);
          }
        },
      );
      unsubscribes.push(answersUnsub);
    }

    const questionsUnsub = subscribeToQuestions(contestId, (payload) => {
      const nextQuestion = payload.new as QuestionRow | null;
      const currentRound = contestRoundRef.current || questionRoundRef.current;
      if (nextQuestion && nextQuestion.round <= currentRound) {
        console.log('[DEBUG] Realtime question update:', { round: nextQuestion.round });
        setQuestion((current) =>
          nextQuestion.round >= (current?.round ?? 0) ? nextQuestion : current,
        );
      }
    });
    unsubscribes.push(questionsUnsub);

    return () => {
      unsubscribes.forEach((unsub) => unsub());
    };
  }, [contestId, participant?.id]);

  useEffect(() => {
    contestRoundRef.current = contest?.current_round ?? 0;
  }, [contest?.current_round]);

  useEffect(() => {
    if (!contest?.current_round) {
      return;
    }

    const currentRound = contest.current_round;
    setQuestion((prev) => (prev && prev.round !== currentRound ? null : prev));
    setAnswer((prev) => (prev && prev.round !== currentRound ? null : prev));
  }, [contest?.current_round]);

  useEffect(() => {
    questionRoundRef.current = question?.round ?? 0;
  }, [question?.round]);

  useEffect(() => {
    const loadCurrentQuestion = async () => {
      console.log('[DEBUG] loadCurrentQuestion effect triggered, current_round:', contest?.current_round);
      if (!contestId || !contest?.current_round || !hasInitializedRef.current) {
        console.log('[DEBUG] loadCurrentQuestion skipped - missing deps');
        return;
      }

      console.log('[DEBUG] loadCurrentQuestion: fetching question for round:', contest.current_round);
      const questionResult = await getQuestionForRound(contestId, contest.current_round);
      if (!questionResult.ok) {
        console.log('[DEBUG] loadCurrentQuestion: failed to fetch question');
        setError(getErrorMessage(questionResult.error));
        return;
      }

      const roundQuestion = questionResult.value;
      console.log('[DEBUG] loadCurrentQuestion: got question:', roundQuestion?.id);
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
        console.log('[DEBUG] loadCurrentQuestion: got answer for question:', roundQuestion.id);
        setAnswer((prev) => {
          if (prev?.question_id === roundQuestion.id) return prev;
          return answerResult.value;
        });
      }
    };

    void loadCurrentQuestion();
  }, [contest?.current_round, contestId, participant?.id]);

  useFocusEffect(
    useCallback(() => {
      console.log('[DEBUG] useFocusEffect fired, contestId:', contestId, 'hasInitialized:', hasInitializedRef.current);

      // Skip the first run (initial mount is handled by useEffect)
      if (!hasFocusEffectRunRef.current) {
        hasFocusEffectRunRef.current = true;
        console.log('[DEBUG] useFocusEffect skipping first run');
        return;
      }

      if (contestId && hasInitializedRef.current) {
        console.log('[DEBUG] → Triggering fetchContestState from focus');
        void fetchContestState();
      }
    }, [contestId, fetchContestState]),
  );

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

  console.log('[DEBUG] useContestState returning state:', {
    loading,
    playerState,
    contestState: contest?.state,
    currentRound: contest?.current_round,
    hasParticipant: !!participant,
    hasQuestion: !!question,
  });

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
    [
      loading,
      error,
      contest,
      participant,
      question,
      answer,
      playerState,
      fetchContestState,
      handleSubmit,
    ],
  );
};

export default useContestState;
