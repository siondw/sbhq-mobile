export const APP_NAME = 'Superbowl HQ';

export const APP_SHORT_NAME = 'SBHQ';

export const THEME_CONFIG = {
  SELECTED_PALETTE: 'carbon-ice-teal',
} as const;

export const ANSWER_OPTION = {
  A: 'A',
  B: 'B',
  C: 'C',
  D: 'D',
  E: 'E',
  F: 'F',
} as const;

export type AnswerOptionValue = (typeof ANSWER_OPTION)[keyof typeof ANSWER_OPTION];
