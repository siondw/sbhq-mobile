/**
 * Scenario: state mismatch correction (anti-wrong-screen).
 * Start: /submitted/{contestId} but playerState === ANSWERING.
 * Expect: Submitted content never renders; redirect to /game/{contestId}.
 */
import React from 'react';
import { render, waitFor } from '@testing-library/react-native';

import { PLAYER_STATE } from '../../src/logic/constants';
import { __router } from '../mocks/expo-router';
import { DEFAULT_CONTEST_ID } from '../support/builders';
import { createContestRouteApp } from '../support/contestRouteHarness';

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

describe('Flow: ContestRouter redirect guard', () => {
  beforeEach(() => {
    __router.reset();
    mountLog.length = 0;
  });

  test('does not render the wrong screen before redirect', async () => {
    __router.setPathname(`/submitted/${DEFAULT_CONTEST_ID}`);

    const { RouteApp } = createContestRouteApp(mountLog);
    const view = render(
      <RouteApp
        contestId={DEFAULT_CONTEST_ID}
        playerState={PLAYER_STATE.ANSWERING}
        loading={false}
      />,
    );

    expect(view.getByTestId('loading')).toBeTruthy();
    expect(mountLog).toEqual([]);

    await waitFor(() => {
      expect(__router.getPathname()).toBe(`/game/${DEFAULT_CONTEST_ID}`);
    });

    view.rerender(
      <RouteApp
        contestId={DEFAULT_CONTEST_ID}
        playerState={PLAYER_STATE.ANSWERING}
        loading={false}
      />,
    );

    expect(view.getByTestId('screen.game')).toBeTruthy();
    expect(mountLog).toEqual(['game']);

    const events = __router.getEvents();
    expect(events).toHaveLength(1);
    expect(events[0]?.type).toBe('replace');
  });
});
