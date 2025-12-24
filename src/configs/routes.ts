export const ROUTES = {
  INDEX: '/',
  CONTESTS: '/contests',
  LOBBY: '/lobby',
  CONTEST: '/contest',
  SUBMITTED: '/submitted',
  CORRECT: '/correct',
  ELIMINATED: '/eliminated',
  WINNER: '/winner',
} as const;

export const buildContestRoute = (contestId: string): string => `${ROUTES.CONTEST}/${contestId}`;
