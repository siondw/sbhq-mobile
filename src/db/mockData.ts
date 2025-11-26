import type {
  AnswerRow,
  ContestRow,
  ParticipantInsert,
  ParticipantRow,
  QuestionRow,
  UserRow,
} from './types';

const now = new Date();

export const mockUsers: UserRow[] = [
  {
    id: 'user-1',
    username: 'PlayerOne',
    email: 'player@example.com',
    role: 'user',
    created_at: now.toISOString(),
    updated_at: now.toISOString(),
  },
];

export const mockContests: ContestRow[] = [
  {
    id: 'contest-1',
    name: 'Sunday Showdown',
    current_round: 1,
    finished: false,
    lobby_open: true,
    submission_open: true,
    start_time: new Date(now.getTime() + 10 * 60 * 1000).toISOString(),
    price: null,
    created_at: now.toISOString(),
  },
];

export let mockParticipants: ParticipantRow[] = [
  {
    id: 'participant-1',
    contest_id: 'contest-1',
    user_id: 'user-1',
    active: true,
    elimination_round: null,
  },
];

export const mockQuestions: QuestionRow[] = [
  {
    id: 'question-1',
    contest_id: 'contest-1',
    round: 1,
    question: 'What will be the first play?',
    options: {
      A: 'Run',
      B: 'Pass',
      C: 'Field Goal',
    },
    correct_option: null,
  },
];

export let mockAnswers: AnswerRow[] = [];

export const createParticipantMock = (payload: ParticipantInsert): ParticipantRow => {
  const participant: ParticipantRow = {
    id: `participant-${Date.now()}`,
    active: payload.active ?? true,
    elimination_round: payload.elimination_round ?? null,
    contest_id: payload.contest_id,
    user_id: payload.user_id,
  };
  mockParticipants = [...mockParticipants, participant];
  return participant;
};

export const upsertAnswerMock = (answer: AnswerRow): AnswerRow => {
  const existingIndex = mockAnswers.findIndex(
    (a) => a.participant_id === answer.participant_id && a.question_id === answer.question_id,
  );
  if (existingIndex >= 0) {
    mockAnswers[existingIndex] = answer;
  } else {
    mockAnswers = [...mockAnswers, answer];
  }
  return answer;
};
