/**
 * Scenario: spectator view follows contest state (game -> submitted) and exits on finish.
 * Expected: Game during ROUND_IN_PROGRESS, Submitted during ROUND_CLOSED, contests on FINISHED.
 */
import React, { useEffect } from 'react';
import { View } from 'react-native';
import { render, waitFor } from '@testing-library/react-native';

import { CONTEST_STATE, PLAYER_STATE, type PlayerState } from '../../src/logic/constants';
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

type RouteShellProps = {
  contestId: string;
  contestState: (typeof CONTEST_STATE)[keyof typeof CONTEST_STATE];
  playerState: PlayerState;
  loading: boolean;
};

const mountLog: string[] = [];

const ScreenMarker = ({ name }: { name: string }) => {
  useEffect(() => {
    mountLog.push(name);
  }, [name]);
  return <View testID={`screen.${name}`} />;
};

const GameShell = (props: RouteShellProps) => (
  <ContestRouter
    contestId={props.contestId}
    playerState={props.playerState}
    loading={props.loading}
    validState={PLAYER_STATE.ANSWERING}
    contestState={props.contestState}
    validContestStates={[CONTEST_STATE.ROUND_IN_PROGRESS]}
    isSpectating={true}
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
    contestState={props.contestState}
    validContestStates={[CONTEST_STATE.ROUND_CLOSED]}
    isSpectating={true}
  >
    <ScreenMarker name="submitted" />
  </ContestRouter>
);

const RouteApp = (props: RouteShellProps) => {
  const path = __router.getPathname();
  if (path.startsWith('/game/')) return <GameShell {...props} />;
  if (path.startsWith('/submitted/')) return <SubmittedShell {...props} />;
  return <View testID="screen.unknown" />;
};

describe('Flow: spectator routing', () => {
  beforeEach(() => {
    __router.reset();
    mountLog.length = 0;
  });

  test('round in progress -> round closed -> finished', async () => {
    __router.setPathname(`/game/${DEFAULT_CONTEST_ID}`);

    const view = render(
      <RouteApp
        contestId={DEFAULT_CONTEST_ID}
        contestState={CONTEST_STATE.ROUND_IN_PROGRESS}
        playerState={PLAYER_STATE.ELIMINATED}
        loading={false}
      />,
    );

    expect(view.getByTestId('screen.game')).toBeTruthy();

    view.rerender(
      <RouteApp
        contestId={DEFAULT_CONTEST_ID}
        contestState={CONTEST_STATE.ROUND_CLOSED}
        playerState={PLAYER_STATE.ELIMINATED}
        loading={false}
      />,
    );

    await waitFor(() => {
      expect(__router.getPathname()).toBe(`/submitted/${DEFAULT_CONTEST_ID}`);
    });

    view.rerender(
      <RouteApp
        contestId={DEFAULT_CONTEST_ID}
        contestState={CONTEST_STATE.ROUND_CLOSED}
        playerState={PLAYER_STATE.ELIMINATED}
        loading={false}
      />,
    );

    await waitFor(() => expect(view.getByTestId('screen.submitted')).toBeTruthy());

    view.rerender(
      <RouteApp
        contestId={DEFAULT_CONTEST_ID}
        contestState={CONTEST_STATE.FINISHED}
        playerState={PLAYER_STATE.ELIMINATED}
        loading={false}
      />,
    );

    await waitFor(() => {
      expect(__router.getPathname()).toBe('/contests');
    });

    await waitFor(() => expect(mountLog).toEqual(['game', 'submitted']));
  });

  test('submitted screen redirects back to game when round reopens', async () => {
    __router.setPathname(`/submitted/${DEFAULT_CONTEST_ID}`);

    const view = render(
      <RouteApp
        contestId={DEFAULT_CONTEST_ID}
        contestState={CONTEST_STATE.ROUND_IN_PROGRESS}
        playerState={PLAYER_STATE.ELIMINATED}
        loading={false}
      />,
    );

    await waitFor(() => {
      expect(__router.getPathname()).toBe(`/game/${DEFAULT_CONTEST_ID}`);
    });

    view.rerender(
      <RouteApp
        contestId={DEFAULT_CONTEST_ID}
        contestState={CONTEST_STATE.ROUND_IN_PROGRESS}
        playerState={PLAYER_STATE.ELIMINATED}
        loading={false}
      />,
    );

    await waitFor(() => expect(view.getByTestId('screen.game')).toBeTruthy());
  });
});
