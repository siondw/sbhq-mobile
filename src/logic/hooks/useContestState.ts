import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { getAnswerForQuestion, submitAnswer, type SubmitAnswerParams } from '../../db/answers';
import { getContestById } from '../../db/contests';
import { getErrorMessage } from '../../db/errors';
import { getOrCreateParticipant, getParticipantForUser } from '../../db/participants';
import { getQuestionForRound } from '../../db/questions';
import { subscribeToBroadcast } from '../../db/realtime';
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

export interface UseContestStateOptions {
  /** Called when a submission is blocked due to RLS policy (round closed) */
  onSubmissionClosed?: () => void;
}

export const useContestState = (
  contestId?: string,
  userId?: string,
  options?: UseContestStateOptions,
): UseContestStateResult => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [contest, setContest] = useState<ContestRow | null>(null);
  const [participant, setParticipant] = useState<ParticipantRow | null>(null);
  const [question, setQuestion] = useState<QuestionRow | null>(null);
  const [answer, setAnswer] = useState<AnswerRow | null>(null);
  const hasInitializedRef = useRef(false);
  const hasFocusEffectRunRef = useRef(false);
  const contestRoundRef = useRef<number>(0);
  const contextVersionRef = useRef(0);
  const snapshotRequestRef = useRef(0);
  const broadcastVersionRef = useRef(0);
  const questionVersionRef = useRef(0);
  const answerVersionRef = useRef(0);
  const participantRequestRef = useRef(0);
  const questionRef = useRef<QuestionRow | null>(null);

  const fetchContestState = useCallback(async () => {
    if (!contestId) return;

    const requestId = ++snapshotRequestRef.current;
    const contextVersion = contextVersionRef.current;
    const isCurrent = () =>
      contextVersionRef.current === contextVersion && snapshotRequestRef.current === requestId;

    setLoading(true);
    setError(null);

    try {
      while (isCurrent()) {
        const broadcastVersion = broadcastVersionRef.current;
        const answerVersion = answerVersionRef.current;
        const participantRequest = ++participantRequestRef.current;
        const [contestResult, participantResult] = await Promise.all([
          getContestById(contestId),
          userId
            ? getParticipantForUser(contestId, userId)
            : Promise.resolve<Result<ParticipantRow | null, never>>({ ok: true, value: null }),
        ]);

        if (!isCurrent()) return;
        if (broadcastVersionRef.current !== broadcastVersion) continue;
        if (!contestResult.ok || !participantResult.ok) {
          const failure = !contestResult.ok ? contestResult : participantResult;
          if (!failure.ok) setError(getErrorMessage(failure.error));
          return;
        }

        const nextContest = contestResult.value;
        let nextParticipant = participantResult.value;
        if (nextContest && userId && !nextParticipant) {
          const createResult = await getOrCreateParticipant(nextContest.id, userId);
          if (!isCurrent()) return;
          if (broadcastVersionRef.current !== broadcastVersion) continue;
          if (!createResult.ok) {
            setError(getErrorMessage(createResult.error));
            return;
          }
          nextParticipant = createResult.value;
        }

        let nextQuestion: QuestionRow | null = null;
        let nextAnswer: AnswerRow | null = null;
        if (nextContest?.current_round) {
          const questionResult = await getQuestionForRound(
            nextContest.id,
            nextContest.current_round,
          );
          if (!isCurrent()) return;
          if (broadcastVersionRef.current !== broadcastVersion) continue;
          if (!questionResult.ok) {
            setError(getErrorMessage(questionResult.error));
            return;
          }
          nextQuestion = questionResult.value;
          if (nextParticipant && nextQuestion) {
            const answerResult = await getAnswerForQuestion(nextParticipant.id, nextQuestion.id);
            if (!isCurrent()) return;
            if (broadcastVersionRef.current !== broadcastVersion) continue;
            if (!answerResult.ok) {
              setError(getErrorMessage(answerResult.error));
              return;
            }
            nextAnswer = answerResult.value;
          }
        }

        contestRoundRef.current = nextContest?.current_round ?? 0;
        questionVersionRef.current += 1;
        questionRef.current = nextQuestion;
        setContest(nextContest);
        if (participantRequestRef.current === participantRequest) setParticipant(nextParticipant);
        setQuestion(nextQuestion);
        if (answerVersionRef.current === answerVersion) {
          answerVersionRef.current += 1;
          setAnswer(nextAnswer);
        }
        return;
      }
    } finally {
      if (isCurrent()) setLoading(false);
    }
  }, [contestId, userId]);

  const refreshParticipant = useCallback(async () => {
    if (!contestId || !userId) return;
    const contextVersion = contextVersionRef.current;
    const round = contestRoundRef.current;
    const requestId = ++participantRequestRef.current;
    const result = await getParticipantForUser(contestId, userId);
    if (
      contextVersionRef.current === contextVersion &&
      contestRoundRef.current === round &&
      participantRequestRef.current === requestId &&
      result.ok
    ) {
      setParticipant(result.value);
    }
  }, [contestId, userId]);

  useEffect(() => {
    contextVersionRef.current += 1;
    hasInitializedRef.current = !!contestId;
    hasFocusEffectRunRef.current = false;
    contestRoundRef.current = 0;
    questionRef.current = null;
    setContest(null);
    setParticipant(null);
    setQuestion(null);
    setAnswer(null);
    setError(null);
    setLoading(!!contestId);
    if (contestId) void fetchContestState();

    return () => {
      contextVersionRef.current += 1;
      snapshotRequestRef.current += 1;
    };
  }, [contestId, userId, fetchContestState]);

  useEffect(() => {
    if (!contestId) return undefined;
    const contextVersion = contextVersionRef.current;
    const receiveQuestion = (data: ContestRow | QuestionRow) => {
      if (
        contextVersionRef.current !== contextVersion ||
        !('question' in data) ||
        data.contest_id !== contestId
      )
        return;

      broadcastVersionRef.current += 1;
      if (data.round !== contestRoundRef.current) return;
      questionVersionRef.current += 1;
      questionRef.current = data;
      setQuestion(data);
    };

    return subscribeToBroadcast<ContestRow | QuestionRow>(`contest:${contestId}`, [
      {
        event: 'UPDATE',
        callback: (data) => {
          if (contextVersionRef.current !== contextVersion) return;
          if ('state' in data && data.id === contestId) {
            broadcastVersionRef.current += 1;
            contestRoundRef.current = data.current_round ?? 0;
            setContest(data);
            questionRef.current =
              questionRef.current?.round === data.current_round ? questionRef.current : null;
            setQuestion(questionRef.current);
            setAnswer((current) => (current?.round === data.current_round ? current : null));
          } else {
            receiveQuestion(data);
          }
        },
      },
      { event: 'INSERT', callback: receiveQuestion },
    ]);
  }, [contestId, userId]);

  useEffect(() => {
    if (question?.processing_status === 'COMPLETE') {
      void refreshParticipant();
    }
  }, [contestId, question?.id, question?.processing_status, question?.round, refreshParticipant]);

  useEffect(() => {
    let active = true;
    const contextVersion = contextVersionRef.current;
    const currentRound = contest?.current_round;
    const questionVersion = questionVersionRef.current;
    const answerVersion = answerVersionRef.current;
    const isCurrent = () =>
      active &&
      contextVersionRef.current === contextVersion &&
      contestRoundRef.current === currentRound;

    const loadCurrentQuestion = async () => {
      if (!contestId || !contest?.current_round || !hasInitializedRef.current) {
        return;
      }

      const questionResult = await getQuestionForRound(contestId, contest.current_round);
      if (!isCurrent()) return;
      const superseded = questionVersionRef.current !== questionVersion;
      if (!questionResult.ok && !superseded) {
        setError(getErrorMessage(questionResult.error));
        return;
      }

      const roundQuestion = superseded
        ? questionRef.current
        : questionResult.ok
          ? questionResult.value
          : null;
      if (roundQuestion && !superseded) {
        questionRef.current = roundQuestion;
        setQuestion(roundQuestion);
      }

      if (participant?.id && roundQuestion) {
        const answerResult = await getAnswerForQuestion(participant.id, roundQuestion.id);
        if (!isCurrent() || answerVersionRef.current !== answerVersion) return;
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
    return () => {
      active = false;
    };
  }, [contest?.current_round, contestId, participant?.id]);

  useFocusEffect(
    useCallback(() => {
      // Skip the first run (initial mount is handled by useEffect)
      if (!hasFocusEffectRunRef.current) {
        hasFocusEffectRunRef.current = true;
        return;
      }

      if (contestId && hasInitializedRef.current) {
        void fetchContestState();
      }
    }, [contestId, fetchContestState]),
  );

  const playerState = useMemo(
    () => derivePlayerState(contest, participant, question, answer),
    [answer, contest, participant, question],
  );

  const handleSubmit = useCallback(
    async (payload: SubmitAnswerParams) => {
      const contextVersion = contextVersionRef.current;
      const result = await submitAnswer(payload);
      if (contextVersionRef.current !== contextVersion || contestRoundRef.current !== payload.round)
        return;
      if (!result.ok) {
        setError(getErrorMessage(result.error));
        if (result.error.type === 'SUBMISSION_CLOSED') {
          options?.onSubmissionClosed?.();
        }
        return;
      }
      answerVersionRef.current += 1;
      setAnswer(result.value);
    },
    [options],
  );

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
