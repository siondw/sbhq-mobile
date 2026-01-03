import { useCallback, useEffect, useMemo, useState } from 'react';
import type { SubmitAnswerParams } from '../../db/answers';
import type { ContestRow } from '../../db/types';
import type { UseContestStateResult } from './useContestState';
import { DEMO_PHASES, type DemoPhase, type HydratedDemoPhase } from '../demo/demoData';
import { derivePlayerState } from '../contest/derivePlayerState';

export interface UseDemoContestStateResult extends UseContestStateResult {
  demoTip: string | null;
  demoPhase: string | null;
}

const getTimedPhaseIndex = (elapsedMs: number) => {
  let cumulative = 0;

  for (let index = 0; index < DEMO_PHASES.length; index += 1) {
    cumulative += DEMO_PHASES[index].durationMs;
    if (elapsedMs < cumulative) {
      return index;
    }
  }

  return DEMO_PHASES.length - 1;
};

const DEMO_PHASE_TAG = {
  ANSWERING: 'ANSWERING',
  CORRECT: 'CORRECT',
} as const;

const buildContest = (phase: DemoPhase, baseTime: number): ContestRow => {
  const { start_time_offset_ms, ...contestBase } = phase.contest;
  const offsetMs = start_time_offset_ms ?? 0;

  return {
    ...contestBase,
    start_time: new Date(baseTime + offsetMs).toISOString(),
  };
};

export const useDemoContestState = (
  contestId?: string,
  userId?: string,
): UseDemoContestStateResult => {
  const isActive = !!contestId && !!userId;

  const [demoStartTime] = useState(Date.now());
  const [forceRender, setForceRender] = useState(0);
  const [manualPhaseIndex, setManualPhaseIndex] = useState(0);
  const [manualAnswers, setManualAnswers] = useState<Record<number, SubmitAnswerParams['answer']>>(
    {},
  );

  // Calculate current phase based on elapsed time
  const { currentPhase, currentPhaseIndex } = useMemo((): {
    currentPhase: HydratedDemoPhase;
    currentPhaseIndex: number;
  } => {
    if (!isActive) {
      const contest = buildContest(DEMO_PHASES[0], demoStartTime);

      return {
        currentPhase: {
          ...DEMO_PHASES[0],
          contest,
        },
        currentPhaseIndex: 0,
      };
    }

    const elapsed = Date.now() - demoStartTime + forceRender;
    const timedPhaseIndex = getTimedPhaseIndex(elapsed);
    const effectivePhaseIndex = Math.min(
      DEMO_PHASES.length - 1,
      Math.max(timedPhaseIndex, manualPhaseIndex),
    );
    const rawPhase = DEMO_PHASES[effectivePhaseIndex];
    const roundKey = rawPhase.question?.round ?? null;
    const manualAnswer = roundKey ? manualAnswers[roundKey] : undefined;
    const question =
      rawPhase.question && manualAnswer && rawPhase.name.includes(DEMO_PHASE_TAG.CORRECT)
        ? {
            ...rawPhase.question,
            correct_option: [manualAnswer],
          }
        : rawPhase.question;
    const answer =
      rawPhase.answer && manualAnswer
        ? {
            ...rawPhase.answer,
            answer: manualAnswer,
          }
        : rawPhase.answer;

    // Hydrate contest with dynamic start_time
    const contest = buildContest(rawPhase, demoStartTime);

    return {
      currentPhase: {
        ...rawPhase,
        contest,
        question,
        answer,
      },
      currentPhaseIndex: effectivePhaseIndex,
    };
  }, [isActive, demoStartTime, forceRender, manualPhaseIndex, manualAnswers]);

  // Re-render every 500ms to advance phases smoothly
  useEffect(() => {
    if (!isActive) return undefined;

    const timer = setInterval(() => {
      setForceRender((v) => v + 1);
    }, 500);

    return () => clearInterval(timer);
  }, [isActive]);

  const playerState = useMemo(
    () =>
      derivePlayerState(
        currentPhase.contest,
        currentPhase.participant,
        currentPhase.question,
        currentPhase.answer,
      ),
    [currentPhase],
  );

  const submit = useCallback(
    (payload: SubmitAnswerParams) => {
      if (!isActive) {
        return Promise.resolve();
      }

      setManualAnswers((prev) => ({
        ...prev,
        [payload.round]: payload.answer,
      }));

      setManualPhaseIndex((prev) => {
        if (!currentPhase.name.endsWith(DEMO_PHASE_TAG.ANSWERING)) {
          return prev;
        }

        return Math.min(DEMO_PHASES.length - 1, Math.max(prev, currentPhaseIndex + 1));
      });

      return Promise.resolve();
    },
    [currentPhase.name, currentPhaseIndex, isActive],
  );
  const refresh = useCallback(() => Promise.resolve(), []);

  return useMemo(
    () => ({
      loading: false,
      error: null,
      contest: currentPhase.contest,
      participant: currentPhase.participant,
      question: currentPhase.question,
      answer: currentPhase.answer,
      playerState,
      refresh,
      submit,
      demoTip: isActive ? currentPhase.tip : null,
      demoPhase: isActive ? currentPhase.name : null,
    }),
    [currentPhase, playerState, refresh, submit, isActive],
  );
};
