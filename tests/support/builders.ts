import type { AnswerRow, ContestRow, ParticipantRow, QuestionRow } from '../../src/db/types';

type DeepPartial<T> = {
  [K in keyof T]?: T[K] extends object ? DeepPartial<T[K]> : T[K];
};

export const DEFAULT_CONTEST_ID = '00000000-0000-0000-0000-0000000000aa';
export const DEFAULT_USER_ID = '00000000-0000-0000-0000-0000000000cc';
export const DEFAULT_PARTICIPANT_ID = '00000000-0000-0000-0000-0000000000bb';
export const DEFAULT_QUESTION_ID = '00000000-0000-0000-0000-0000000000dd';
export const DEFAULT_ANSWER_ID = '00000000-0000-0000-0000-0000000000ee';

export const makeContest = (overrides: DeepPartial<ContestRow> = {}): ContestRow => ({
  id: DEFAULT_CONTEST_ID,
  name: 'Test Contest',
  start_time: new Date('2020-01-01T00:00:00.000Z').toISOString(),
  state: 'UPCOMING',
  current_round: null,
  created_at: null,
  price: null,
  ...overrides,
});

export const makeParticipant = (overrides: DeepPartial<ParticipantRow> = {}): ParticipantRow => ({
  id: DEFAULT_PARTICIPANT_ID,
  contest_id: DEFAULT_CONTEST_ID,
  user_id: DEFAULT_USER_ID,
  created_at: new Date('2020-01-01T00:00:00.000Z').toISOString(),
  elimination_round: null,
  ...overrides,
});

export const makeQuestion = (overrides: DeepPartial<QuestionRow> = {}): QuestionRow => ({
  id: DEFAULT_QUESTION_ID,
  contest_id: DEFAULT_CONTEST_ID,
  round: 1,
  question: 'Test question?',
  options: ['Run', 'Pass'],
  correct_option: null,
  ...overrides,
});

export const makeAnswer = (overrides: DeepPartial<AnswerRow> = {}): AnswerRow => ({
  id: DEFAULT_ANSWER_ID,
  contest_id: DEFAULT_CONTEST_ID,
  participant_id: DEFAULT_PARTICIPANT_ID,
  question_id: DEFAULT_QUESTION_ID,
  round: 1,
  answer: 'A',
  timestamp: null,
  ...overrides,
});
