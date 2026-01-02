/**
 * Flow: notifications (after tap)
 *
 * We simulate “user tapped a notification” without a device or backend.
 * These tests cover:
 * - notification observer routing
 * - (for result routes) ContestRouter hold-until-state behavior
 */
import React from 'react';
import { View } from 'react-native';
import { render, waitFor } from '@testing-library/react-native';

import { PLAYER_STATE } from '../../src/logic/constants';
import { useNotificationObserver } from '../../src/logic/hooks/useNotificationObserver';
import { ContestRouter } from '../../src/logic/routing/ContestRouter';
import { __notifications } from '../mocks/expo-notifications';
import { __router } from '../mocks/expo-router';
import { DEFAULT_CONTEST_ID, DEFAULT_USER_ID } from '../support/builders';

type PendingIntent = null | {
  contestId: string;
  path: string;
  receivedAt: number;
};

let mockPendingResultIntent: PendingIntent = null;
const mockSetPendingResultIntent = jest.fn((intent: PendingIntent) => {
  mockPendingResultIntent = intent;
});
const mockClearPendingResultIntent = jest.fn(() => {
  mockPendingResultIntent = null;
});

jest.mock('../../src/logic/contexts', () => ({
  useNotificationRouting: () => ({
    pendingResultIntent: mockPendingResultIntent,
    setPendingResultIntent: mockSetPendingResultIntent,
    clearPendingResultIntent: mockClearPendingResultIntent,
  }),
}));

const mockUserId = DEFAULT_USER_ID;

jest.mock('../../src/logic/hooks/useAuth', () => ({
  useAuth: () => ({
    user: { id: mockUserId },
    loading: false,
  }),
}));

type MockParticipant = { elimination_round: number | null } | null;
let mockParticipant: MockParticipant = { elimination_round: null };

jest.mock('../../src/db/participants', () => ({
  getParticipantForUser: async () => ({ ok: true, value: mockParticipant }),
}));

jest.mock('../../src/ui/components/LoadingView', () => {
  const React = require('react');
  const { View } = require('react-native');
  return function LoadingViewMock() {
    return React.createElement(View, { testID: 'loading' });
  };
});

const ObserverHarness = () => {
  useNotificationObserver();
  return <View testID="observer" />;
};

const ScreenMarker = ({ name }: { name: string }) => <View testID={`screen.${name}`} />;

const SubmittedShell = (props: { contestId: string; playerState: string }) => (
  <ContestRouter
    contestId={props.contestId}
    playerState={props.playerState}
    loading={false}
    validState={PLAYER_STATE.SUBMITTED_WAITING}
  >
    <ScreenMarker name="submitted" />
  </ContestRouter>
);

const CorrectShell = (props: { contestId: string; playerState: string }) => (
  <ContestRouter
    contestId={props.contestId}
    playerState={props.playerState}
    loading={false}
    validState={PLAYER_STATE.CORRECT_WAITING_NEXT}
  >
    <ScreenMarker name="correct" />
  </ContestRouter>
);

const EliminatedShell = (props: { contestId: string; playerState: string }) => (
  <ContestRouter
    contestId={props.contestId}
    playerState={props.playerState}
    loading={false}
    validState={PLAYER_STATE.ELIMINATED}
  >
    <ScreenMarker name="eliminated" />
  </ContestRouter>
);

const RouteApp = (props: { contestId: string; playerState: string }) => {
  const path = __router.getPathname();
  if (path.startsWith('/submitted/')) return <SubmittedShell {...props} />;
  if (path.startsWith('/correct/')) return <CorrectShell {...props} />;
  if (path.startsWith('/eliminated/')) return <EliminatedShell {...props} />;
  return <View testID="screen.other" />;
};

describe('Flow: notifications (after tap)', () => {
  beforeEach(() => {
    __router.reset();
    __notifications.reset();
    mockPendingResultIntent = null;
    mockSetPendingResultIntent.mockClear();
    mockClearPendingResultIntent.mockClear();
    mockParticipant = { elimination_round: null };
  });

  test('active user taps QUESTION_OPEN while already in same contest flow (no navigation)', async () => {
    __router.setPathname(`/game/${DEFAULT_CONTEST_ID}`);
    render(<ObserverHarness />);

    __notifications.emitResponse(
      __notifications.makeResponseWithUrl(`/game/${DEFAULT_CONTEST_ID}?round=1`, 'n1'),
    );

    await waitFor(() => {
      expect(__router.getEvents()).toHaveLength(0);
    });
  });

  test('active user taps RESULT_CORRECT from Submitted (hold until correct state)', async () => {
    __router.setPathname(`/submitted/${DEFAULT_CONTEST_ID}`);

    const view = render(
      <View>
        <ObserverHarness />
        <RouteApp contestId={DEFAULT_CONTEST_ID} playerState={PLAYER_STATE.SUBMITTED_WAITING} />
      </View>,
    );

    expect(view.getByTestId('screen.submitted')).toBeTruthy();

    __notifications.emitResponse(
      __notifications.makeResponseWithUrl(`/correct/${DEFAULT_CONTEST_ID}`, 'n2'),
    );

    await waitFor(() => expect(__router.getPathname()).toBe(`/correct/${DEFAULT_CONTEST_ID}`));
    expect(__router.getEvents()).toHaveLength(1);
    expect(__router.getEvents()[0]?.type).toBe('replace');
    expect(mockSetPendingResultIntent).toHaveBeenCalledTimes(1);

    view.rerender(
      <View>
        <ObserverHarness />
        <RouteApp contestId={DEFAULT_CONTEST_ID} playerState={PLAYER_STATE.SUBMITTED_WAITING} />
      </View>,
    );

    expect(view.getByTestId('loading')).toBeTruthy();

    view.rerender(
      <View>
        <ObserverHarness />
        <RouteApp contestId={DEFAULT_CONTEST_ID} playerState={PLAYER_STATE.CORRECT_WAITING_NEXT} />
      </View>,
    );

    await waitFor(() => expect(view.getByTestId('screen.correct')).toBeTruthy());
    await waitFor(() => expect(mockClearPendingResultIntent).toHaveBeenCalled());
  });

  test('active user taps RESULT_ELIMINATED from Submitted (hold until eliminated state)', async () => {
    __router.setPathname(`/submitted/${DEFAULT_CONTEST_ID}`);

    const view = render(
      <View>
        <ObserverHarness />
        <RouteApp contestId={DEFAULT_CONTEST_ID} playerState={PLAYER_STATE.SUBMITTED_WAITING} />
      </View>,
    );

    expect(view.getByTestId('screen.submitted')).toBeTruthy();

    __notifications.emitResponse(
      __notifications.makeResponseWithUrl(`/eliminated/${DEFAULT_CONTEST_ID}?round=1`, 'n3'),
    );

    await waitFor(() =>
      expect(__router.getPathname()).toBe(`/eliminated/${DEFAULT_CONTEST_ID}?round=1`),
    );
    expect(__router.getEvents()).toHaveLength(1);
    expect(__router.getEvents()[0]?.type).toBe('replace');
    expect(mockSetPendingResultIntent).toHaveBeenCalledTimes(1);

    view.rerender(
      <View>
        <ObserverHarness />
        <RouteApp contestId={DEFAULT_CONTEST_ID} playerState={PLAYER_STATE.SUBMITTED_WAITING} />
      </View>,
    );

    expect(view.getByTestId('loading')).toBeTruthy();

    view.rerender(
      <View>
        <ObserverHarness />
        <RouteApp contestId={DEFAULT_CONTEST_ID} playerState={PLAYER_STATE.ELIMINATED} />
      </View>,
    );

    await waitFor(() => expect(view.getByTestId('screen.eliminated')).toBeTruthy());
    await waitFor(() => expect(mockClearPendingResultIntent).toHaveBeenCalled());
  });

  test('active user taps RESULT_CORRECT while already on /correct/{contestId} (no navigation)', async () => {
    __router.setPathname(`/correct/${DEFAULT_CONTEST_ID}`);

    const view = render(
      <View>
        <ObserverHarness />
        <RouteApp contestId={DEFAULT_CONTEST_ID} playerState={PLAYER_STATE.CORRECT_WAITING_NEXT} />
      </View>,
    );

    expect(view.getByTestId('screen.correct')).toBeTruthy();

    __notifications.emitResponse(
      __notifications.makeResponseWithUrl(`/correct/${DEFAULT_CONTEST_ID}`, 'n2b'),
    );

    await waitFor(() => expect(mockSetPendingResultIntent).toHaveBeenCalledTimes(1));
    expect(__router.getEvents()).toHaveLength(0);

    view.rerender(
      <View>
        <ObserverHarness />
        <RouteApp contestId={DEFAULT_CONTEST_ID} playerState={PLAYER_STATE.CORRECT_WAITING_NEXT} />
      </View>,
    );

    expect(view.getByTestId('screen.correct')).toBeTruthy();
    await waitFor(() => {
      expect(mockClearPendingResultIntent).toHaveBeenCalled();
      expect(mockPendingResultIntent).toBeNull();
    });
  });

  test('eliminated user taps a stale/non-result notification anyway (routes to eliminated)', async () => {
    mockParticipant = { elimination_round: 1 };

    __router.setPathname(`/game/${DEFAULT_CONTEST_ID}`);
    render(<ObserverHarness />);

    __notifications.emitResponse(
      __notifications.makeResponseWithUrl(`/game/${DEFAULT_CONTEST_ID}`, 'n4'),
    );

    await waitFor(() => {
      expect(__router.getEvents()).toHaveLength(1);
    });

    expect(__router.getEvents()[0]?.type).toBe('push');
    expect(__router.getPathname()).toBe(`/eliminated/${DEFAULT_CONTEST_ID}`);
  });

  test('duplicate tap de-dupe (same notification identifier)', async () => {
    __router.setPathname(`/submitted/${DEFAULT_CONTEST_ID}`);
    render(<ObserverHarness />);

    const response = __notifications.makeResponseWithUrl(`/correct/${DEFAULT_CONTEST_ID}`, 'same');
    __notifications.emitResponse(response);
    __notifications.emitResponse(response);

    await waitFor(() => {
      expect(__router.getEvents()).toHaveLength(1);
    });
    expect(__router.getEvents()[0]?.type).toBe('replace');
  });
});
