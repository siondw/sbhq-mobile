import { act, renderHook, waitFor } from '@testing-library/react-native';
import { AppState, type AppStateStatus } from 'react-native';

import { getAnswerForQuestion } from '../../src/db/answers';
import { getContestById } from '../../src/db/contests';
import { networkError } from '../../src/db/errors';
import { getParticipantForUser } from '../../src/db/participants';
import { getQuestionForRound } from '../../src/db/questions';
import { subscribeToBroadcast } from '../../src/db/realtime';
import { useContestState } from '../../src/logic/hooks/useContestState';
import { Ok } from '../../src/utils/result';
import {
  DEFAULT_CONTEST_ID,
  DEFAULT_USER_ID,
  makeAnswer,
  makeContest,
  makeParticipant,
  makeQuestion,
} from '../support/builders';

jest.mock('../../src/db/contests', () => ({ getContestById: jest.fn() }));
jest.mock('../../src/db/participants', () => ({ getParticipantForUser: jest.fn() }));
jest.mock('../../src/db/questions', () => ({ getQuestionForRound: jest.fn() }));
jest.mock('../../src/db/answers', () => ({ getAnswerForQuestion: jest.fn() }));
jest.mock('../../src/db/realtime', () => ({ subscribeToBroadcast: jest.fn() }));

const latestLifecycle = () => {
  const lifecycle = jest.mocked(subscribeToBroadcast).mock.calls.at(-1)?.[2];
  expect(lifecycle?.onSubscribed).toEqual(expect.any(Function));
  expect(lifecycle?.onError).toEqual(expect.any(Function));
  return lifecycle;
};

beforeEach(() => {
  jest.clearAllMocks();
  jest.mocked(getContestById).mockResolvedValue(Ok(makeContest({ state: 'LOBBY_OPEN' })));
  jest.mocked(getParticipantForUser).mockResolvedValue(Ok(makeParticipant()));
  jest.mocked(getQuestionForRound).mockResolvedValue(Ok(makeQuestion()));
  jest.mocked(getAnswerForQuestion).mockResolvedValue(Ok(null));
  jest.mocked(subscribeToBroadcast).mockReturnValue(jest.fn());
});

test('the initial successful join fetches changes missed between loading and joining the channel', async () => {
  const { result } = renderHook(() => useContestState(DEFAULT_CONTEST_ID, DEFAULT_USER_ID));
  await waitFor(() => expect(result.current.loading).toBe(false));
  expect(result.current.contest?.state).toBe('LOBBY_OPEN');

  jest
    .mocked(getContestById)
    .mockResolvedValue(Ok(makeContest({ state: 'ROUND_IN_PROGRESS', current_round: 1 })));
  const lifecycle = latestLifecycle();
  await act(async () => {
    lifecycle?.onSubscribed?.();
    await Promise.resolve();
  });

  await waitFor(() => expect(result.current.question?.round).toBe(1));
  expect(result.current.contest?.state).toBe('ROUND_IN_PROGRESS');
  expect(getContestById).toHaveBeenCalledTimes(2);
  expect(subscribeToBroadcast).toHaveBeenCalledTimes(1);
});

test('a successful rejoin restores the full contest snapshot after missing round events', async () => {
  jest
    .mocked(getContestById)
    .mockResolvedValue(Ok(makeContest({ state: 'ROUND_IN_PROGRESS', current_round: 1 })));
  const { result } = renderHook(() => useContestState(DEFAULT_CONTEST_ID, DEFAULT_USER_ID));
  await waitFor(() => expect(result.current.loading).toBe(false));
  const lifecycle = latestLifecycle();
  await act(async () => {
    lifecycle?.onSubscribed?.();
    await Promise.resolve();
  });
  await waitFor(() => expect(result.current.loading).toBe(false));
  await act(async () => {
    lifecycle?.onError?.(networkError('Lost connection'));
    await Promise.resolve();
  });
  expect(result.current.error).toContain('Live updates disconnected');

  const question = makeQuestion({ id: 'question-two', round: 2 });
  const answer = makeAnswer({ question_id: question.id, round: 2 });
  jest
    .mocked(getContestById)
    .mockResolvedValue(Ok(makeContest({ state: 'ROUND_CLOSED', current_round: 2 })));
  jest.mocked(getQuestionForRound).mockResolvedValue(Ok(question));
  jest
    .mocked(getParticipantForUser)
    .mockResolvedValue(Ok(makeParticipant({ elimination_round: 2 })));
  jest.mocked(getAnswerForQuestion).mockResolvedValue(Ok(answer));
  await act(async () => {
    lifecycle?.onSubscribed?.();
    await Promise.resolve();
  });

  await waitFor(() => expect(result.current.loading).toBe(false));
  expect(result.current.contest?.current_round).toBe(2);
  expect(result.current.question).toEqual(question);
  expect(result.current.answer).toEqual(answer);
  expect(result.current.participant?.elimination_round).toBe(2);
  expect(result.current.error).toBeNull();
  expect(subscribeToBroadcast).toHaveBeenCalledTimes(1);
});

test('obsolete join and error callbacks cannot fetch or set errors after a contest change or unmount', async () => {
  const { result, rerender, unmount } = renderHook(
    ({ contestId }: { contestId: string }) => useContestState(contestId, DEFAULT_USER_ID),
    { initialProps: { contestId: DEFAULT_CONTEST_ID } },
  );
  await waitFor(() => expect(result.current.loading).toBe(false));
  const oldLifecycle = latestLifecycle();
  const oldUnsubscribe = jest.mocked(subscribeToBroadcast).mock.results[0].value as () => void;

  jest
    .mocked(getContestById)
    .mockResolvedValue(Ok(makeContest({ id: 'other-contest', state: 'LOBBY_OPEN' })));
  rerender({ contestId: 'other-contest' });
  await waitFor(() => expect(result.current.loading).toBe(false));
  expect(oldUnsubscribe).toHaveBeenCalledTimes(1);
  const queriesBeforeObsoleteCallbacks = jest.mocked(getContestById).mock.calls.length;
  await act(async () => {
    oldLifecycle?.onSubscribed?.();
    oldLifecycle?.onError?.(networkError('Old connection'));
    await Promise.resolve();
  });
  expect(getContestById).toHaveBeenCalledTimes(queriesBeforeObsoleteCallbacks);
  expect(result.current.error).toBeNull();

  const lifecycle = latestLifecycle();
  unmount();
  lifecycle?.onSubscribed?.();
  lifecycle?.onError?.(networkError('Closed after unmount'));
  expect(getContestById).toHaveBeenCalledTimes(queriesBeforeObsoleteCallbacks);
});

test('returning to the foreground refreshes the snapshot and removes the listener on cleanup', async () => {
  let onAppStateChange!: (state: AppStateStatus) => void;
  const remove = jest.fn();
  const listener = jest
    .spyOn(AppState, 'addEventListener')
    .mockImplementation((_type, callback) => {
      onAppStateChange = callback;
      return { remove };
    });
  try {
    const { result, unmount } = renderHook(() =>
      useContestState(DEFAULT_CONTEST_ID, DEFAULT_USER_ID),
    );
    await waitFor(() => expect(result.current.loading).toBe(false));
    jest
      .mocked(getContestById)
      .mockResolvedValue(Ok(makeContest({ state: 'ROUND_IN_PROGRESS', current_round: 1 })));
    await act(async () => {
      onAppStateChange('background');
      onAppStateChange('active');
      await Promise.resolve();
    });
    await waitFor(() => expect(result.current.question?.round).toBe(1));
    expect(getContestById).toHaveBeenCalledTimes(2);

    unmount();
    expect(remove).toHaveBeenCalledTimes(1);
    onAppStateChange('active');
    expect(getContestById).toHaveBeenCalledTimes(2);
  } finally {
    listener.mockRestore();
  }
});
