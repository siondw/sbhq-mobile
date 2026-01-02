import type { Href } from 'expo-router';
import * as Notifications from 'expo-notifications';
import { useGlobalSearchParams, usePathname, useRouter } from 'expo-router';
import { useCallback, useEffect, useRef } from 'react';

import { ROUTES } from '../../configs/routes';
import { getParticipantForUser } from '../../db/participants';
import { useNotificationRouting } from '../contexts';
import { extractContestIdFromUrl, isValidNotificationUrl } from '../notifications';
import { useAuth } from './useAuth';

const getUrlFromResponse = (response: Notifications.NotificationResponse | null) => {
  if (!response) {
    return null;
  }

  if (response.actionIdentifier !== Notifications.DEFAULT_ACTION_IDENTIFIER) {
    return null;
  }

  const data = response.notification.request.content.data;
  if (!data || typeof data !== 'object') {
    return null;
  }

  const url = (data as { url?: unknown }).url;
  return typeof url === 'string' ? url : null;
};

const isResultNotificationPath = (path: string) =>
  path.startsWith('/correct/') || path.startsWith('/eliminated/');

/**
 * Handles notification tap routing with validation:
 * - Not logged in → login page
 * - Not a participant → contest list
 * - Eliminated → eliminated screen
 * - Active participant → trust notification URL
 */
export const useNotificationObserver = () => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useGlobalSearchParams<{ contestId?: string }>();
  const { user, loading: authLoading } = useAuth();
  const { setPendingResultIntent, clearPendingResultIntent } = useNotificationRouting();
  const lastHandledIdRef = useRef<string | null>(null);
  const currentContestId =
    extractContestIdFromUrl(pathname) ??
    (typeof searchParams.contestId === 'string'
      ? searchParams.contestId
      : Array.isArray(searchParams.contestId)
        ? (searchParams.contestId[0] ?? null)
        : null);

  const validateAndRoute = useCallback(
    async (contestId: string, url: string) => {
      clearPendingResultIntent();

      if (!user?.id) {
        router.push(ROUTES.INDEX);
        return;
      }

      const result = await getParticipantForUser(contestId, user.id);

      if (!result.ok) {
        return;
      }

      const participant = result.value;

      if (!participant) {
        router.push(ROUTES.CONTESTS);
        return;
      }

      if (participant.elimination_round !== null) {
        router.push({ pathname: ROUTES.ELIMINATED, params: { contestId } });
        return;
      }

      // Extract base path from notification URL (remove query params)
      const notificationPath = url.split('?')[0];
      const isResultNotification = isResultNotificationPath(notificationPath);

      if (!isResultNotification && currentContestId === contestId) {
        // Avoid double-navigation when already in the same contest flow.
        // ContestRouter handles the state-based redirect.
        return;
      }

      if (isResultNotification) {
        setPendingResultIntent({
          contestId,
          path: notificationPath,
          receivedAt: Date.now(),
        });
        if (pathname === notificationPath) {
          return;
        }
        router.replace(url as Href);
        return;
      }

      // Check if we're already on the target screen
      if (pathname === notificationPath) {
        return;
      }

      router.push(url as Href);
    },
    [
      user?.id,
      router,
      pathname,
      currentContestId,
      setPendingResultIntent,
      clearPendingResultIntent,
    ],
  );

  useEffect(() => {
    let isMounted = true;

    const handleResponse = (response: Notifications.NotificationResponse | null) => {
      if (!response) {
        return;
      }

      if (authLoading) {
        return;
      }

      const responseId = response.notification.request.identifier;

      if (lastHandledIdRef.current === responseId) {
        return;
      }

      lastHandledIdRef.current = responseId;
      const url = getUrlFromResponse(response);
      const isValid = isValidNotificationUrl(url || '');

      if (!url || !isValid) {
        return;
      }

      const contestId = extractContestIdFromUrl(url);

      if (!contestId) {
        router.push(url as Href);
        return;
      }

      void validateAndRoute(contestId, url);
    };

    void Notifications.getLastNotificationResponseAsync().then((response) => {
      if (!isMounted) {
        return;
      }
      handleResponse(response);
    });

    const subscription = Notifications.addNotificationResponseReceivedListener(handleResponse);

    return () => {
      isMounted = false;
      subscription.remove();
    };
  }, [router, validateAndRoute, authLoading]);
};
