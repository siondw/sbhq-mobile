import { act, renderHook, waitFor } from '@testing-library/react-native';
import { PermissionStatus, type NotificationPermissionsStatus } from 'expo-notifications';

import type { DbError } from '../../src/db/errors';
import { usePushNotifications } from '../../src/logic/hooks/usePushNotifications';
import type { Result } from '../../src/utils/result';
import { Err, Ok } from '../../src/utils/result';

const mockGrantedPermissions: NotificationPermissionsStatus = {
  granted: true,
  canAskAgain: true,
  expires: 'never',
  status: PermissionStatus.GRANTED,
};
const mockAuthState: { user: { id: string } | null } = { user: { id: 'player-a' } };
type RegistrationResult = Result<{ id: string }, DbError>;
const mockUpdateToken = jest.fn<Promise<RegistrationResult>, [string, string]>();
const mockClearToken = jest.fn<Promise<Result<void, DbError>>, [string]>();
const mockGetPermissions = jest.fn<Promise<NotificationPermissionsStatus>, []>();
const mockRequestPermissions = jest.fn<Promise<NotificationPermissionsStatus>, [unknown]>();

jest.mock('expo-device', () => ({ isDevice: true }));
jest.mock('expo-constants', () => ({
  __esModule: true,
  default: { easConfig: { projectId: 'test-project' } },
}));
jest.mock('expo-notifications', () => ({
  getPermissionsAsync: () => mockGetPermissions(),
  requestPermissionsAsync: (options: unknown) => mockRequestPermissions(options),
  getExpoPushTokenAsync: () => Promise.resolve({ data: 'test-token' }),
  setNotificationChannelAsync: jest.fn(),
  addPushTokenListener: () => ({ remove: jest.fn() }),
  PermissionStatus: { GRANTED: 'granted' },
  AndroidImportance: { MAX: 5 },
  IosAuthorizationStatus: {},
}));
jest.mock('../../src/logic/hooks/useAuth', () => ({ useAuth: () => mockAuthState }));
jest.mock('../../src/db/users', () => ({
  updatePushToken: (userId: string, token: string) => mockUpdateToken(userId, token),
  clearPushToken: (userId: string) => mockClearToken(userId),
}));

const temporaryFailure = Err<DbError>({ type: 'NETWORK_ERROR', message: 'Temporary failure' });

const deferred = <T,>() => {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((resolvePromise) => {
    resolve = resolvePromise;
  });
  return { promise, resolve };
};

describe('push registration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAuthState.user = { id: 'player-a' };
    mockGetPermissions.mockResolvedValue(mockGrantedPermissions);
    mockRequestPermissions.mockResolvedValue(mockGrantedPermissions);
    mockUpdateToken.mockReset().mockResolvedValue(Ok({ id: 'player-a' }));
    mockClearToken.mockResolvedValue(Ok(undefined));
  });

  test('a manual retry succeeds after ten transient registration failures', async () => {
    mockUpdateToken.mockResolvedValue(temporaryFailure);
    const { result } = renderHook(() => usePushNotifications());
    await waitFor(() => expect(result.current.loading).toBe(false));

    for (let attempt = 0; attempt < 9; attempt += 1) {
      await act(async () => {
        await result.current.requestPermissions();
      });
    }
    expect(mockUpdateToken).toHaveBeenCalledTimes(10);
    expect(result.current.isRegistered).toBe(false);
    expect(result.current.error).toContain('Temporary failure');

    mockUpdateToken.mockResolvedValue(Ok({ id: 'player-a' }));
    await act(async () => {
      await result.current.requestPermissions();
    });

    expect(mockUpdateToken).toHaveBeenCalledTimes(11);
    expect(result.current.isRegistered).toBe(true);
    expect(result.current.expoPushToken).toBe('test-token');
    expect(result.current.error).toBeNull();
  });

  test('overlapping registration triggers share one in-flight database write', async () => {
    const registration = deferred<RegistrationResult>();
    mockUpdateToken.mockReturnValue(registration.promise);
    const { result } = renderHook(() => usePushNotifications());
    await waitFor(() => expect(mockUpdateToken).toHaveBeenCalledTimes(1));

    await act(async () => {
      await Promise.all([result.current.requestPermissions(), result.current.requestPermissions()]);
    });
    expect(mockUpdateToken).toHaveBeenCalledTimes(1);

    await act(async () => {
      registration.resolve(Ok({ id: 'player-a' }));
      await registration.promise;
    });
    expect(result.current.isRegistered).toBe(true);
  });

  test('a pending registration for the previous account cannot block or overwrite the new account', async () => {
    const previousRegistration = deferred<RegistrationResult>();
    mockUpdateToken.mockImplementation((userId) =>
      userId === 'player-a' ? previousRegistration.promise : Promise.resolve(temporaryFailure),
    );
    const { result, rerender } = renderHook(() => usePushNotifications());
    await waitFor(() => expect(mockUpdateToken).toHaveBeenCalledWith('player-a', 'test-token'));

    mockAuthState.user = { id: 'player-b' };
    rerender({});
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(mockUpdateToken).toHaveBeenCalledWith('player-b', 'test-token');
    expect(result.current.error).toContain('Temporary failure');

    await act(async () => {
      previousRegistration.resolve(Ok({ id: 'player-a' }));
      await previousRegistration.promise;
    });
    expect(result.current.isRegistered).toBe(false);
    expect(result.current.expoPushToken).toBeNull();
    expect(result.current.error).toContain('Temporary failure');

    mockUpdateToken.mockResolvedValue(Ok({ id: 'player-b' }));
    await act(async () => {
      await result.current.requestPermissions();
    });
    expect(result.current.isRegistered).toBe(true);
  });

  test('signing out clears the registered token and ignores a pending registration', async () => {
    const registration = deferred<RegistrationResult>();
    mockUpdateToken.mockReturnValue(registration.promise);
    const { result, rerender } = renderHook(() => usePushNotifications());
    await waitFor(() => expect(mockUpdateToken).toHaveBeenCalledTimes(1));

    mockAuthState.user = null;
    rerender({});
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(mockClearToken).toHaveBeenCalledWith('player-a');

    await act(async () => {
      registration.resolve(Ok({ id: 'player-a' }));
      await registration.promise;
    });
    expect(result.current.isRegistered).toBe(false);
    expect(result.current.expoPushToken).toBeNull();
  });
});
