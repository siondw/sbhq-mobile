import { DEMO_CONTEST_ID } from '../../configs/constants';
import type { AnswerRow, ContestRow, ParticipantRow, QuestionRow } from '../../db/types';
import { CONTEST_STATE, REGISTRATION_STATUS } from '../constants';

export const DEMO_PARTICIPANT_ID = 'demo-participant';
export const DEMO_USER_ID = 'demo-user';

export interface DemoPhase {
  name: string;
  durationMs: number;
  tip: string;
  contest: Omit<ContestRow, 'start_time'> & { start_time_offset_ms?: number };
  participant: ParticipantRow;
  question: QuestionRow | null;
  answer: AnswerRow | null;
}

export interface HydratedDemoPhase extends Omit<DemoPhase, 'contest'> {
  contest: ContestRow;
}

const now = new Date().toISOString();

export const DEMO_PHASES: DemoPhase[] = [
  // Phase 0: LOBBY (0-10s)
  {
    name: 'LOBBY',
    durationMs: 10000,
    tip: "Welcome to the lobby. This is where you'll wait until the contest starts! The Game Admin will open the first question when the live game starts.",
    contest: {
      id: DEMO_CONTEST_ID,
      name: 'Steelers vs Ravens - Demo',
      state: CONTEST_STATE.LOBBY_OPEN,
      current_round: null,
      start_time_offset_ms: 10000,
      price: 0,
      created_at: now,
    },
    participant: {
      id: DEMO_PARTICIPANT_ID,
      contest_id: DEMO_CONTEST_ID,
      user_id: DEMO_USER_ID,
      registration_status: REGISTRATION_STATUS.APPROVED,
      elimination_round: null,
      created_at: now,
    },
    question: null,
    answer: null,
  },

  // Phase 1: ROUND 1 - ANSWERING (10-20s)
  {
    name: 'ROUND_1_ANSWERING',
    durationMs: 10000,
    tip: "Round 1 is live. The Ravens just won the toss and are about to take the field. The Game Admin closes submissions as play starts - submit before it closes; once it does, you're locked in.",
    contest: {
      id: DEMO_CONTEST_ID,
      name: 'Steelers vs Ravens - Demo',
      state: CONTEST_STATE.ROUND_IN_PROGRESS,
      current_round: 1,
      price: 0,
      created_at: now,
    },
    participant: {
      id: DEMO_PARTICIPANT_ID,
      contest_id: DEMO_CONTEST_ID,
      user_id: DEMO_USER_ID,
      registration_status: REGISTRATION_STATUS.APPROVED,
      elimination_round: null,
      created_at: now,
    },
    question: {
      id: 'demo-q1',
      contest_id: DEMO_CONTEST_ID,
      round: 1,
      question: 'Who will gain the most yards this drive? (Rush + Rec)',
      options: {
        A: 'Zay Flowers',
        B: 'Derrick Henry',
        C: 'Mark Andrews + Isaiah Likely',
        D: 'Everyone else combined',
      },
      processing_status: 'PENDING',
      correct_option: null,
    },
    answer: null,
  },

  // Phase 2: ROUND 1 - SUBMITTED (20-26s)
  {
    name: 'ROUND_1_SUBMITTED',
    durationMs: 6000,
    tip: "Your answer is locked in. Wait for the drive to finish. The Game Admin will process results when the drive ends. If you're correct, you'll advance to the next round!",
    contest: {
      id: DEMO_CONTEST_ID,
      name: 'Steelers vs Ravens - Demo',
      state: CONTEST_STATE.ROUND_IN_PROGRESS,
      current_round: 1,
      price: 0,
      created_at: now,
    },
    participant: {
      id: DEMO_PARTICIPANT_ID,
      contest_id: DEMO_CONTEST_ID,
      user_id: DEMO_USER_ID,
      registration_status: REGISTRATION_STATUS.APPROVED,
      elimination_round: null,
      created_at: now,
    },
    question: {
      id: 'demo-q1',
      contest_id: DEMO_CONTEST_ID,
      round: 1,
      question: 'Who will gain the most yards this drive? (Rush + Rec)',
      options: {
        A: 'Zay Flowers',
        B: 'Derrick Henry',
        C: 'Mark Andrews + Isaiah Likely',
        D: 'Everyone else combined',
      },
      processing_status: 'PENDING',
      correct_option: null,
    },
    answer: {
      id: 'demo-a1',
      participant_id: DEMO_PARTICIPANT_ID,
      question_id: 'demo-q1',
      contest_id: DEMO_CONTEST_ID,
      round: 1,
      answer: 'A',
      timestamp: now,
    },
  },

  // Phase 3: ROUND 1 - CORRECT (30-40s)
  {
    name: 'ROUND_1_CORRECT',
    durationMs: 10000,
    tip: 'You got it right and are moving on to Round 2! Wrong answers and missed submissions were eliminated.',
    contest: {
      id: DEMO_CONTEST_ID,
      name: 'Steelers vs Ravens - Demo',
      state: CONTEST_STATE.ROUND_CLOSED,
      current_round: 1,
      price: 0,
      created_at: now,
    },
    participant: {
      id: DEMO_PARTICIPANT_ID,
      contest_id: DEMO_CONTEST_ID,
      user_id: DEMO_USER_ID,
      registration_status: REGISTRATION_STATUS.APPROVED,
      elimination_round: null,
      created_at: now,
    },
    question: {
      id: 'demo-q1',
      contest_id: DEMO_CONTEST_ID,
      round: 1,
      question: 'Who will gain the most yards this drive? (Rush + Rec)',
      options: {
        A: 'Zay Flowers',
        B: 'Derrick Henry',
        C: 'Mark Andrews + Isaiah Likely',
        D: 'Everyone else combined',
      },
      processing_status: 'COMPLETE',
      correct_option: ['A'],
    },
    answer: {
      id: 'demo-a1',
      participant_id: DEMO_PARTICIPANT_ID,
      question_id: 'demo-q1',
      contest_id: DEMO_CONTEST_ID,
      round: 1,
      answer: 'A',
      timestamp: now,
    },
  },

  // Phase 4: ROUND 2 - ANSWERING (40-50s)
  {
    name: 'ROUND_2_ANSWERING',
    durationMs: 10000,
    tip: 'The Steelers are now getting the ball. Pick your answer before the broadcast comes back from commercial!',
    contest: {
      id: DEMO_CONTEST_ID,
      name: 'Steelers vs Ravens - Demo',
      state: CONTEST_STATE.ROUND_IN_PROGRESS,
      current_round: 2,
      price: 0,
      created_at: now,
    },
    participant: {
      id: DEMO_PARTICIPANT_ID,
      contest_id: DEMO_CONTEST_ID,
      user_id: DEMO_USER_ID,
      registration_status: REGISTRATION_STATUS.APPROVED,
      elimination_round: null,
      created_at: now,
    },
    question: {
      id: 'demo-q2',
      contest_id: DEMO_CONTEST_ID,
      round: 2,
      question: 'How many 1st downs will the Steelers record on this drive?',
      options: {
        A: '0',
        B: '1',
        C: '2',
        D: '3+',
      },
      processing_status: 'PENDING',
      correct_option: null,
    },
    answer: null,
  },

  // Phase 5: ROUND 2 - SUBMITTED (50-60s)
  {
    name: 'ROUND_2_SUBMITTED',
    durationMs: 10000,
    tip: 'Answer submitted. Stay here while the drive finishes and the correct result is set.',
    contest: {
      id: DEMO_CONTEST_ID,
      name: 'Steelers vs Ravens - Demo',
      state: CONTEST_STATE.ROUND_IN_PROGRESS,
      current_round: 2,
      price: 0,
      created_at: now,
    },
    participant: {
      id: DEMO_PARTICIPANT_ID,
      contest_id: DEMO_CONTEST_ID,
      user_id: DEMO_USER_ID,
      registration_status: REGISTRATION_STATUS.APPROVED,
      elimination_round: null,
      created_at: now,
    },
    question: {
      id: 'demo-q2',
      contest_id: DEMO_CONTEST_ID,
      round: 2,
      question: 'How many 1st downs will the Steelers record on this drive?',
      options: {
        A: '0',
        B: '1',
        C: '2',
        D: '3+',
      },
      processing_status: 'PENDING',
      correct_option: null,
    },
    answer: {
      id: 'demo-a2',
      participant_id: DEMO_PARTICIPANT_ID,
      question_id: 'demo-q2',
      contest_id: DEMO_CONTEST_ID,
      round: 2,
      answer: 'B',
      timestamp: now,
    },
  },

  // Phase 6: ROUND 2 - ELIMINATED (60-70s)
  {
    name: 'ROUND_2_ELIMINATED',
    durationMs: 10000,
    tip: 'Eliminated! You got it wrong this time. In live contests, only a few players make it to the end.',
    contest: {
      id: DEMO_CONTEST_ID,
      name: 'Steelers vs Ravens - Demo',
      state: CONTEST_STATE.ROUND_CLOSED,
      current_round: 2,
      price: 0,
      created_at: now,
    },
    participant: {
      id: DEMO_PARTICIPANT_ID,
      contest_id: DEMO_CONTEST_ID,
      user_id: DEMO_USER_ID,
      registration_status: REGISTRATION_STATUS.APPROVED,
      elimination_round: 2,
      created_at: now,
    },
    question: {
      id: 'demo-q2',
      contest_id: DEMO_CONTEST_ID,
      round: 2,
      question: 'How many 1st downs will the Steelers record on this drive?',
      options: {
        A: '0',
        B: '1',
        C: '2',
        D: '3+',
      },
      processing_status: 'COMPLETE',
      correct_option: ['D'],
    },
    answer: {
      id: 'demo-a2',
      participant_id: DEMO_PARTICIPANT_ID,
      question_id: 'demo-q2',
      contest_id: DEMO_CONTEST_ID,
      round: 2,
      answer: 'B',
      timestamp: now,
    },
  },

  // Phase 7: DEMO COMPLETE (after elimination)
  {
    name: 'DEMO_COMPLETE',
    durationMs: Number.POSITIVE_INFINITY,
    tip: 'Demo complete. Join a real contest to play for prizes.',
    contest: {
      id: DEMO_CONTEST_ID,
      name: 'Steelers vs Ravens - Demo',
      state: CONTEST_STATE.FINISHED,
      current_round: 2,
      price: 0,
      created_at: now,
    },
    participant: {
      id: DEMO_PARTICIPANT_ID,
      contest_id: DEMO_CONTEST_ID,
      user_id: DEMO_USER_ID,
      registration_status: REGISTRATION_STATUS.APPROVED,
      elimination_round: 2,
      created_at: now,
    },
    question: null,
    answer: null,
  },
];
