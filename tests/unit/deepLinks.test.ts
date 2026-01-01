import {
  extractContestIdFromUrl,
  getDeepLinkForNotification,
  isValidNotificationUrl,
} from '../../src/logic/notifications/deepLinks';
import { NOTIFICATION_TYPES } from '../../src/logic/notifications/types';
import { DEFAULT_CONTEST_ID } from '../support/builders';

describe('notifications/deepLinks', () => {
  test('getDeepLinkForNotification builds expected urls for types', () => {
    expect(getDeepLinkForNotification(NOTIFICATION_TYPES.STARTS_IN_10M, DEFAULT_CONTEST_ID)).toBe(
      `/lobby/${DEFAULT_CONTEST_ID}`,
    );

    expect(getDeepLinkForNotification(NOTIFICATION_TYPES.QUESTION_OPEN, DEFAULT_CONTEST_ID, 2)).toBe(
      `/game/${DEFAULT_CONTEST_ID}?round=2`,
    );

    expect(getDeepLinkForNotification(NOTIFICATION_TYPES.RESULT_CORRECT, DEFAULT_CONTEST_ID)).toBe(
      `/correct/${DEFAULT_CONTEST_ID}`,
    );

    expect(
      getDeepLinkForNotification(NOTIFICATION_TYPES.RESULT_ELIMINATED, DEFAULT_CONTEST_ID, 1),
    ).toBe(`/eliminated/${DEFAULT_CONTEST_ID}?round=1`);
  });

  test('isValidNotificationUrl accepts supported paths and params', () => {
    expect(isValidNotificationUrl(`/lobby/${DEFAULT_CONTEST_ID}`)).toBe(true);
    expect(isValidNotificationUrl(`/game/${DEFAULT_CONTEST_ID}`)).toBe(true);
    expect(isValidNotificationUrl(`/game/${DEFAULT_CONTEST_ID}?round=1`)).toBe(true);
    expect(isValidNotificationUrl(`/correct/${DEFAULT_CONTEST_ID}`)).toBe(true);
    expect(isValidNotificationUrl(`/eliminated/${DEFAULT_CONTEST_ID}?round=1`)).toBe(true);
  });

  test('extractContestIdFromUrl extracts contestId for supported urls', () => {
    expect(extractContestIdFromUrl(`/lobby/${DEFAULT_CONTEST_ID}`)).toBe(DEFAULT_CONTEST_ID);
    expect(extractContestIdFromUrl(`/game/${DEFAULT_CONTEST_ID}?round=3`)).toBe(DEFAULT_CONTEST_ID);
    expect(extractContestIdFromUrl(`/correct/${DEFAULT_CONTEST_ID}`)).toBe(DEFAULT_CONTEST_ID);
    expect(extractContestIdFromUrl(`/eliminated/${DEFAULT_CONTEST_ID}`)).toBe(DEFAULT_CONTEST_ID);
  });

  test('rejects invalid urls', () => {
    expect(isValidNotificationUrl(`lobby/${DEFAULT_CONTEST_ID}`)).toBe(false);
    expect(isValidNotificationUrl(`/game/${DEFAULT_CONTEST_ID}?foo=1`)).toBe(false);
    expect(isValidNotificationUrl(`/game/${DEFAULT_CONTEST_ID}?round=abc`)).toBe(false);
    expect(isValidNotificationUrl(`/lobby/${DEFAULT_CONTEST_ID}/extra`)).toBe(false);
  });
});

