import { act, renderHook, waitFor } from '@testing-library/react-native';
import { getContestById } from '../../src/db/contests';
import { getParticipantForUser } from '../../src/db/participants';
import { getQuestionForRound } from '../../src/db/questions';
import { getAnswerForQuestion, submitAnswer } from '../../src/db/answers';
import { subscribeToBroadcast } from '../../src/db/realtime';
import { useContestState } from '../../src/logic/hooks/useContestState';
import { networkError } from '../../src/db/errors';
import { Ok, Err } from '../../src/utils/result';
import {
  makeContest,
  makeParticipant,
  makeQuestion,
  makeAnswer,
  DEFAULT_CONTEST_ID,
  DEFAULT_USER_ID,
} from '../support/builders';

jest.mock('../../src/db/contests', () => ({ getContestById: jest.fn() }));
jest.mock('../../src/db/participants', () => ({ getParticipantForUser: jest.fn() }));
jest.mock('../../src/db/questions', () => ({ getQuestionForRound: jest.fn() }));
jest.mock('../../src/db/answers', () => ({
  getAnswerForQuestion: jest.fn(),
  submitAnswer: jest.fn(),
}));
jest.mock('../../src/db/realtime', () => ({ subscribeToBroadcast: jest.fn() }));

const deferred = <T,>() => {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((complete) => {
    resolve = complete;
  });
  return { promise, resolve };
};

let update: Parameters<typeof subscribeToBroadcast>[1][number]['callback'];
beforeEach(() => {
  jest.clearAllMocks();
  jest.mocked(getContestById).mockResolvedValue(Ok(makeContest({ state: 'LOBBY_OPEN' })));
  jest.mocked(getParticipantForUser).mockResolvedValue(Ok(makeParticipant()));
  jest.mocked(getQuestionForRound).mockResolvedValue(Ok(makeQuestion()));
  jest.mocked(getAnswerForQuestion).mockResolvedValue(Ok(null));
  jest.mocked(subscribeToBroadcast).mockImplementation((_channel, handlers) => {
    update = handlers[0].callback;
    return jest.fn();
  });
});

test('a newer valid question broadcast supersedes an old same-round fetch error', async () => {
  const { result } = renderHook(() => useContestState(DEFAULT_CONTEST_ID, DEFAULT_USER_ID));
  await waitFor(() => expect(result.current.loading).toBe(false));
  const question = deferred<Awaited<ReturnType<typeof getQuestionForRound>>>();
  jest.mocked(getQuestionForRound).mockReturnValueOnce(question.promise);
  await act(() => {
    update(makeContest({ state: 'ROUND_IN_PROGRESS', current_round: 1 }));
    return Promise.resolve();
  });
  await act(() => {
    update(makeQuestion({ round: 1, question: 'New content' }));
    return Promise.resolve();
  });
  await act(async () => {
    question.resolve(Err(networkError('Old failure')));
    await question.promise;
  });
  expect(result.current.question?.question).toBe('New content');
  expect(result.current.error).toBeNull();
});

test('a delayed previous-round participant refresh cannot erase a newer elimination', async () => {
  const { result } = renderHook(() => useContestState(DEFAULT_CONTEST_ID, DEFAULT_USER_ID));
  await waitFor(() => expect(result.current.loading).toBe(false));
  await act(() => {
    update(makeContest({ state: 'ROUND_CLOSED', current_round: 1 }));
    return Promise.resolve();
  });
  const participant = deferred<Awaited<ReturnType<typeof getParticipantForUser>>>();
  jest.mocked(getParticipantForUser).mockReturnValueOnce(participant.promise);
  await act(() => {
    update(makeQuestion({ round: 1, processing_status: 'COMPLETE' }));
    return Promise.resolve();
  });

  jest
    .mocked(getQuestionForRound)
    .mockResolvedValue(
      Ok(makeQuestion({ id: 'question-two', round: 2, processing_status: 'COMPLETE' })),
    );
  jest
    .mocked(getParticipantForUser)
    .mockResolvedValue(Ok(makeParticipant({ elimination_round: 2 })));
  await act(() => {
    update(makeContest({ state: 'ROUND_CLOSED', current_round: 2 }));
    return Promise.resolve();
  });
  await waitFor(() => expect(result.current.participant?.elimination_round).toBe(2));
  await act(async () => {
    participant.resolve(Ok(makeParticipant({ elimination_round: null })));
    await participant.promise;
  });
  expect(result.current.participant?.elimination_round).toBe(2);
});

test('initial snapshot must not miss a question completion received before its round is committed', async () => {
  jest
    .mocked(getContestById)
    .mockResolvedValue(Ok(makeContest({ state: 'ROUND_CLOSED', current_round: 1 })));
  const pending = makeQuestion({ round: 1, processing_status: 'PENDING' });
  const complete = makeQuestion({ round: 1, processing_status: 'COMPLETE', correct_option: ['A'] });
  const question = deferred<Awaited<ReturnType<typeof getQuestionForRound>>>();
  jest
    .mocked(getQuestionForRound)
    .mockReturnValueOnce(question.promise)
    .mockResolvedValue(Ok(complete));
  const { result } = renderHook(() => useContestState(DEFAULT_CONTEST_ID, DEFAULT_USER_ID));
  await waitFor(() => expect(getQuestionForRound).toHaveBeenCalledTimes(1));
  await act(() => {
    update(complete);
    return Promise.resolve();
  });
  await act(async () => {
    question.resolve(Ok(pending));
    await question.promise;
  });
  await waitFor(() => expect(result.current.loading).toBe(false));
  expect(result.current.question?.processing_status).toBe('COMPLETE');
});

test('a pending participant refresh cannot overwrite a newer full snapshot in the same round', async () => {
  jest
    .mocked(getContestById)
    .mockResolvedValue(Ok(makeContest({ state: 'ROUND_CLOSED', current_round: 1 })));
  const { result } = renderHook(() => useContestState(DEFAULT_CONTEST_ID, DEFAULT_USER_ID));
  await waitFor(() => expect(result.current.loading).toBe(false));
  const participant = deferred<Awaited<ReturnType<typeof getParticipantForUser>>>();
  jest.mocked(getParticipantForUser).mockReturnValueOnce(participant.promise);
  await act(() => {
    update(makeQuestion({ round: 1, processing_status: 'COMPLETE' }));
    return Promise.resolve();
  });
  jest
    .mocked(getParticipantForUser)
    .mockResolvedValue(Ok(makeParticipant({ elimination_round: 1 })));
  jest
    .mocked(getQuestionForRound)
    .mockResolvedValue(Ok(makeQuestion({ round: 1, processing_status: 'COMPLETE' })));
  await act(async () => {
    await result.current.refresh();
  });
  expect(result.current.participant?.elimination_round).toBe(1);
  await act(async () => {
    participant.resolve(Ok(makeParticipant({ elimination_round: null })));
    await participant.promise;
  });
  expect(result.current.participant?.elimination_round).toBe(1);
});

test('a pending snapshot cannot populate a different contest after navigation', async () => {
  const previous = deferred<Awaited<ReturnType<typeof getContestById>>>();
  jest.mocked(getContestById).mockReturnValueOnce(previous.promise);
  const { result, rerender } = renderHook(
    ({ contestId }: { contestId: string }) => useContestState(contestId, DEFAULT_USER_ID),
    { initialProps: { contestId: DEFAULT_CONTEST_ID } },
  );
  const nextContestId = 'next-contest';
  jest
    .mocked(getContestById)
    .mockResolvedValue(Ok(makeContest({ id: nextContestId, state: 'LOBBY_OPEN' })));
  jest
    .mocked(getParticipantForUser)
    .mockResolvedValue(Ok(makeParticipant({ contest_id: nextContestId })));
  rerender({ contestId: nextContestId });
  await waitFor(() => expect(result.current.contest?.id).toBe(nextContestId));
  await act(async () => {
    previous.resolve(Ok(makeContest()));
    await previous.promise;
  });
  expect(result.current.contest?.id).toBe(nextContestId);
  expect(result.current.participant?.contest_id).toBe(nextContestId);
  expect(result.current.loading).toBe(false);
});

test('a late submission response cannot restore an answer from a previous round', async () => {
  jest
    .mocked(getContestById)
    .mockResolvedValue(Ok(makeContest({ state: 'ROUND_IN_PROGRESS', current_round: 1 })));
  const { result } = renderHook(() => useContestState(DEFAULT_CONTEST_ID, DEFAULT_USER_ID));
  await waitFor(() => expect(result.current.loading).toBe(false));
  const pending = deferred<Awaited<ReturnType<typeof submitAnswer>>>();
  jest.mocked(submitAnswer).mockReturnValueOnce(pending.promise);
  const submission = result.current.submit({
    contestId: DEFAULT_CONTEST_ID,
    participantId: 'participant',
    questionId: 'question-one',
    round: 1,
    answer: 'A',
  });
  jest
    .mocked(getQuestionForRound)
    .mockResolvedValue(Ok(makeQuestion({ id: 'question-two', round: 2 })));
  await act(() => {
    update(makeContest({ state: 'ROUND_IN_PROGRESS', current_round: 2 }));
    return Promise.resolve();
  });
  await act(async () => {
    pending.resolve(Ok(makeAnswer({ round: 1 })));
    await submission;
  });
  expect(result.current.contest?.current_round).toBe(2);
  expect(result.current.answer).toBeNull();
});
