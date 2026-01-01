import { NOTIFICATION_URLS } from './constants';
import type { NotificationType } from './types';
import { NOTIFICATION_TYPES } from './types';

const LOBBY_PATH_PREFIX = `${NOTIFICATION_URLS.LOBBY_ROOT}/`;
const GAME_PATH_PREFIX = `${NOTIFICATION_URLS.GAME_ROOT}/`;

const isValidRoundValue = (round?: number) =>
  typeof round === 'number' && Number.isInteger(round) && round > 0;

export const getDeepLinkForNotification = (
  type: NotificationType,
  contestId: string,
  round?: number,
) => {
  switch (type) {
    case NOTIFICATION_TYPES.STARTS_IN_10M:
    case NOTIFICATION_TYPES.STARTS_IN_60S:
      return `${LOBBY_PATH_PREFIX}${contestId}`;
    case NOTIFICATION_TYPES.QUESTION_OPEN:
      if (isValidRoundValue(round)) {
        return `${GAME_PATH_PREFIX}${contestId}?round=${round}`;
      }
      return `${GAME_PATH_PREFIX}${contestId}`;
    case NOTIFICATION_TYPES.RESULT_POSTED:
      return `${GAME_PATH_PREFIX}${contestId}`;
    case NOTIFICATION_TYPES.RESULT_CORRECT:
      return `/correct/${contestId}`;
    case NOTIFICATION_TYPES.RESULT_ELIMINATED:
      if (isValidRoundValue(round)) {
        return `/eliminated/${contestId}?round=${round}`;
      }
      return `/eliminated/${contestId}`;
  }
};

const hasValidParams = (searchParams: URLSearchParams) => {
  for (const key of searchParams.keys()) {
    if (key !== 'round') {
      return false;
    }
  }
  return true;
};

const extractContestIdFromPath = (pathname: string, prefix: string): string | null => {
  if (!pathname.startsWith(prefix)) {
    return null;
  }
  const contestId = pathname.slice(prefix.length);
  if (!contestId || contestId.includes('/')) {
    return null;
  }
  return contestId;
};

export const isValidNotificationUrl = (url: string) => {
  if (typeof url !== 'string' || !url.startsWith('/')) {
    return false;
  }

  let parsed: URL;
  try {
    parsed = new URL(url, 'sbhqmobile://');
  } catch {
    return false;
  }

  if (!hasValidParams(parsed.searchParams)) {
    return false;
  }

  const roundParam = parsed.searchParams.get('round');
  if (roundParam && !/^\d+$/.test(roundParam)) {
    return false;
  }

  const lobbyContestId = extractContestIdFromPath(parsed.pathname, LOBBY_PATH_PREFIX);
  if (lobbyContestId) {
    return true;
  }

  const gameContestId = extractContestIdFromPath(parsed.pathname, GAME_PATH_PREFIX);
  if (gameContestId) {
    return true;
  }

  const correctPathPrefix = '/correct/';
  const correctContestId = extractContestIdFromPath(parsed.pathname, correctPathPrefix);
  if (correctContestId) {
    return true;
  }

  const eliminatedPathPrefix = '/eliminated/';
  const eliminatedContestId = extractContestIdFromPath(parsed.pathname, eliminatedPathPrefix);
  if (eliminatedContestId) {
    return true;
  }

  return false;
};

export const extractContestIdFromUrl = (url: string): string | null => {
  if (typeof url !== 'string' || !url.startsWith('/')) {
    return null;
  }

  let parsed: URL;
  try {
    parsed = new URL(url, 'sbhqmobile://');
  } catch {
    return null;
  }

  const lobbyContestId = extractContestIdFromPath(parsed.pathname, LOBBY_PATH_PREFIX);
  if (lobbyContestId) {
    return lobbyContestId;
  }

  const gameContestId = extractContestIdFromPath(parsed.pathname, GAME_PATH_PREFIX);
  if (gameContestId) {
    return gameContestId;
  }

  const correctPathPrefix = '/correct/';
  const correctContestId = extractContestIdFromPath(parsed.pathname, correctPathPrefix);
  if (correctContestId) {
    return correctContestId;
  }

  const eliminatedPathPrefix = '/eliminated/';
  return extractContestIdFromPath(parsed.pathname, eliminatedPathPrefix);
};
