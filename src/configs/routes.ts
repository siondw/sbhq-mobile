export const ROUTES = {
  INDEX: '/',
  CONTESTS: '/contests',
  LOBBY: '/lobby',
  GAME: '/game',
  SUBMITTED: '/submitted',
  CORRECT: '/correct',
  ELIMINATED: '/eliminated',
  WINNER: '/winner',
} as const;

export const buildContestRoute = (contestId: string) => ({
  pathname: `${ROUTES.GAME}/[contestId]` as const,
  params: { contestId },
});
