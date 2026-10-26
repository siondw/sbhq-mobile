import { act, renderHook, waitFor } from '@testing-library/react-native';

import { getAnswerForQuestion, submitAnswer } from '../../src/db/answers';
import type { SubmitAnswerParams } from '../../src/db/answers';
import { getContestById } from '../../src/db/contests';
import { submissionClosedError } from '../../src/db/errors';
import { getParticipantForUser } from '../../src/db/participants';
import { getQuestionForRound } from '../../src/db/questions';
import { useContestState } from '../../src/logic/hooks/useContestState';
import { Err, Ok } from '../../src/utils/result';
import {
  DEFAULT_CONTEST_ID,
  DEFAULT_PARTICIPANT_ID,
  DEFAULT_QUESTION_ID,
  DEFAULT_USER_ID,
  makeContest,
  makeParticipant,
  makeQuestion,
} from '../support/builders';

jest.mock('../../src/db/answers', () => ({
  getAnswerForQuestion: jest.fn(),
  submitAnswer: jest.fn(),
}));
jest.mock('../../src/db/contests', () => ({ getContestById: jest.fn() }));
jest.mock('../../src/db/participants', () => ({ getParticipantForUser: jest.fn() }));
jest.mock('../../src/db/questions', () => ({ getQuestionForRound: jest.fn() }));
jest.mock('../../src/db/realtime', () => ({ subscribeToBroadcast: () => jest.fn() }));

const PAYLOAD: SubmitAnswerParams = {
  participantId: DEFAULT_PARTICIPANT_ID,
  contestId: DEFAULT_CONTEST_ID,
  questionId: DEFAULT_QUESTION_ID,
  round: 1,
  answer: 'A',
};
const CLOSED_MESSAGE = 'This round closed before your answer arrived';

beforeEach(() => {
  jest.clearAllMocks();
  jest
    .mocked(getContestById)
    .mockResolvedValue(Ok(makeContest({ current_round: 1, state: 'ROUND_IN_PROGRESS' })));
  jest.mocked(getParticipantForUser).mockResolvedValue(Ok(makeParticipant()));
  jest.mocked(getQuestionForRound).mockResolvedValue(Ok(makeQuestion()));
  jest.mocked(getAnswerForQuestion).mockResolvedValue(Ok(null));
  jest.mocked(submitAnswer).mockResolvedValue(Err(submissionClosedError(CLOSED_MESSAGE)));
});

test.each([false, true])(
  'surfaces a rejected late answer with onSubmissionClosed supplied: %s',
  async (withCallback) => {
    const onSubmissionClosed = jest.fn();
    const { result } = renderHook(() =>
      useContestState(
        DEFAULT_CONTEST_ID,
        DEFAULT_USER_ID,
        withCallback ? { onSubmissionClosed } : undefined,
      ),
    );
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error).toBeNull();

    await act(async () => result.current.submit(PAYLOAD));

    expect(submitAnswer).toHaveBeenCalledWith(PAYLOAD);
    expect(result.current.error).toBe(CLOSED_MESSAGE);
    expect(result.current.answer).toBeNull();
    expect(onSubmissionClosed).toHaveBeenCalledTimes(withCallback ? 1 : 0);
  },
);
