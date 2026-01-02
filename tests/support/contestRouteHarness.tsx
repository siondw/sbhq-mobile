import React, { useEffect } from 'react';
import { View } from 'react-native';
import type { RenderAPI } from '@testing-library/react-native';
import { waitFor } from '@testing-library/react-native';

import { PLAYER_STATE, type PlayerState } from '../../src/logic/constants';
import { ContestRouter } from '../../src/logic/routing/ContestRouter';
import { __router } from '../mocks/expo-router';

type RouteShellProps = { contestId: string; playerState: PlayerState; loading: boolean };

const ScreenMarker = ({ name, mountLog }: { name: string; mountLog: string[] }) => {
  useEffect(() => {
    mountLog.push(name);
  }, [name, mountLog]);
  return <View testID={`screen.${name}`} />;
};

const pathForState = (contestId: string, playerState: PlayerState): string => {
  switch (playerState) {
    case PLAYER_STATE.LOBBY:
      return `/lobby/${contestId}`;
    case PLAYER_STATE.ANSWERING:
      return `/game/${contestId}`;
    case PLAYER_STATE.SUBMITTED_WAITING:
      return `/submitted/${contestId}`;
    case PLAYER_STATE.CORRECT_WAITING_NEXT:
      return `/correct/${contestId}`;
    case PLAYER_STATE.ELIMINATED:
      return `/eliminated/${contestId}`;
    case PLAYER_STATE.WINNER:
      return `/winner/${contestId}`;
    case PLAYER_STATE.UNKNOWN:
      throw new Error('Cannot transition to PLAYER_STATE.UNKNOWN');
  }
};

export const createContestRouteApp = (mountLog: string[]) => {
  const LobbyShell = (props: RouteShellProps) => (
    <ContestRouter
      contestId={props.contestId}
      playerState={props.playerState}
      loading={props.loading}
      validState={PLAYER_STATE.LOBBY}
    >
      <ScreenMarker name="lobby" mountLog={mountLog} />
    </ContestRouter>
  );

  const GameShell = (props: RouteShellProps) => (
    <ContestRouter
      contestId={props.contestId}
      playerState={props.playerState}
      loading={props.loading}
      validState={PLAYER_STATE.ANSWERING}
    >
      <ScreenMarker name="game" mountLog={mountLog} />
    </ContestRouter>
  );

  const SubmittedShell = (props: RouteShellProps) => (
    <ContestRouter
      contestId={props.contestId}
      playerState={props.playerState}
      loading={props.loading}
      validState={PLAYER_STATE.SUBMITTED_WAITING}
    >
      <ScreenMarker name="submitted" mountLog={mountLog} />
    </ContestRouter>
  );

  const CorrectShell = (props: RouteShellProps) => (
    <ContestRouter
      contestId={props.contestId}
      playerState={props.playerState}
      loading={props.loading}
      validState={PLAYER_STATE.CORRECT_WAITING_NEXT}
    >
      <ScreenMarker name="correct" mountLog={mountLog} />
    </ContestRouter>
  );

  const EliminatedShell = (props: RouteShellProps) => (
    <ContestRouter
      contestId={props.contestId}
      playerState={props.playerState}
      loading={props.loading}
      validState={PLAYER_STATE.ELIMINATED}
    >
      <ScreenMarker name="eliminated" mountLog={mountLog} />
    </ContestRouter>
  );

  const WinnerShell = (props: RouteShellProps) => (
    <ContestRouter
      contestId={props.contestId}
      playerState={props.playerState}
      loading={props.loading}
      validState={PLAYER_STATE.WINNER}
    >
      <ScreenMarker name="winner" mountLog={mountLog} />
    </ContestRouter>
  );

  const RouteApp = (props: RouteShellProps) => {
    const path = __router.getPathname();
    if (path.startsWith('/lobby/')) return <LobbyShell {...props} />;
    if (path.startsWith('/game/')) return <GameShell {...props} />;
    if (path.startsWith('/submitted/')) return <SubmittedShell {...props} />;
    if (path.startsWith('/correct/')) return <CorrectShell {...props} />;
    if (path.startsWith('/eliminated/')) return <EliminatedShell {...props} />;
    if (path.startsWith('/winner/')) return <WinnerShell {...props} />;
    return <View testID="screen.unknown" />;
  };

  return { RouteApp };
};

const screenNameFromPath = (path: string) => {
  const base = path.split('?')[0] ?? path;
  return base.split('/')[1] ?? '';
};

export const transitionTo = async (
  view: RenderAPI,
  RouteApp: React.ComponentType<RouteShellProps>,
  params: { contestId: string; nextState: PlayerState; loading?: boolean },
): Promise<void> => {
  const expectedPath = pathForState(params.contestId, params.nextState);
  const loading = params.loading ?? false;

  view.rerender(
    <RouteApp contestId={params.contestId} playerState={params.nextState} loading={loading} />,
  );

  await waitFor(() => {
    expect(__router.getPathname()).toBe(expectedPath);
  });

  // Our router mock does not auto-trigger rerenders on pathname changes.
  // The second render is the "user sees this screen" point.
  view.rerender(
    <RouteApp contestId={params.contestId} playerState={params.nextState} loading={loading} />,
  );

  await waitFor(() => {
    expect(view.getByTestId(`screen.${screenNameFromPath(expectedPath)}`)).toBeTruthy();
  });
};

export const expectScreen = (view: RenderAPI, screenName: string) => {
  expect(view.getByTestId(`screen.${screenName}`)).toBeTruthy();
};
