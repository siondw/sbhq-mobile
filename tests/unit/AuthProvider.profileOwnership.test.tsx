import React from 'react';
import { act, render, waitFor } from '@testing-library/react-native';

import type { AuthChangeEvent, Session } from '../../src/db/auth';
import { getSession, onAuthStateChange } from '../../src/db/auth';
import { networkError } from '../../src/db/errors';
import type { UserRow } from '../../src/db/types';
import { getUserById } from '../../src/db/users';
import { AuthProvider, useAuth } from '../../src/logic/hooks/AuthProvider';
import type { AuthContextValue } from '../../src/logic/hooks/AuthProvider';
import { Err, Ok } from '../../src/utils/result';

jest.mock('expo-apple-authentication', () => ({}));
jest.mock('expo-linking', () => ({}));
jest.mock('expo-web-browser', () => ({ maybeCompleteAuthSession: jest.fn() }));
jest.mock('../../src/db/auth', () => ({
  getSession: jest.fn(),
  onAuthStateChange: jest.fn(),
  startAutoRefresh: jest.fn(),
  stopAutoRefresh: jest.fn(),
}));
jest.mock('../../src/db/users', () => ({ getUserById: jest.fn() }));

const deferred = <T,>() => {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((complete) => {
    resolve = complete;
  });
  return { promise, resolve };
};

const makeSession = (id: string): Session => ({
  access_token: `token-${id}`,
  refresh_token: `refresh-${id}`,
  token_type: 'bearer',
  expires_in: 3600,
  user: { id, app_metadata: {}, user_metadata: {}, aud: 'authenticated', created_at: '' },
});

const makeProfile = (id: string): UserRow => ({
  id,
  username: `player-${id}`,
  role: id === 'A' ? 'admin' : 'player',
  phone_number: '5551234567',
  email: null,
  created_at: null,
  updated_at: null,
  expo_push_token: null,
  push_token_updated_at: null,
  has_seen_demo: null,
});

const mockGetSession = jest.mocked(getSession);
const mockGetUserById = jest.mocked(getUserById);
const mockOnAuthStateChange = jest.mocked(onAuthStateChange);
let authChange: (event: AuthChangeEvent, session: Session | null) => void | Promise<void>;
let auth: AuthContextValue;

const Harness = () => {
  auth = useAuth();
  return null;
};

const renderAuth = () =>
  render(
    <AuthProvider>
      <Harness />
    </AuthProvider>,
  );

beforeEach(() => {
  jest.clearAllMocks();
  mockGetSession.mockResolvedValue(Ok(makeSession('A')));
  mockGetUserById.mockImplementation((id) => Promise.resolve(Ok(makeProfile(id))));
  mockOnAuthStateChange.mockImplementation((callback) => {
    authChange = callback;
    return jest.fn();
  });
});

test('a delayed profile cannot replace the next account or keep auth loading', async () => {
  const profileA = deferred<Awaited<ReturnType<typeof getUserById>>>();
  mockGetUserById.mockImplementation((id) =>
    id === 'A' ? profileA.promise : Promise.resolve(Ok(makeProfile(id))),
  );
  renderAuth();
  await waitFor(() => expect(mockGetUserById).toHaveBeenCalledWith('A'));

  await act(async () => {
    await authChange('SIGNED_IN', makeSession('B'));
  });
  expect(auth.loading).toBe(false);
  expect(auth.derivedUser).toMatchObject({ id: 'B', username: 'player-B', role: 'player' });

  await act(async () => {
    profileA.resolve(Ok(makeProfile('A')));
    await profileA.promise;
  });
  expect(auth.profile?.id).toBe('B');
  expect(auth.derivedUser).toMatchObject({ id: 'B', username: 'player-B', role: 'player' });
});

test('an account change clears the previous profile while the new profile loads', async () => {
  renderAuth();
  await waitFor(() => expect(auth.profile?.id).toBe('A'));
  const profileB = deferred<Awaited<ReturnType<typeof getUserById>>>();
  mockGetUserById.mockReturnValue(profileB.promise);

  act(() => {
    void authChange('SIGNED_IN', makeSession('B'));
  });
  expect(auth.profile).toBeNull();
  expect(auth.derivedUser).toMatchObject({ id: 'B', username: null, role: null });
  expect(auth.loading).toBe(true);

  await act(async () => {
    profileB.resolve(Ok(makeProfile('B')));
    await profileB.promise;
  });
  expect(auth.profile?.id).toBe('B');
});

test.each(['success', 'failure'])('sign-out discards a pending profile %s', async (outcome) => {
  const profile = deferred<Awaited<ReturnType<typeof getUserById>>>();
  mockGetUserById.mockReturnValue(profile.promise);
  renderAuth();
  await waitFor(() => expect(mockGetUserById).toHaveBeenCalledWith('A'));

  await act(async () => {
    await authChange('SIGNED_OUT', null);
    profile.resolve(
      outcome === 'success' ? Ok(makeProfile('A')) : Err(networkError('Old account error')),
    );
  });
  expect(auth.session).toBeNull();
  expect(auth.profile).toBeNull();
  expect(auth.derivedUser).toBeNull();
  expect(auth.error).toBeNull();
  expect(auth.loading).toBe(false);
});

test('session initialization cannot overwrite a newer auth event', async () => {
  const session = deferred<Awaited<ReturnType<typeof getSession>>>();
  mockGetSession.mockReturnValue(session.promise);
  renderAuth();

  await act(async () => {
    await authChange('SIGNED_IN', makeSession('B'));
    session.resolve(Ok(makeSession('A')));
  });
  expect(auth.session?.user.id).toBe('B');
  expect(auth.profile?.id).toBe('B');
  expect(mockGetUserById).not.toHaveBeenCalledWith('A');
});

test('only the latest profile refresh for the current account is applied', async () => {
  renderAuth();
  await waitFor(() => expect(auth.profile?.id).toBe('A'));
  const staleProfile = deferred<Awaited<ReturnType<typeof getUserById>>>();
  mockGetUserById.mockReturnValueOnce(staleProfile.promise);
  let staleRefresh: Promise<void>;

  act(() => {
    staleRefresh = auth.refreshProfile();
  });
  mockGetUserById.mockResolvedValue(Ok({ ...makeProfile('A'), username: 'updated' }));
  await act(async () => auth.refreshProfile());
  await act(async () => {
    staleProfile.resolve(Ok(makeProfile('A')));
    await staleRefresh;
  });
  expect(auth.derivedUser?.username).toBe('updated');
});
