import type { Href } from 'expo-router';
import * as Notifications from 'expo-notifications';
import { usePathname, useRouter } from 'expo-router';
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
  const { user, loading: authLoading } = useAuth();
  const { setPendingResultIntent, clearPendingResultIntent } = useNotificationRouting();
  const lastHandledIdRef = useRef<string | null>(null);

  console.log('[DEBUG] useNotificationObserver mounted, authLoading:', authLoading, 'user:', user?.id);

  const validateAndRoute = useCallback(
    async (contestId: string, url: string) => {
      console.log('[DEBUG] validateAndRoute called:', { contestId, url, userId: user?.id });
      clearPendingResultIntent();

      if (!user?.id) {
        console.log('[DEBUG] No user → routing to INDEX');
        router.push(ROUTES.INDEX);
        return;
      }

      const result = await getParticipantForUser(contestId, user.id);

      if (!result.ok) {
        console.log('[DEBUG] getParticipantForUser failed:', result.error);
        return;
      }

      const participant = result.value;
      console.log('[DEBUG] participant lookup:', participant ? { id: participant.id, eliminated: participant.elimination_round } : null);

      if (!participant) {
        console.log('[DEBUG] No participant → routing to CONTESTS');
        router.push(ROUTES.CONTESTS);
        return;
      }

      if (participant.elimination_round !== null) {
        console.log('[DEBUG] Eliminated → routing to ELIMINATED');
        router.push({ pathname: ROUTES.ELIMINATED, params: { contestId } });
        return;
      }

      // Extract base path from notification URL (remove query params)
      const notificationPath = url.split('?')[0];

      if (isResultNotificationPath(notificationPath)) {
        setPendingResultIntent({
          contestId,
          path: notificationPath,
          receivedAt: Date.now(),
        });
        console.log('[DEBUG] Routing to result intent:', url);
        if (pathname === notificationPath) {
          console.log('[DEBUG] Already on target screen, skipping duplicate navigation');
          return;
        }
        router.replace(url as Href);
        return;
      }

      // Check if we're already on the target screen
      if (pathname === notificationPath) {
        console.log('[DEBUG] Already on target screen, skipping duplicate navigation');
        return;
      }

      console.log('[DEBUG] Active participant → routing to:', url, 'current pathname:', pathname);
      router.push(url as Href);
    },
    [user?.id, router, pathname, setPendingResultIntent, clearPendingResultIntent],
  );

  useEffect(() => {
    let isMounted = true;

    const handleResponse = (response: Notifications.NotificationResponse | null) => {
      console.log('[DEBUG] handleResponse called, response:', response ? 'exists' : 'null');

      if (!response) {
        console.log('[DEBUG] No response, skipping');
        return;
      }

      if (authLoading) {
        console.log('[DEBUG] Auth still loading, skipping');
        return;
      }

      const responseId = response.notification.request.identifier;
      console.log('[DEBUG] Notification responseId:', responseId, 'lastHandled:', lastHandledIdRef.current);

      if (lastHandledIdRef.current === responseId) {
        console.log('[DEBUG] Already handled this notification, skipping');
        return;
      }

      lastHandledIdRef.current = responseId;
      const url = getUrlFromResponse(response);
      const isValid = isValidNotificationUrl(url || '');
      console.log('[DEBUG] Notification URL:', url, 'isValid:', isValid);

      if (!url || !isValid) {
        console.log('[DEBUG] Invalid URL, skipping');
        return;
      }

      const contestId = extractContestIdFromUrl(url);
      console.log('[DEBUG] Extracted contestId:', contestId);

      if (!contestId) {
        console.log('[DEBUG] No contestId, pushing URL directly:', url);
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
