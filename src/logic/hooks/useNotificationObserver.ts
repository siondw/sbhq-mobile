import type { Href } from 'expo-router';
import * as Notifications from 'expo-notifications';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useRef } from 'react';

import { ROUTES } from '../../configs/routes';
import { getParticipantForUser } from '../../db/participants';
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

/**
 * Handles notification tap routing with validation:
 * - Not logged in → login page
 * - Not a participant → contest list
 * - Eliminated → eliminated screen
 * - Active participant → trust notification URL
 */
export const useNotificationObserver = () => {
  const router = useRouter();
  const { user } = useAuth();
  const lastHandledIdRef = useRef<string | null>(null);

  const validateAndRoute = useCallback(
    async (contestId: string, url: string) => {
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

      router.push(url as Href);
    },
    [user?.id, router],
  );

  useEffect(() => {
    let isMounted = true;

    const handleResponse = (response: Notifications.NotificationResponse | null) => {
      if (!response) {
        return;
      }

      const responseId = response.notification.request.identifier;
      if (lastHandledIdRef.current === responseId) {
        return;
      }

      lastHandledIdRef.current = responseId;
      const url = getUrlFromResponse(response);
      if (!url || !isValidNotificationUrl(url)) {
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
  }, [router, validateAndRoute]);
};
