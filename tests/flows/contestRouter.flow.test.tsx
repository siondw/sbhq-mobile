/**
 * Scenario: state mismatch correction (anti-wrong-screen).
 * Start: /submitted/{contestId} but playerState === ANSWERING.
 * Expect: Submitted content never renders; redirect to /game/{contestId}.
 */
import React, { useEffect } from 'react';
import { View } from 'react-native';
import { render, waitFor } from '@testing-library/react-native';

import { PLAYER_STATE } from '../../src/logic/constants';
import { ContestRouter } from '../../src/logic/routing/ContestRouter';
import { __router } from '../mocks/expo-router';
import { DEFAULT_CONTEST_ID } from '../support/builders';

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

const mountLog: string[] = [];

const ScreenMarker = ({ name }: { name: string }) => {
  useEffect(() => {
    mountLog.push(name);
  }, [name]);
  return <View testID={`screen.${name}`} />;
};

type RouteShellProps = { contestId: string; playerState: string; loading: boolean };

const LobbyShell = (props: RouteShellProps) => (
  <ContestRouter
    contestId={props.contestId}
    playerState={props.playerState}
    loading={props.loading}
    validState={PLAYER_STATE.LOBBY}
  >
    <ScreenMarker name="lobby" />
  </ContestRouter>
);

const GameShell = (props: RouteShellProps) => (
  <ContestRouter
    contestId={props.contestId}
    playerState={props.playerState}
    loading={props.loading}
    validState={PLAYER_STATE.ANSWERING}
  >
    <ScreenMarker name="game" />
  </ContestRouter>
);

const SubmittedShell = (props: RouteShellProps) => (
  <ContestRouter
    contestId={props.contestId}
    playerState={props.playerState}
    loading={props.loading}
    validState={PLAYER_STATE.SUBMITTED_WAITING}
  >
    <ScreenMarker name="submitted" />
  </ContestRouter>
);

const RouteApp = (props: RouteShellProps) => {
  const path = __router.getPathname();
  if (path.startsWith('/lobby/')) return <LobbyShell {...props} />;
  if (path.startsWith('/game/')) return <GameShell {...props} />;
  if (path.startsWith('/submitted/')) return <SubmittedShell {...props} />;
  return <View testID="screen.unknown" />;
};

describe('Flow: ContestRouter redirect guard', () => {
  beforeEach(() => {
    __router.reset();
    mountLog.length = 0;
  });

  test('does not render the wrong screen before redirect', async () => {
    __router.setPathname(`/submitted/${DEFAULT_CONTEST_ID}`);

    const view = render(
      <RouteApp contestId={DEFAULT_CONTEST_ID} playerState={PLAYER_STATE.ANSWERING} loading={false} />,
    );

    expect(view.getByTestId('loading')).toBeTruthy();
    expect(mountLog).toEqual([]);

    await waitFor(() => {
      expect(__router.getPathname()).toBe(`/game/${DEFAULT_CONTEST_ID}`);
    });

    view.rerender(
      <RouteApp contestId={DEFAULT_CONTEST_ID} playerState={PLAYER_STATE.ANSWERING} loading={false} />,
    );

    expect(view.getByTestId('screen.game')).toBeTruthy();
    expect(mountLog).toEqual(['game']);

    const events = __router.getEvents();
    expect(events).toHaveLength(1);
    expect(events[0]?.type).toBe('replace');
  });
});
