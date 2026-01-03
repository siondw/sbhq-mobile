export const APP_NAME = 'Superbowl HQ';

export const APP_SHORT_NAME = 'SBHQ';

export const THEME_CONFIG = {
  SELECTED_PALETTE: 'carbon-ice-teal',
} as const;

export const LOBBY_TIPS = [
  'Stay here. The game will start automatically.',
  'Pull down to refresh if something looks stale.',
  'Some questions can have more than one correct answer.',
  'Submissions can close as soon as play resumes.',
] as const;

export const ANSWER_OPTION = {
  A: 'A',
  B: 'B',
  C: 'C',
  D: 'D',
  E: 'E',
  F: 'F',
} as const;

export type AnswerOptionValue = (typeof ANSWER_OPTION)[keyof typeof ANSWER_OPTION];

export const DEMO_CONTEST_ID = 'DEMO_CONTEST';
