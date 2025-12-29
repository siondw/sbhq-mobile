import { NOTIFICATION_URLS } from './constants';
import type { NotificationType } from './types';
import { NOTIFICATION_TYPES } from './types';

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
      return NOTIFICATION_URLS.LOBBY;
    case NOTIFICATION_TYPES.STARTS_IN_60S:
      return `${GAME_PATH_PREFIX}${contestId}`;
    case NOTIFICATION_TYPES.QUESTION_OPEN:
      if (isValidRoundValue(round)) {
        return `${GAME_PATH_PREFIX}${contestId}?round=${round}`;
      }
      return `${GAME_PATH_PREFIX}${contestId}`;
    case NOTIFICATION_TYPES.RESULT_POSTED:
      return `${GAME_PATH_PREFIX}${contestId}`;
  }
};

const hasOnlyRoundParam = (searchParams: URLSearchParams) => {
  for (const key of searchParams.keys()) {
    if (key !== 'round') {
      return false;
    }
  }
  return true;
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

  if (!hasOnlyRoundParam(parsed.searchParams)) {
    return false;
  }

  const roundParam = parsed.searchParams.get('round');
  if (roundParam && !/^\d+$/.test(roundParam)) {
    return false;
  }

  if (parsed.pathname === NOTIFICATION_URLS.LOBBY) {
    return true;
  }

  if (!parsed.pathname.startsWith(GAME_PATH_PREFIX)) {
    return false;
  }

  const contestId = parsed.pathname.slice(GAME_PATH_PREFIX.length);
  if (!contestId || contestId.includes('/')) {
    return false;
  }

  return true;
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

  if (!parsed.pathname.startsWith(GAME_PATH_PREFIX)) {
    return null;
  }

  const contestId = parsed.pathname.slice(GAME_PATH_PREFIX.length);
  if (!contestId || contestId.includes('/')) {
    return null;
  }

  return contestId;
};
