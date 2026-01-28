/**
 * Scenario: contest list auto-starts demo when eligible.
 * Expected: startDemo runs once on mount.
 */
import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';

import ContestListScreen from '../../src/screens/ContestListScreen';
import { __router } from '../mocks/expo-router';

const mockStartDemo = jest.fn();

const mockState = {
  contests: [],
  contestsLoading: false,
  contestsError: null as string | null,
  participants: new Map(),
  participantsLoading: false,
  participantsError: null as string | null,
  registerForContest: jest.fn<Promise<unknown>, [string]>(async () => null),
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
  mockStartDemo.mockReset();
};

jest.mock('../../src/logic/contexts', () => ({
  useDemoMode: () => ({
    isDemoActive: false,
    startDemo: mockStartDemo,
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

jest.mock('../../src/logic/hooks/useAuth', () => ({
  useAuth: () => ({
    derivedUser: { id: '00000000-0000-0000-0000-0000000000cc' },
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

jest.mock('../../src/ui/components/DemoBanner', () => {
  const React = require('react');
  const { Pressable, Text } = require('react-native');
  return function DemoBannerMock(props: { onStartDemo: () => void }) {
    return (
      <Pressable testID="demo-banner" onPress={props.onStartDemo}>
        <Text>Demo</Text>
      </Pressable>
    );
  };
});

const renderScreen = () => render(<ContestListScreen />);

describe('ContestListScreen demo trigger', () => {
  beforeEach(() => {
    __router.reset();
    resetState();
  });

  test('starts demo when demo banner is pressed', () => {
    const view = renderScreen();
    fireEvent.press(view.getByTestId('demo-banner'));
    expect(mockStartDemo).toHaveBeenCalledTimes(1);
  });
});
