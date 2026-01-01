import { usePathname, useRouter } from 'expo-router';
import { useEffect } from 'react';
import { buildContestRoute, buildLobbyRoute, ROUTES } from '../../configs/routes';
import { PLAYER_STATE } from '../constants';
import { useNotificationRouting } from '../contexts';
import LoadingView from '../../ui/components/LoadingView';

interface ContestRouterProps {
  contestId: string | undefined;
  playerState: string;
  loading: boolean;
  children: React.ReactNode;
  validState: string;
  startTime?: string; // For LobbyScreen
}

/**
 * Centralized routing wrapper for contest screens.
 *
 * Handles all playerState-based redirects in one place to prevent screens from
 * rendering with wrong states. Shows LoadingView during state transitions.
 *
 * This eliminates UI flicker by:
 * 1. Detecting wrong playerState synchronously in render
 * 2. Showing LoadingView instead of stale screen content
 * 3. Redirecting via useEffect (after render completes)
 * 4. New screen mounts with correct state
 */
export const ContestRouter = ({
  contestId,
  playerState,
  loading,
  children,
  validState,
  startTime,
}: ContestRouterProps) => {
  const router = useRouter();
  const pathname = usePathname();
  const { pendingResultIntent, clearPendingResultIntent } = useNotificationRouting();

  const isPendingResultForPath =
    !!pendingResultIntent &&
    !!contestId &&
    pendingResultIntent.contestId === contestId &&
    pathname === pendingResultIntent.path;

  const shouldHoldResultRedirect =
    isPendingResultForPath &&
    (playerState === PLAYER_STATE.SUBMITTED_WAITING || playerState === PLAYER_STATE.UNKNOWN);

  useEffect(() => {
    if (isPendingResultForPath && playerState === validState) {
      clearPendingResultIntent();
    }
  }, [isPendingResultForPath, playerState, validState, clearPendingResultIntent]);

  useEffect(() => {
    console.log('[ContestRouter] playerState:', playerState, 'validState:', validState);

    if (!contestId || loading || playerState === PLAYER_STATE.UNKNOWN) {
      console.log('[ContestRouter] Skipping redirect - not ready');
      return;
    }

    if (shouldHoldResultRedirect) {
      console.log('[ContestRouter] Holding redirect for result intent');
      return;
    }

    // If playerState doesn't match this screen's valid state, redirect
    if (playerState !== validState) {
      console.log('[ContestRouter] Redirecting from', validState, 'to state:', playerState);

      switch (playerState) {
        case PLAYER_STATE.LOBBY:
          router.replace({
            ...buildLobbyRoute(contestId),
            params: { contestId, ...(startTime && { startTime }) },
          });
          break;
        case PLAYER_STATE.ANSWERING:
          router.replace(buildContestRoute(contestId));
          break;
        case PLAYER_STATE.SUBMITTED_WAITING:
          router.replace({ pathname: ROUTES.SUBMITTED, params: { contestId } });
          break;
        case PLAYER_STATE.CORRECT_WAITING_NEXT:
          router.replace({ pathname: ROUTES.CORRECT, params: { contestId } });
          break;
        case PLAYER_STATE.ELIMINATED:
          router.replace({ pathname: ROUTES.ELIMINATED, params: { contestId } });
          break;
        case PLAYER_STATE.WINNER:
          router.replace({ pathname: ROUTES.WINNER, params: { contestId } });
          break;
      }
    }
  }, [
    contestId,
    playerState,
    validState,
    loading,
    router,
    startTime,
    shouldHoldResultRedirect,
  ]);

  // If wrong state, show loading during redirect
  if (!loading && contestId && playerState !== validState && playerState !== PLAYER_STATE.UNKNOWN) {
    if (shouldHoldResultRedirect) {
      console.log('[ContestRouter] Holding screen on LoadingView for result intent');
      return <LoadingView />;
    }
    console.log('[ContestRouter] Wrong state, showing LoadingView');
    return <LoadingView />;
  }

  // Correct state - render screen
  return <>{children}</>;
};
