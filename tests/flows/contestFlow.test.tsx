/**
 * Scenario: happy-path and elimination flows (non-notification).
 * Expected: screen sequence matches the intended contest state machine.
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

type RouteShellProps = { contestId: string; playerState: string; loading: boolean };

const mountLog: string[] = [];

const ScreenMarker = ({ name }: { name: string }) => {
  useEffect(() => {
    mountLog.push(name);
  }, [name]);
  return <View testID={`screen.${name}`} />;
};

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

const CorrectShell = (props: RouteShellProps) => (
  <ContestRouter
    contestId={props.contestId}
    playerState={props.playerState}
    loading={props.loading}
    validState={PLAYER_STATE.CORRECT_WAITING_NEXT}
  >
    <ScreenMarker name="correct" />
  </ContestRouter>
);

const EliminatedShell = (props: RouteShellProps) => (
  <ContestRouter
    contestId={props.contestId}
    playerState={props.playerState}
    loading={props.loading}
    validState={PLAYER_STATE.ELIMINATED}
  >
    <ScreenMarker name="eliminated" />
  </ContestRouter>
);

const WinnerShell = (props: RouteShellProps) => (
  <ContestRouter
    contestId={props.contestId}
    playerState={props.playerState}
    loading={props.loading}
    validState={PLAYER_STATE.WINNER}
  >
    <ScreenMarker name="winner" />
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

describe('Flow: contest (non-notification)', () => {
  beforeEach(() => {
    __router.reset();
    mountLog.length = 0;
  });

  test('happy path (1 round): Lobby → Game → Submitted → Correct → Winner', async () => {
    __router.setPathname(`/lobby/${DEFAULT_CONTEST_ID}`);

    const view = render(
      <RouteApp contestId={DEFAULT_CONTEST_ID} playerState={PLAYER_STATE.LOBBY} loading={false} />,
    );
    expect(view.getByTestId('screen.lobby')).toBeTruthy();
    await waitFor(() => expect(mountLog).toEqual(['lobby']));

    view.rerender(
      <RouteApp
        contestId={DEFAULT_CONTEST_ID}
        playerState={PLAYER_STATE.ANSWERING}
        loading={false}
      />,
    );
    await waitFor(() => expect(__router.getPathname()).toBe(`/game/${DEFAULT_CONTEST_ID}`));
    view.rerender(
      <RouteApp
        contestId={DEFAULT_CONTEST_ID}
        playerState={PLAYER_STATE.ANSWERING}
        loading={false}
      />,
    );
    expect(view.getByTestId('screen.game')).toBeTruthy();

    view.rerender(
      <RouteApp
        contestId={DEFAULT_CONTEST_ID}
        playerState={PLAYER_STATE.SUBMITTED_WAITING}
        loading={false}
      />,
    );
    await waitFor(() => expect(__router.getPathname()).toBe(`/submitted/${DEFAULT_CONTEST_ID}`));
    view.rerender(
      <RouteApp
        contestId={DEFAULT_CONTEST_ID}
        playerState={PLAYER_STATE.SUBMITTED_WAITING}
        loading={false}
      />,
    );
    expect(view.getByTestId('screen.submitted')).toBeTruthy();

    view.rerender(
      <RouteApp
        contestId={DEFAULT_CONTEST_ID}
        playerState={PLAYER_STATE.CORRECT_WAITING_NEXT}
        loading={false}
      />,
    );
    await waitFor(() => expect(__router.getPathname()).toBe(`/correct/${DEFAULT_CONTEST_ID}`));
    view.rerender(
      <RouteApp
        contestId={DEFAULT_CONTEST_ID}
        playerState={PLAYER_STATE.CORRECT_WAITING_NEXT}
        loading={false}
      />,
    );
    expect(view.getByTestId('screen.correct')).toBeTruthy();

    view.rerender(
      <RouteApp contestId={DEFAULT_CONTEST_ID} playerState={PLAYER_STATE.WINNER} loading={false} />,
    );
    await waitFor(() => expect(__router.getPathname()).toBe(`/winner/${DEFAULT_CONTEST_ID}`));
    view.rerender(
      <RouteApp contestId={DEFAULT_CONTEST_ID} playerState={PLAYER_STATE.WINNER} loading={false} />,
    );
    expect(view.getByTestId('screen.winner')).toBeTruthy();

    await waitFor(() =>
      expect(mountLog).toEqual(['lobby', 'game', 'submitted', 'correct', 'winner']),
    );

    const events = __router.getEvents();
    expect(events).toHaveLength(4);
    expect(events.map((e) => e.type)).toEqual(['replace', 'replace', 'replace', 'replace']);
  });

  test('wrong answer → eliminated: Game → Submitted → Eliminated', async () => {
    __router.setPathname(`/game/${DEFAULT_CONTEST_ID}`);

    const view = render(
      <RouteApp
        contestId={DEFAULT_CONTEST_ID}
        playerState={PLAYER_STATE.ANSWERING}
        loading={false}
      />,
    );
    expect(view.getByTestId('screen.game')).toBeTruthy();

    view.rerender(
      <RouteApp
        contestId={DEFAULT_CONTEST_ID}
        playerState={PLAYER_STATE.SUBMITTED_WAITING}
        loading={false}
      />,
    );
    await waitFor(() => expect(__router.getPathname()).toBe(`/submitted/${DEFAULT_CONTEST_ID}`));
    view.rerender(
      <RouteApp
        contestId={DEFAULT_CONTEST_ID}
        playerState={PLAYER_STATE.SUBMITTED_WAITING}
        loading={false}
      />,
    );
    expect(view.getByTestId('screen.submitted')).toBeTruthy();

    view.rerender(
      <RouteApp
        contestId={DEFAULT_CONTEST_ID}
        playerState={PLAYER_STATE.ELIMINATED}
        loading={false}
      />,
    );
    await waitFor(() => expect(__router.getPathname()).toBe(`/eliminated/${DEFAULT_CONTEST_ID}`));
    view.rerender(
      <RouteApp
        contestId={DEFAULT_CONTEST_ID}
        playerState={PLAYER_STATE.ELIMINATED}
        loading={false}
      />,
    );
    expect(view.getByTestId('screen.eliminated')).toBeTruthy();

    await waitFor(() => expect(mountLog).toEqual(['game', 'submitted', 'eliminated']));

    const events = __router.getEvents();
    expect(events).toHaveLength(2);
    expect(events.map((e) => e.type)).toEqual(['replace', 'replace']);
  });

  test('missed answer deadline → eliminated: Game → Eliminated (never Submitted/Correct)', async () => {
    __router.setPathname(`/game/${DEFAULT_CONTEST_ID}`);

    const view = render(
      <RouteApp
        contestId={DEFAULT_CONTEST_ID}
        playerState={PLAYER_STATE.ANSWERING}
        loading={false}
      />,
    );
    expect(view.getByTestId('screen.game')).toBeTruthy();

    view.rerender(
      <RouteApp
        contestId={DEFAULT_CONTEST_ID}
        playerState={PLAYER_STATE.ELIMINATED}
        loading={false}
      />,
    );
    await waitFor(() => expect(__router.getPathname()).toBe(`/eliminated/${DEFAULT_CONTEST_ID}`));
    view.rerender(
      <RouteApp
        contestId={DEFAULT_CONTEST_ID}
        playerState={PLAYER_STATE.ELIMINATED}
        loading={false}
      />,
    );
    expect(view.getByTestId('screen.eliminated')).toBeTruthy();

    await waitFor(() => expect(mountLog).toEqual(['game', 'eliminated']));

    const events = __router.getEvents();
    expect(events).toHaveLength(1);
    expect(events.map((e) => e.type)).toEqual(['replace']);
  });

  test('happy path (2 rounds): Lobby → Game → Submitted → Correct → Game → Submitted → Correct → Winner', async () => {
    __router.setPathname(`/lobby/${DEFAULT_CONTEST_ID}`);

    const view = render(
      <RouteApp contestId={DEFAULT_CONTEST_ID} playerState={PLAYER_STATE.LOBBY} loading={false} />,
    );
    expect(view.getByTestId('screen.lobby')).toBeTruthy();

    // Round 1
    view.rerender(
      <RouteApp
        contestId={DEFAULT_CONTEST_ID}
        playerState={PLAYER_STATE.ANSWERING}
        loading={false}
      />,
    );
    await waitFor(() => expect(__router.getPathname()).toBe(`/game/${DEFAULT_CONTEST_ID}`));
    view.rerender(
      <RouteApp
        contestId={DEFAULT_CONTEST_ID}
        playerState={PLAYER_STATE.ANSWERING}
        loading={false}
      />,
    );
    expect(view.getByTestId('screen.game')).toBeTruthy();

    view.rerender(
      <RouteApp
        contestId={DEFAULT_CONTEST_ID}
        playerState={PLAYER_STATE.SUBMITTED_WAITING}
        loading={false}
      />,
    );
    await waitFor(() => expect(__router.getPathname()).toBe(`/submitted/${DEFAULT_CONTEST_ID}`));
    view.rerender(
      <RouteApp
        contestId={DEFAULT_CONTEST_ID}
        playerState={PLAYER_STATE.SUBMITTED_WAITING}
        loading={false}
      />,
    );
    expect(view.getByTestId('screen.submitted')).toBeTruthy();

    view.rerender(
      <RouteApp
        contestId={DEFAULT_CONTEST_ID}
        playerState={PLAYER_STATE.CORRECT_WAITING_NEXT}
        loading={false}
      />,
    );
    await waitFor(() => expect(__router.getPathname()).toBe(`/correct/${DEFAULT_CONTEST_ID}`));
    view.rerender(
      <RouteApp
        contestId={DEFAULT_CONTEST_ID}
        playerState={PLAYER_STATE.CORRECT_WAITING_NEXT}
        loading={false}
      />,
    );
    expect(view.getByTestId('screen.correct')).toBeTruthy();

    // Round 2
    view.rerender(
      <RouteApp
        contestId={DEFAULT_CONTEST_ID}
        playerState={PLAYER_STATE.ANSWERING}
        loading={false}
      />,
    );
    await waitFor(() => expect(__router.getPathname()).toBe(`/game/${DEFAULT_CONTEST_ID}`));
    view.rerender(
      <RouteApp
        contestId={DEFAULT_CONTEST_ID}
        playerState={PLAYER_STATE.ANSWERING}
        loading={false}
      />,
    );
    expect(view.getByTestId('screen.game')).toBeTruthy();

    view.rerender(
      <RouteApp
        contestId={DEFAULT_CONTEST_ID}
        playerState={PLAYER_STATE.SUBMITTED_WAITING}
        loading={false}
      />,
    );
    await waitFor(() => expect(__router.getPathname()).toBe(`/submitted/${DEFAULT_CONTEST_ID}`));
    view.rerender(
      <RouteApp
        contestId={DEFAULT_CONTEST_ID}
        playerState={PLAYER_STATE.SUBMITTED_WAITING}
        loading={false}
      />,
    );
    expect(view.getByTestId('screen.submitted')).toBeTruthy();

    view.rerender(
      <RouteApp
        contestId={DEFAULT_CONTEST_ID}
        playerState={PLAYER_STATE.CORRECT_WAITING_NEXT}
        loading={false}
      />,
    );
    await waitFor(() => expect(__router.getPathname()).toBe(`/correct/${DEFAULT_CONTEST_ID}`));
    view.rerender(
      <RouteApp
        contestId={DEFAULT_CONTEST_ID}
        playerState={PLAYER_STATE.CORRECT_WAITING_NEXT}
        loading={false}
      />,
    );
    expect(view.getByTestId('screen.correct')).toBeTruthy();

    // Win
    view.rerender(
      <RouteApp contestId={DEFAULT_CONTEST_ID} playerState={PLAYER_STATE.WINNER} loading={false} />,
    );
    await waitFor(() => expect(__router.getPathname()).toBe(`/winner/${DEFAULT_CONTEST_ID}`));
    view.rerender(
      <RouteApp contestId={DEFAULT_CONTEST_ID} playerState={PLAYER_STATE.WINNER} loading={false} />,
    );
    expect(view.getByTestId('screen.winner')).toBeTruthy();

    await waitFor(() =>
      expect(mountLog).toEqual([
        'lobby',
        'game',
        'submitted',
        'correct',
        'game',
        'submitted',
        'correct',
        'winner',
      ]),
    );

    const events = __router.getEvents();
    expect(events).toHaveLength(7);
    expect(events.map((e) => e.type)).toEqual([
      'replace',
      'replace',
      'replace',
      'replace',
      'replace',
      'replace',
      'replace',
    ]);
  });
});
