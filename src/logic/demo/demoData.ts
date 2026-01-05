import { DEMO_CONTEST_ID } from '../../configs/constants';
import type { AnswerRow, ContestRow, ParticipantRow, QuestionRow } from '../../db/types';
import { CONTEST_STATE } from '../constants';

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
  // Phase 0: LOBBY (0-5s)
  {
    name: 'LOBBY',
    durationMs: 5000,
    tip: 'This is the lobby. Wait here until the game starts. The countdown shows when Round 1 begins.',
    contest: {
      id: DEMO_CONTEST_ID,
      name: 'Steelers vs Ravens - Demo',
      state: CONTEST_STATE.LOBBY_OPEN,
      current_round: null,
      start_time_offset_ms: 5000,
      price: 0,
      created_at: now,
    },
    participant: {
      id: DEMO_PARTICIPANT_ID,
      contest_id: DEMO_CONTEST_ID,
      user_id: DEMO_USER_ID,
      elimination_round: null,
      created_at: now,
    },
    question: null,
    answer: null,
  },

  // Phase 1: ROUND 1 - ANSWERING (5-8s)
  {
    name: 'ROUND_1_ANSWERING',
    durationMs: 5000,
    tip: 'A question appeared! Answer quick! Submissions lock when the live NFL broadcast returns to play. One answer only',
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
        C: 'Mark Andrews + Isiah Likely',
        D: 'Everyone else combined',
      },
      correct_option: null,
    },
    answer: null,
  },

  // Phase 2: ROUND 1 - SUBMITTED (8-10s)
  {
    name: 'ROUND_1_SUBMITTED',
    durationMs: 5000,
    tip: 'Answer locked in! Now wait for the play to happen and see if you got it right.',
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
        C: 'Mark Andrews + Isiah Likely',
        D: 'Everyone else combined',
      },
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

  // Phase 3: ROUND 1 - CORRECT (10-15s)
  {
    name: 'ROUND_1_CORRECT',
    durationMs: 5000,
    tip: "You got it right! You advance to the next round. Get it wrong and you're eliminated.",
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
        C: 'Mark Andrews + Isiah Likely',
        D: 'Everyone else combined',
      },
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

  // Phase 4: ROUND 2 - ANSWERING (15-18s)
  {
    name: 'ROUND_2_ANSWERING',
    durationMs: 5000,
    tip: 'Round 2! Each round brings a new question. Stay sharp and keep predicting!',
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
      elimination_round: null,
      created_at: now,
    },
    question: {
      id: 'demo-q2',
      contest_id: DEMO_CONTEST_ID,
      round: 2,
      question: 'Will Lamar Jackson complete his first pass attempt?',
      options: {
        A: 'Complete for 10+ yards',
        B: 'Complete for under 10 yards',
        C: 'Incomplete',
        D: 'Interception',
      },
      correct_option: null,
    },
    answer: null,
  },

  // Phase 5: ROUND 2 - SUBMITTED (18-20s)
  {
    name: 'ROUND_2_SUBMITTED',
    durationMs: 5000,
    tip: 'Answer submitted! Fingers crossed...',
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
      elimination_round: null,
      created_at: now,
    },
    question: {
      id: 'demo-q2',
      contest_id: DEMO_CONTEST_ID,
      round: 2,
      question: 'Will Lamar Jackson complete his first pass attempt?',
      options: {
        A: 'Complete for 10+ yards',
        B: 'Complete for under 10 yards',
        C: 'Incomplete',
        D: 'Interception',
      },
      correct_option: null,
    },
    answer: {
      id: 'demo-a2',
      participant_id: DEMO_PARTICIPANT_ID,
      question_id: 'demo-q2',
      contest_id: DEMO_CONTEST_ID,
      round: 2,
      answer: 'A',
      timestamp: now,
    },
  },

  // Phase 6: ROUND 2 - ELIMINATED (20s+)
  {
    name: 'ROUND_2_ELIMINATED',
    durationMs: Number.POSITIVE_INFINITY,
    tip: 'Eliminated! Wrong answer ends your run. In real games, last player standing wins the pot!',
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
      elimination_round: 2,
      created_at: now,
    },
    question: {
      id: 'demo-q2',
      contest_id: DEMO_CONTEST_ID,
      round: 2,
      question: 'Will Lamar Jackson complete his first pass attempt?',
      options: {
        A: 'Complete for 10+ yards',
        B: 'Complete for under 10 yards',
        C: 'Incomplete',
        D: 'Interception',
      },
      correct_option: ['C'],
    },
    answer: {
      id: 'demo-a2',
      participant_id: DEMO_PARTICIPANT_ID,
      question_id: 'demo-q2',
      contest_id: DEMO_CONTEST_ID,
      round: 2,
      answer: 'A',
      timestamp: now,
    },
  },

  // Phase 7: DEMO COMPLETE (after elimination)
  {
    name: 'DEMO_COMPLETE',
    durationMs: Number.POSITIVE_INFINITY,
    tip: 'Demo complete! You now know how to play. Join a real contest to compete for the prize!',
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
      elimination_round: 2,
      created_at: now,
    },
    question: null,
    answer: null,
  },
];
