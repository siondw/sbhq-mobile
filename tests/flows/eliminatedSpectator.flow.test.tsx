/**
 * Scenario: eliminated user enters spectator view and cannot submit.
 * Expected: route to /game with spectating param, submit hidden, options disabled.
 */
import React from 'react';
import { fireEvent, render, act, waitFor } from '@testing-library/react-native';
import { View } from 'react-native';

import EliminatedScreen from '../../src/screens/EliminatedScreen';
import GameScreen from '../../src/screens/GameScreen';
import SubmittedScreen from '../../src/screens/SubmittedScreen';
import { CONTEST_STATE, PLAYER_STATE, REGISTRATION_STATUS, type PlayerState } from '../../src/logic/constants';
import type { ContestRow, ParticipantRow, QuestionRow } from '../../src/db/types';
import { __router } from '../mocks/expo-router';

const mockContestId = 'contest-42';
const mockUserId = 'user-123';

jest.mock('@expo/vector-icons', () => ({
  Ionicons: () => null,
}));

const mockContest: ContestRow = {
  id: mockContestId,
  name: 'Spectator Bowl',
  start_time: '2026-01-01T00:00:00Z',
  state: CONTEST_STATE.ROUND_IN_PROGRESS,
  current_round: 1,
  price: null,
  created_at: null,
};

const mockParticipant: ParticipantRow = {
  id: 'participant-1',
  contest_id: mockContestId,
  user_id: mockUserId,
  registration_status: REGISTRATION_STATUS.APPROVED,
  elimination_round: 1,
  created_at: null,
};

const mockQuestion: QuestionRow = {
  id: 'question-1',
  contest_id: mockContestId,
  question: 'Who wins?',
  options: ['Option A', 'Option B'],
  round: 1,
  correct_option: null,
  processing_status: null,
};

const mockContestData: {
  contestId: string;
  loading: boolean;
  error: string | null;
  contest: ContestRow;
  participant: ParticipantRow | null;
  question: QuestionRow | null;
  answer: null;
  playerState: PlayerState;
  refresh: () => Promise<void>;
  submit: () => Promise<void>;
} = {
  contestId: mockContestId,
  loading: false,
  error: null,
  contest: mockContest,
  participant: mockParticipant,
  question: mockQuestion,
  answer: null,
  playerState: PLAYER_STATE.ELIMINATED,
  refresh: jest.fn(async () => undefined),
  submit: jest.fn(async () => undefined),
};

jest.mock('../../src/logic/contexts', () => ({
  useContestData: () => mockContestData,
  useNotificationRouting: () => ({
    pendingResultIntent: null,
    clearPendingResultIntent: jest.fn(),
    setPendingResultIntent: jest.fn(),
  }),
}));

jest.mock('../../src/logic/hooks/useAuth', () => ({
  useAuth: () => ({
    derivedUser: { id: mockUserId, username: 'tester' },
  }),
}));

jest.mock('../../src/logic/hooks/useHeaderHeight', () => ({
  useHeaderHeight: () => 0,
}));

jest.mock('../../src/logic/hooks/useParticipantCount', () => ({
  useParticipantCount: () => ({ count: 123 }),
}));

jest.mock('../../src/logic/hooks/utils', () => ({
  useRefresh: () => ({ refreshing: false, onRefresh: jest.fn() }),
}));

jest.mock('../../src/logic/hooks/useAnswerDistribution', () => ({
  useAnswerDistribution: () => ({ distribution: [] }),
}));

jest.mock('../../src/logic/hooks/useEliminationQuestion', () => ({
  useEliminationQuestion: () => ({ question: null }),
}));

jest.mock('../../src/utils/haptics', () => ({
  eliminationHaptic: jest.fn(),
}));

jest.mock('../../src/ui/components/AppHeader', () => {
  const React = require('react');
  const { View } = require('react-native');
  return function HeaderMock() {
    return React.createElement(View, { testID: 'header' });
  };
});

jest.mock('../../src/ui/components/LoadingView', () => {
  const React = require('react');
  const { View } = require('react-native');
  return function LoadingViewMock() {
    return React.createElement(View, { testID: 'loading' });
  };
});

jest.mock('../../src/ui/components/Button', () => {
  const React = require('react');
  const { Pressable, Text } = require('react-native');
  return function ButtonMock(props: { label: string; onPress: () => void }) {
    return (
      <Pressable testID={`button-${props.label}`} onPress={props.onPress}>
        <Text>{props.label}</Text>
      </Pressable>
    );
  };
});

jest.mock('../../src/ui/components/AnswerOption', () => {
  const React = require('react');
  const { View } = require('react-native');
  return function AnswerOptionMock(props: { label: string; disabled?: boolean }) {
    return (
      <View
        testID={`option-${props.label}`}
        accessibilityState={{ disabled: !!props.disabled }}
      />
    );
  };
});

const RouteApp = () => {
  const path = __router.getPathname();
  if (path.startsWith('/game/')) return <GameScreen />;
  if (path.startsWith('/submitted/')) return <SubmittedScreen />;
  if (path.startsWith('/eliminated/')) return <EliminatedScreen />;
  return <View testID="screen.unknown" />;
};

describe('Flow: eliminated -> spectate -> no submit', () => {
  beforeEach(() => {
    __router.reset();
    jest.useFakeTimers();
    __router.setLocalSearchParams({});
    mockContestData.contest = { ...mockContest };
    mockContestData.participant = { ...mockParticipant, elimination_round: 1 };
    mockContestData.question = { ...mockQuestion };
    mockContestData.answer = null;
    mockContestData.playerState = PLAYER_STATE.ELIMINATED;
  });

  afterEach(() => {
    act(() => {
      jest.runOnlyPendingTimers();
    });
    jest.useRealTimers();
  });

  test('eliminated user enters spectator game and cannot submit', () => {
    __router.setPathname(`/eliminated/${mockContestId}`);

    const eliminatedView = render(<EliminatedScreen />);

    fireEvent.press(eliminatedView.getByTestId('button-Spectate'));

    const events = __router.getEvents();
    expect(events).toHaveLength(1);
    expect(events[0]?.resolvedPath).toBe(`/game/${mockContestId}`);
    expect(events[0]?.href).toMatchObject({
      pathname: '/game/[contestId]',
      params: { contestId: mockContestId, spectating: 'true' },
    });

    __router.setLocalSearchParams({ spectating: 'true' });

    const gameView = render(<GameScreen />);

    expect(gameView.getByText('Who wins?')).toBeTruthy();
    expect(gameView.queryByText('Submit')).toBeNull();

    expect(gameView.getByTestId('option-Option A').props.accessibilityState.disabled).toBe(true);
    expect(gameView.getByTestId('option-Option B').props.accessibilityState.disabled).toBe(true);
  });

  test('participating -> submitted -> eliminated -> spectator', async () => {
    __router.setPathname(`/game/${mockContestId}`);
    mockContestData.playerState = PLAYER_STATE.ANSWERING;
    mockContestData.contest = { ...mockContest, state: CONTEST_STATE.ROUND_IN_PROGRESS };
    mockContestData.participant = { ...mockParticipant, elimination_round: null };

    const view = render(<RouteApp />);

    expect(view.getByText('Submit')).toBeTruthy();

    mockContestData.playerState = PLAYER_STATE.SUBMITTED_WAITING;
    mockContestData.contest = { ...mockContest, state: CONTEST_STATE.ROUND_CLOSED };

    view.rerender(<RouteApp />);

    await waitFor(() => {
      expect(__router.getPathname()).toBe(`/submitted/${mockContestId}`);
    });

    view.rerender(<RouteApp />);
    expect(view.getByText('Who wins?')).toBeTruthy();

    mockContestData.playerState = PLAYER_STATE.ELIMINATED;
    view.rerender(<RouteApp />);

    await waitFor(() => {
      expect(__router.getPathname()).toBe(`/eliminated/${mockContestId}`);
    });

    view.rerender(<RouteApp />);
    fireEvent.press(view.getByTestId('button-Spectate'));

    const events = __router.getEvents();
    expect(events[events.length - 1]?.resolvedPath).toBe(`/game/${mockContestId}`);
    expect(events[events.length - 1]?.href).toMatchObject({
      pathname: '/game/[contestId]',
      params: { contestId: mockContestId, spectating: 'true' },
    });

    __router.setLocalSearchParams({ spectating: 'true' });
    mockContestData.contest = { ...mockContest, state: CONTEST_STATE.ROUND_IN_PROGRESS };
    mockContestData.participant = { ...mockParticipant, elimination_round: 1 };

    view.rerender(<RouteApp />);

    expect(view.getByText('Who wins?')).toBeTruthy();
    expect(view.queryByText('Submit')).toBeNull();
    expect(view.getByText('Spectating')).toBeTruthy();
    expect(view.getByTestId('option-Option A').props.accessibilityState.disabled).toBe(true);
    expect(view.getByTestId('option-Option B').props.accessibilityState.disabled).toBe(true);
  });
});
