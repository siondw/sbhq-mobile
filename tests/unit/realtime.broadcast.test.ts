import { REALTIME_SUBSCRIBE_STATES } from '@supabase/supabase-js';

import { networkError } from '../../src/db/errors';
import { subscribeToBroadcast } from '../../src/db/realtime';

type StatusCallback = (status: REALTIME_SUBSCRIBE_STATES, error?: Error) => void;
const mockOn = jest.fn<
  void,
  [string, { event: string }, (message: { payload: unknown }) => void]
>();
const mockSubscribe = jest.fn<void, [StatusCallback?]>();
const mockChannel = { on: mockOn, subscribe: mockSubscribe };
const mockCreateChannel = jest.fn<typeof mockChannel, [string, unknown?]>(() => mockChannel);
const mockRemoveChannel = jest.fn<Promise<string>, [unknown]>();

jest.mock('../../src/db/client', () => ({
  SUPABASE_CLIENT: {
    channel: (channel: string, options?: unknown) => mockCreateChannel(channel, options),
    removeChannel: (channel: unknown) => mockRemoveChannel(channel),
  },
}));

beforeEach(() => {
  jest.clearAllMocks();
  mockRemoveChannel.mockReset().mockResolvedValue('ok');
});

test('SDK subscription statuses notify joins, rejoins, and connection failures', () => {
  const onSubscribed = jest.fn();
  const onError = jest.fn();
  subscribeToBroadcast('contest:test', [{ event: 'UPDATE', callback: jest.fn() }], {
    onSubscribed,
    onError,
  });
  expect(mockCreateChannel).toHaveBeenCalledWith('contest:test', { config: { private: true } });
  expect(mockSubscribe).toHaveBeenCalledTimes(1);
  const statusCallback = mockSubscribe.mock.calls[0][0];
  expect(statusCallback).toEqual(expect.any(Function));

  statusCallback?.(REALTIME_SUBSCRIBE_STATES.SUBSCRIBED);
  statusCallback?.(REALTIME_SUBSCRIBE_STATES.CHANNEL_ERROR, new Error('Network interrupted'));
  statusCallback?.(REALTIME_SUBSCRIBE_STATES.SUBSCRIBED);
  statusCallback?.(REALTIME_SUBSCRIBE_STATES.TIMED_OUT);
  statusCallback?.(REALTIME_SUBSCRIBE_STATES.CLOSED);

  expect(onSubscribed).toHaveBeenCalledTimes(2);
  expect(onError).toHaveBeenCalledTimes(3);
  expect(onError).toHaveBeenNthCalledWith(1, networkError('Network interrupted'));
});

test('cleanup ignores close statuses and queued broadcasts and removes the channel once', () => {
  const onSubscribed = jest.fn();
  const onError = jest.fn();
  const onUpdate = jest.fn();
  const unsubscribe = subscribeToBroadcast(
    'contest:test',
    [{ event: 'UPDATE', callback: onUpdate }],
    {
      onSubscribed,
      onError,
    },
  );
  const statusCallback = mockSubscribe.mock.calls[0][0];
  const broadcast = mockOn.mock.calls[0][2];
  mockRemoveChannel.mockImplementation(() => {
    statusCallback?.(REALTIME_SUBSCRIBE_STATES.CLOSED);
    return Promise.resolve('ok');
  });

  broadcast({ payload: { current_round: 1 } });
  unsubscribe();
  unsubscribe();
  statusCallback?.(REALTIME_SUBSCRIBE_STATES.SUBSCRIBED);
  statusCallback?.(REALTIME_SUBSCRIBE_STATES.CHANNEL_ERROR);
  broadcast({ payload: { current_round: 2 } });

  expect(mockRemoveChannel).toHaveBeenCalledTimes(1);
  expect(mockRemoveChannel).toHaveBeenCalledWith(mockChannel);
  expect(onUpdate).toHaveBeenCalledTimes(1);
  expect(onUpdate).toHaveBeenCalledWith({ current_round: 1 });
  expect(onSubscribed).not.toHaveBeenCalled();
  expect(onError).not.toHaveBeenCalled();
});
