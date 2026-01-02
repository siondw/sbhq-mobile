import React from 'react';
import { View } from 'react-native';
import { render, waitFor } from '@testing-library/react-native';

import { ROUTES } from '../../src/configs/routes';
import type { ParticipantRow } from '../../src/db/types';
import { useNotificationObserver } from '../../src/logic/hooks/useNotificationObserver';
import { __notifications } from '../mocks/expo-notifications';
import { __router } from '../mocks/expo-router';
import { DEFAULT_CONTEST_ID, DEFAULT_USER_ID, makeParticipant } from '../support/builders';

type OkResult<T> = { ok: true; value: T };
const mockOk = <T,>(value: T): OkResult<T> => ({ ok: true, value });

const mockAuthState: { user: null | { id: string }; loading: boolean } = {
  user: { id: DEFAULT_USER_ID },
  loading: false,
};

const mockGetParticipantForUser = jest.fn<Promise<OkResult<ParticipantRow | null>>, [string, string]>(
  async () => mockOk(null),
);
const mockSetPendingResultIntent = jest.fn();
const mockClearPendingResultIntent = jest.fn();

jest.mock('../../src/logic/hooks/useAuth', () => ({
  useAuth: () => mockAuthState,
}));

jest.mock('../../src/db/participants', () => ({
  getParticipantForUser: (contestId: string, userId: string) =>
    mockGetParticipantForUser(contestId, userId),
}));

jest.mock('../../src/logic/contexts', () => ({
  useNotificationRouting: () => ({
    pendingResultIntent: null,
    setPendingResultIntent: mockSetPendingResultIntent,
    clearPendingResultIntent: mockClearPendingResultIntent,
  }),
}));

const Harness = () => {
  useNotificationObserver();
  return <View testID="harness" />;
};

describe('useNotificationObserver', () => {
  beforeEach(() => {
    __router.reset();
    __notifications.reset();

    mockAuthState.user = { id: DEFAULT_USER_ID };
    mockAuthState.loading = false;

    mockGetParticipantForUser.mockClear();
    mockGetParticipantForUser.mockResolvedValue(mockOk(null));
    mockSetPendingResultIntent.mockClear();
    mockClearPendingResultIntent.mockClear();
  });

  test('routes to login when not authenticated', async () => {
    mockAuthState.user = null;
    __notifications.setLastResponse(__notifications.makeResponseWithUrl(`/lobby/${DEFAULT_CONTEST_ID}`));

    render(<Harness />);

    await waitFor(() => {
      const last = __router.getEvents().at(-1);
      expect(last?.resolvedPath).toBe(ROUTES.INDEX);
      expect(last?.type).toBe('push');
    });

    expect(mockClearPendingResultIntent).toHaveBeenCalledTimes(1);
    expect(mockGetParticipantForUser).not.toHaveBeenCalled();
  });

  test('routes to contests list when user is not a participant', async () => {
    mockGetParticipantForUser.mockResolvedValue(mockOk(null));
    __notifications.setLastResponse(__notifications.makeResponseWithUrl(`/game/${DEFAULT_CONTEST_ID}`));

    render(<Harness />);

    await waitFor(() => {
      const last = __router.getEvents().at(-1);
      expect(last?.resolvedPath).toBe(ROUTES.CONTESTS);
      expect(last?.type).toBe('push');
    });

    expect(mockGetParticipantForUser).toHaveBeenCalledWith(DEFAULT_CONTEST_ID, DEFAULT_USER_ID);
  });

  test('routes eliminated users to eliminated screen', async () => {
    mockGetParticipantForUser.mockResolvedValue(
      mockOk(makeParticipant({ elimination_round: 1 })),
    );
    __notifications.setLastResponse(__notifications.makeResponseWithUrl(`/game/${DEFAULT_CONTEST_ID}`));

    render(<Harness />);

    await waitFor(() => {
      const last = __router.getEvents().at(-1);
      expect(last?.resolvedPath).toBe(`/eliminated/${DEFAULT_CONTEST_ID}`);
      expect(last?.type).toBe('push');
    });
  });

  test('result notifications set pending intent and replace to target', async () => {
    const dateNowSpy = jest.spyOn(Date, 'now').mockReturnValue(123);
    mockGetParticipantForUser.mockResolvedValue(mockOk(makeParticipant({ elimination_round: null })));

    __router.setPathname(`/submitted/${DEFAULT_CONTEST_ID}`);
    __notifications.setLastResponse(__notifications.makeResponseWithUrl(`/correct/${DEFAULT_CONTEST_ID}`));

    render(<Harness />);

    await waitFor(() => {
      const last = __router.getEvents().at(-1);
      expect(last?.resolvedPath).toBe(`/correct/${DEFAULT_CONTEST_ID}`);
      expect(last?.type).toBe('replace');
    });

    expect(mockSetPendingResultIntent).toHaveBeenCalledWith({
      contestId: DEFAULT_CONTEST_ID,
      path: `/correct/${DEFAULT_CONTEST_ID}`,
      receivedAt: 123,
    });

    dateNowSpy.mockRestore();
  });

  test('does not drop notification while auth is loading', async () => {
    mockGetParticipantForUser.mockResolvedValue(mockOk(makeParticipant({ elimination_round: null })));
    __notifications.setLastResponse(__notifications.makeResponseWithUrl(`/lobby/${DEFAULT_CONTEST_ID}`));

    mockAuthState.loading = true;
    const view = render(<Harness />);

    await waitFor(() => expect(__router.getEvents()).toHaveLength(0));

    mockAuthState.loading = false;
    view.rerender(<Harness />);

    await waitFor(() => {
      const last = __router.getEvents().at(-1);
      expect(last?.resolvedPath).toBe(`/lobby/${DEFAULT_CONTEST_ID}`);
      expect(last?.type).toBe('push');
    });
  });
});

