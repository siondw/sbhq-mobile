/**
 * Flow: useContestState (offline) — realtime + focus refresh
 *
 * These tests intentionally exercise:
 * - initial fetch (no Supabase)
 * - realtime subscription callbacks
 * - focus refresh behavior (useFocusEffect)
 *
 * Additionally: one regression test wires `useContestState` into `ContestRouter` to catch
 * unwanted intermediate routing during realtime transitions.
 */
import React, { useMemo } from 'react';
import { Text, View } from 'react-native';
import { act, render, waitFor } from '@testing-library/react-native';

import type { AnswerRow, ContestRow, ParticipantRow, QuestionRow } from '../../src/db/types';
import { CONTEST_STATE, PLAYER_STATE } from '../../src/logic/constants';
import { useContestState } from '../../src/logic/hooks/useContestState';
import { ContestRouter } from '../../src/logic/routing/ContestRouter';
import { __router } from '../mocks/expo-router';
import {
  DEFAULT_CONTEST_ID,
  DEFAULT_PARTICIPANT_ID,
  DEFAULT_QUESTION_ID,
  DEFAULT_USER_ID,
  makeAnswer,
  makeContest,
  makeParticipant,
  makeQuestion,
} from '../support/builders';

type OkResult<T> = { ok: true; value: T };

const mockOk = <T,>(value: T): OkResult<T> => ({ ok: true, value });

let mockContestRow: ContestRow = makeContest({ state: CONTEST_STATE.LOBBY_OPEN });
let mockParticipantRow: ParticipantRow | null = makeParticipant({
  id: DEFAULT_PARTICIPANT_ID,
  elimination_round: null,
});
let mockQuestionRow: QuestionRow | null = null;
let mockAnswerRow: AnswerRow | null = null;

let mockContestSubscriptionCallback: ((updated: ContestRow) => void) | null = null;
let mockQuestionsSubscriptionCallback: ((payload: { new: unknown }) => void) | null = null;
let mockParticipantSubscriptionCallback: ((updated: ParticipantRow) => void) | null = null;
let mockAnswerSubscriptionCallback: ((payload: { new: unknown; old?: unknown }) => void) | null =
  null;

let mockSubscribeToContestCallCount = 0;
let mockSubscribeToQuestionsCallCount = 0;
let mockSubscribeToParticipantCallCount = 0;
let mockSubscribeToAnswersCallCount = 0;

let mockSubscribedContestIds: string[] = [];
let mockSubscribedQuestionsContestIds: string[] = [];
let mockSubscribedParticipantIds: string[] = [];
let mockSubscribedAnswersParticipantIds: string[] = [];

const mockContestUnsub = jest.fn();
const mockQuestionsUnsub = jest.fn();
const mockParticipantUnsub = jest.fn();
const mockAnswersUnsub = jest.fn();

const mockGetContestById = jest.fn(async (_contestId: string) => mockOk(mockContestRow));
const mockGetParticipantForUser = jest.fn(async (_contestId: string, _userId: string) =>
  mockOk(mockParticipantRow),
);
const mockGetOrCreateParticipant = jest.fn(async (_contestId: string, _userId: string) =>
  mockOk(mockParticipantRow as ParticipantRow),
);
const mockGetQuestionForRound = jest.fn(async (_contestId: string, _round: number) =>
  mockOk(mockQuestionRow),
);
const mockGetAnswerForQuestion = jest.fn(async (_participantId: string, _questionId: string) =>
  mockOk(mockAnswerRow),
);

jest.mock('../../src/logic/contexts', () => ({
  useNotificationRouting: () => ({
    pendingResultIntent: null,
    clearPendingResultIntent: jest.fn(),
    setPendingResultIntent: jest.fn(),
  }),
}));

jest.mock('../../src/ui/components/LoadingView', () => {
  const React = require('react');
  const { View } = require('react-native');
  return function LoadingViewMock() {
    return React.createElement(View, { testID: 'loading' });
  };
});

jest.mock('../../src/db/contests', () => ({
  getContestById: (contestId: string) => mockGetContestById(contestId),
  subscribeToContest: (contestId: string, onChange: (updated: ContestRow) => void) => {
    mockSubscribeToContestCallCount += 1;
    mockSubscribedContestIds.push(contestId);
    mockContestSubscriptionCallback = onChange;
    return mockContestUnsub;
  },
}));

jest.mock('../../src/db/participants', () => ({
  getParticipantForUser: (contestId: string, userId: string) =>
    mockGetParticipantForUser(contestId, userId),
  getOrCreateParticipant: (contestId: string, userId: string) =>
    mockGetOrCreateParticipant(contestId, userId),
  subscribeToParticipant: (participantId: string, onChange: (updated: ParticipantRow) => void) => {
    mockSubscribeToParticipantCallCount += 1;
    mockSubscribedParticipantIds.push(participantId);
    mockParticipantSubscriptionCallback = onChange;
    return mockParticipantUnsub;
  },
}));

jest.mock('../../src/db/questions', () => ({
  getQuestionForRound: (contestId: string, round: number) =>
    mockGetQuestionForRound(contestId, round),
  subscribeToQuestions: (contestId: string, onChange: (payload: { new: unknown }) => void) => {
    mockSubscribeToQuestionsCallCount += 1;
    mockSubscribedQuestionsContestIds.push(contestId);
    mockQuestionsSubscriptionCallback = onChange;
    return mockQuestionsUnsub;
  },
}));

jest.mock('../../src/db/answers', () => ({
  getAnswerForQuestion: (participantId: string, questionId: string) =>
    mockGetAnswerForQuestion(participantId, questionId),
  submitAnswer: async () => ({ ok: true, value: null }),
  subscribeToAnswersForParticipant: (
    participantId: string,
    onChange: (payload: { new: unknown; old?: unknown }) => void,
  ) => {
    mockSubscribeToAnswersCallCount += 1;
    mockSubscribedAnswersParticipantIds.push(participantId);
    mockAnswerSubscriptionCallback = onChange;
    return mockAnswersUnsub;
  },
}));

jest.mock('../../src/db/errors', () => ({
  getErrorMessage: (e: unknown) => String(e),
}));

const Harness = ({ contestId, userId }: { contestId: string; userId: string }) => {
  const state = useContestState(contestId, userId);

  const summary = useMemo(
    () => ({
      loading: state.loading,
      playerState: state.playerState,
      contestState: state.contest?.state ?? null,
      currentRound: state.contest?.current_round ?? null,
      questionId: state.question?.id ?? null,
      answerId: state.answer?.id ?? null,
    }),
    [
      state.loading,
      state.playerState,
      state.contest?.state,
      state.contest?.current_round,
      state.question?.id,
      state.answer?.id,
    ],
  );

  return (
    <View>
      <Text testID="loading">{String(summary.loading)}</Text>
      <Text testID="playerState">{summary.playerState}</Text>
      <Text testID="contestState">{summary.contestState ?? 'null'}</Text>
      <Text testID="currentRound">
        {summary.currentRound === null ? 'null' : String(summary.currentRound)}
      </Text>
      <Text testID="questionId">{summary.questionId ?? 'null'}</Text>
      <Text testID="answerId">{summary.answerId ?? 'null'}</Text>
    </View>
  );
};

const ScreenMarker = ({ name }: { name: string }) => <View testID={`screen.${name}`} />;

const RoutedHarness = ({ contestId, userId }: { contestId: string; userId: string }) => {
  const state = useContestState(contestId, userId);
  const path = __router.getPathname();

  if (path.startsWith('/correct/')) {
    return (
      <ContestRouter
        contestId={contestId}
        playerState={state.playerState}
        loading={state.loading}
        validState={PLAYER_STATE.CORRECT_WAITING_NEXT}
      >
        <ScreenMarker name="correct" />
      </ContestRouter>
    );
  }

  if (path.startsWith('/submitted/')) {
    return (
      <ContestRouter
        contestId={contestId}
        playerState={state.playerState}
        loading={state.loading}
        validState={PLAYER_STATE.SUBMITTED_WAITING}
      >
        <ScreenMarker name="submitted" />
      </ContestRouter>
    );
  }

  if (path.startsWith('/game/')) {
    return (
      <ContestRouter
        contestId={contestId}
        playerState={state.playerState}
        loading={state.loading}
        validState={PLAYER_STATE.ANSWERING}
      >
        <ScreenMarker name="game" />
      </ContestRouter>
    );
  }

  return <View testID="screen.unknown" />;
};

describe('Flow: useContestState (offline) — realtime + focus refresh', () => {
  beforeEach(() => {
    __router.reset();

    mockContestRow = makeContest({ state: CONTEST_STATE.LOBBY_OPEN, current_round: null });
    mockParticipantRow = makeParticipant({ id: DEFAULT_PARTICIPANT_ID, elimination_round: null });
    mockQuestionRow = null;
    mockAnswerRow = null;

    mockContestSubscriptionCallback = null;
    mockQuestionsSubscriptionCallback = null;
    mockParticipantSubscriptionCallback = null;
    mockAnswerSubscriptionCallback = null;

    mockSubscribeToContestCallCount = 0;
    mockSubscribeToQuestionsCallCount = 0;
    mockSubscribeToParticipantCallCount = 0;
    mockSubscribeToAnswersCallCount = 0;

    mockSubscribedContestIds = [];
    mockSubscribedQuestionsContestIds = [];
    mockSubscribedParticipantIds = [];
    mockSubscribedAnswersParticipantIds = [];

    mockContestUnsub.mockClear();
    mockQuestionsUnsub.mockClear();
    mockParticipantUnsub.mockClear();
    mockAnswersUnsub.mockClear();

    mockGetContestById.mockClear();
    mockGetParticipantForUser.mockClear();
    mockGetOrCreateParticipant.mockClear();
    mockGetQuestionForRound.mockClear();
    mockGetAnswerForQuestion.mockClear();
  });

  test('realtime contest update drives state: LOBBY_OPEN → ROUND_IN_PROGRESS (ANSWERING) → answer arrives (SUBMITTED_WAITING)', async () => {
    /**
     * Scenario:
     * - Start in lobby (LOBBY_OPEN).
     * - Realtime updates contest to ROUND_IN_PROGRESS with a current_round and a question exists.
     * - Answer arrives via realtime; player becomes SUBMITTED_WAITING.
     */
    const view = render(<Harness contestId={DEFAULT_CONTEST_ID} userId={DEFAULT_USER_ID} />);

    await waitFor(() => expect(view.getByTestId('loading').props.children).toBe('false'));
    expect(view.getByTestId('playerState').props.children).toBe(PLAYER_STATE.LOBBY);

    expect(mockContestSubscriptionCallback).not.toBeNull();
    expect(mockQuestionsSubscriptionCallback).not.toBeNull();

    await waitFor(() => {
      expect(mockSubscribedContestIds).toContain(DEFAULT_CONTEST_ID);
      expect(mockSubscribedQuestionsContestIds).toContain(DEFAULT_CONTEST_ID);
      expect(mockSubscribedParticipantIds).toContain(DEFAULT_PARTICIPANT_ID);
      expect(mockSubscribedAnswersParticipantIds).toContain(DEFAULT_PARTICIPANT_ID);
    });

    // Contest goes live
    mockContestRow = makeContest({
      id: DEFAULT_CONTEST_ID,
      state: CONTEST_STATE.ROUND_IN_PROGRESS,
      current_round: 1,
    });
    mockQuestionRow = makeQuestion({
      id: DEFAULT_QUESTION_ID,
      contest_id: DEFAULT_CONTEST_ID,
      round: 1,
    });
    mockAnswerRow = null;

    act(() => {
      mockContestSubscriptionCallback?.(mockContestRow);
    });

    await waitFor(() => {
      expect(view.getByTestId('contestState').props.children).toBe(CONTEST_STATE.ROUND_IN_PROGRESS);
      expect(view.getByTestId('currentRound').props.children).toBe('1');
    });

    await waitFor(() => {
      expect(view.getByTestId('questionId').props.children).toBe(DEFAULT_QUESTION_ID);
      expect(view.getByTestId('playerState').props.children).toBe(PLAYER_STATE.ANSWERING);
    });

    // Answer arrives via realtime subscription payload
    const answer = makeAnswer({
      id: '00000000-0000-0000-0000-0000000000ef',
      contest_id: DEFAULT_CONTEST_ID,
      participant_id: DEFAULT_PARTICIPANT_ID,
      question_id: DEFAULT_QUESTION_ID,
      round: 1,
      answer: 'A',
    });
    mockAnswerRow = answer;
    act(() => {
      mockAnswerSubscriptionCallback?.({ new: answer });
    });

    await waitFor(() => {
      expect(view.getByTestId('answerId').props.children).toBe(answer.id);
      expect(view.getByTestId('playerState').props.children).toBe(PLAYER_STATE.SUBMITTED_WAITING);
    });
  });

  test('focus refresh: skips first focus event, refetches on subsequent focus', async () => {
    /**
     * Scenario:
     * - Initial mount triggers the initial fetch.
     * - First focus event is intentionally skipped (to avoid double-fetch on mount).
     * - Next focus event triggers a refresh fetch.
     */
    render(<Harness contestId={DEFAULT_CONTEST_ID} userId={DEFAULT_USER_ID} />);

    await waitFor(() => expect(mockGetContestById).toHaveBeenCalledTimes(1));

    await act(async () => {
      __router.triggerFocus();
    });
    await waitFor(() => expect(mockGetContestById).toHaveBeenCalledTimes(1));

    await act(async () => {
      __router.triggerFocus();
    });
    await waitFor(() => expect(mockGetContestById).toHaveBeenCalledTimes(2));
  });

  test('subscriptions are cleaned up on unmount', async () => {
    const view = render(<Harness contestId={DEFAULT_CONTEST_ID} userId={DEFAULT_USER_ID} />);
    await waitFor(() => expect(view.getByTestId('loading').props.children).toBe('false'));

    view.unmount();

    expect(mockSubscribeToContestCallCount).toBeGreaterThan(0);
    expect(mockSubscribeToQuestionsCallCount).toBeGreaterThan(0);
    expect(mockSubscribeToParticipantCallCount).toBeGreaterThan(0);
    expect(mockSubscribeToAnswersCallCount).toBeGreaterThan(0);

    expect(mockContestUnsub).toHaveBeenCalledTimes(mockSubscribeToContestCallCount);
    expect(mockQuestionsUnsub).toHaveBeenCalledTimes(mockSubscribeToQuestionsCallCount);
    expect(mockParticipantUnsub).toHaveBeenCalledTimes(mockSubscribeToParticipantCallCount);
    expect(mockAnswersUnsub).toHaveBeenCalledTimes(mockSubscribeToAnswersCallCount);
  });

  test('regression: Correct → Game without visiting Submitted when next round opens', async () => {
    /**
     * Scenario:
     * - User is on /correct/{contestId} with round 1 result posted and they were correct.
     * - Admin opens the next round (contest becomes ROUND_IN_PROGRESS with current_round = 2).
     *
     * Expect:
     * - We navigate to /game/{contestId}.
     * - We do not transiently route to /submitted/{contestId}.
     */
    __router.setPathname(`/correct/${DEFAULT_CONTEST_ID}`);

    mockContestRow = makeContest({
      id: DEFAULT_CONTEST_ID,
      state: CONTEST_STATE.ROUND_CLOSED,
      current_round: 1,
    });
    mockParticipantRow = makeParticipant({ id: DEFAULT_PARTICIPANT_ID, elimination_round: null });
    mockQuestionRow = makeQuestion({
      id: DEFAULT_QUESTION_ID,
      contest_id: DEFAULT_CONTEST_ID,
      round: 1,
      correct_option: ['A'],
    });
    mockAnswerRow = makeAnswer({
      id: '00000000-0000-0000-0000-0000000000ef',
      contest_id: DEFAULT_CONTEST_ID,
      participant_id: DEFAULT_PARTICIPANT_ID,
      question_id: DEFAULT_QUESTION_ID,
      round: 1,
      answer: 'A',
    });

    const view = render(<RoutedHarness contestId={DEFAULT_CONTEST_ID} userId={DEFAULT_USER_ID} />);

    await waitFor(() => expect(view.getByTestId('screen.correct')).toBeTruthy());

    // Next round opens
    mockContestRow = makeContest({
      id: DEFAULT_CONTEST_ID,
      state: CONTEST_STATE.ROUND_IN_PROGRESS,
      current_round: 2,
    });

    act(() => {
      mockContestSubscriptionCallback?.(mockContestRow);
    });

    await waitFor(() => expect(__router.getPathname()).toBe(`/game/${DEFAULT_CONTEST_ID}`));

    view.rerender(<RoutedHarness contestId={DEFAULT_CONTEST_ID} userId={DEFAULT_USER_ID} />);

    await waitFor(() => expect(view.getByTestId('screen.game')).toBeTruthy());

    const resolvedPaths = __router.getEvents().map((event) => event.resolvedPath);
    expect(resolvedPaths).toContain(`/game/${DEFAULT_CONTEST_ID}`);
    expect(resolvedPaths.some((p) => p.startsWith(`/submitted/${DEFAULT_CONTEST_ID}`))).toBe(false);
  });
});
