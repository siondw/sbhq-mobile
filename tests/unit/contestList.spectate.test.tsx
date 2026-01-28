/**
 * Verifies spectate CTA for in-progress contests.
 */
import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';

import ContestListScreen from '../../src/screens/ContestListScreen';
import type { ContestRow, ParticipantRow } from '../../src/db/types';
import { CONTEST_STATE, REGISTRATION_STATUS } from '../../src/logic/constants';
import { __router } from '../mocks/expo-router';
import { makeContest, makeParticipant } from '../support/builders';

const mockUserId = '00000000-0000-0000-0000-0000000000cc';

const mockState = {
  contests: [] as ContestRow[],
  contestsLoading: false,
  contestsError: null as string | null,
  participants: new Map<string, ParticipantRow>(),
  participantsLoading: false,
  participantsError: null as string | null,
  registerForContest: jest.fn<Promise<ParticipantRow | null>, [string]>(async () => null),
};

const mockRefreshContests = jest.fn(async () => undefined);
const mockRefreshParticipants = jest.fn(async () => undefined);

const resetState = () => {
  mockState.contests = [];
  mockState.contestsLoading = false;
  mockState.contestsError = null;
  mockState.participants = new Map();
  mockState.participantsLoading = false;
  mockState.participantsError = null;
  mockState.registerForContest.mockReset();
};

jest.mock('../../src/logic/hooks/useAuth', () => ({
  useAuth: () => ({
    derivedUser: { id: mockUserId, username: 'tester' },
    needsOnboarding: false,
    completeOnboarding: jest.fn(),
    error: null,
    loading: false,
  }),
}));

jest.mock('../../src/logic/hooks/useContests', () => ({
  useContests: () => ({
    contests: mockState.contests,
    loading: mockState.contestsLoading,
    error: mockState.contestsError,
    refresh: mockRefreshContests,
  }),
}));

jest.mock('../../src/logic/hooks/useContestRegistration', () => ({
  useContestRegistration: () => ({
    participants: mockState.participants,
    loading: mockState.participantsLoading,
    error: mockState.participantsError,
    registerForContest: mockState.registerForContest,
    refresh: mockRefreshParticipants,
    getParticipantStatus: (contestId: string) => mockState.participants.get(contestId),
  }),
}));

jest.mock('../../src/logic/contexts', () => ({
  useDemoMode: () => ({
    isDemoActive: false,
    shouldShowDemo: false,
    startDemo: jest.fn(),
    exitDemo: jest.fn(),
    setDemoTip: jest.fn(),
  }),
  useNotifications: () => ({
    isRegistered: true,
  }),
  useToast: () => ({
    showToast: jest.fn(),
  }),
}));

jest.mock('../../src/logic/hooks/useHeaderHeight', () => ({
  useHeaderHeight: () => 0,
}));

jest.mock('../../src/logic/hooks/useParticipantCount', () => ({
  useParticipantCount: () => ({ count: 1200, loading: false, error: null }),
}));

jest.mock('../../src/logic/hooks/utils', () => ({
  useRefresh: () => ({ refreshing: false, onRefresh: jest.fn() }),
}));

jest.mock('../../src/utils/storage', () => ({
  getHasSeenPullHint: jest.fn(async () => true),
  setHasSeenPullHint: jest.fn(async () => undefined),
  getHasDismissedNotificationBanner: jest.fn(async () => true),
  setHasDismissedNotificationBanner: jest.fn(async () => undefined),
}));

jest.mock('../../src/ui/components/ContestListTicket', () => {
  const React = require('react');
  const { Pressable, Text } = require('react-native');
  return function ContestListTicketMock(props: {
    title: string;
    buttonLabel: string;
    buttonDisabled?: boolean;
    onPress: () => void;
  }) {
    return (
      <Pressable
        testID={`ticket-${props.title}`}
        onPress={props.onPress}
        disabled={props.buttonDisabled}
      >
        <Text testID={`label-${props.title}`}>{props.buttonLabel}</Text>
        <Text testID={`disabled-${props.title}`}>{String(!!props.buttonDisabled)}</Text>
      </Pressable>
    );
  };
});

jest.mock('../../src/ui/components/OnboardingModal', () => {
  const React = require('react');
  const { View } = require('react-native');
  return function OnboardingModalMock() {
    return React.createElement(View, { testID: 'onboarding' });
  };
});

const renderScreen = () => render(<ContestListScreen />);

describe('ContestListScreen spectate CTA', () => {
  beforeEach(() => {
    __router.reset();
    resetState();
  });

  test('shows Spectate for in-progress contest when not registered', () => {
    const contest = makeContest({
      id: 'contest-1',
      name: 'Contest-1',
      state: CONTEST_STATE.ROUND_IN_PROGRESS,
    });
    mockState.contests = [contest];

    const view = renderScreen();

    expect(view.getByTestId('label-Contest-1').props.children).toBe('Spectate');
    expect(view.getByTestId('disabled-Contest-1').props.children).toBe('false');
  });

  test('navigates to spectate route when Spectate is pressed', () => {
    const contest = makeContest({
      id: 'contest-2',
      name: 'Contest-2',
      state: CONTEST_STATE.ROUND_IN_PROGRESS,
    });
    mockState.contests = [contest];

    const view = renderScreen();

    fireEvent.press(view.getByTestId('ticket-Contest-2'));

    const events = __router.getEvents();
    expect(events).toHaveLength(1);
    expect(events[0]?.resolvedPath).toBe(`/game/${contest.id}`);
    expect(events[0]?.href).toMatchObject({
      pathname: '/game/[contestId]',
      params: { contestId: contest.id, spectating: 'true' },
    });
  });

  test('shows Spectate for eliminated participants in-progress', () => {
    const contest = makeContest({
      id: 'contest-3',
      name: 'Contest-3',
      state: CONTEST_STATE.ROUND_IN_PROGRESS,
    });
    mockState.contests = [contest];
    mockState.participants = new Map([
      [
        contest.id,
        makeParticipant({
          contest_id: contest.id,
          user_id: mockUserId,
          registration_status: REGISTRATION_STATUS.APPROVED,
          elimination_round: 2,
        }),
      ],
    ]);

    const view = renderScreen();

    expect(view.getByTestId('label-Contest-3').props.children).toBe('Spectate');
    expect(view.getByTestId('disabled-Contest-3').props.children).toBe('false');
  });
});
