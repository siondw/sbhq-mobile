export const ROUTES = {
  INDEX: '/',
  CONTESTS: '/contests',
  LOBBY: '/lobby/[contestId]',
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

export const buildLobbyRoute = (contestId: string) => ({
  pathname: ROUTES.LOBBY,
  params: { contestId },
});
