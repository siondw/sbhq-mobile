export const APP_NAME = 'Superbowl HQ';

export const APP_SHORT_NAME = 'SBHQ';

// Theme configuration
export const THEME_CONFIG = {
  // Key of the palette to use from palettes.ts
  // Options: 'default', 'carbon-teal-classic', 'carbon-yellow-pro', etc.
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
