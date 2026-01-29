/**
 * Verifies pending approval state on contest registration.
 */
import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react-native';

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
const mockStartDemo = jest.fn();

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
    demoPhase: null,
    startDemo: mockStartDemo,
    exitDemo: jest.fn(),
    setDemoTip: jest.fn(),
    setDemoPhase: jest.fn(),
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

describe('ContestListScreen pending approval', () => {
  beforeEach(() => {
    __router.reset();
    resetState();
  });

  test('shows pending approval when participant is pending', () => {
    const contest = makeContest({
      id: 'contest-1',
      name: 'Contest-1',
      state: CONTEST_STATE.LOBBY_OPEN,
    });
    mockState.contests = [contest];
    mockState.participants = new Map([
      [
        contest.id,
        makeParticipant({
          contest_id: contest.id,
          user_id: mockUserId,
          registration_status: REGISTRATION_STATUS.PENDING,
        }),
      ],
    ]);

    const view = renderScreen();

    expect(view.getByTestId('label-Contest-1').props.children).toBe('Pending approval');
    expect(view.getByTestId('disabled-Contest-1').props.children).toBe('true');
  });

  test('does not navigate after registration when participant is pending', async () => {
    const contest = makeContest({
      id: 'contest-2',
      name: 'Contest-2',
      state: CONTEST_STATE.LOBBY_OPEN,
    });
    mockState.contests = [contest];
    mockState.registerForContest.mockResolvedValue(
      makeParticipant({
        contest_id: contest.id,
        user_id: mockUserId,
        registration_status: REGISTRATION_STATUS.PENDING,
      }),
    );

    const view = renderScreen();

    fireEvent.press(view.getByTestId('ticket-Contest-2'));

    await waitFor(() => expect(mockState.registerForContest).toHaveBeenCalledWith(contest.id));
    expect(__router.getEvents()).toHaveLength(0);
  });
});
