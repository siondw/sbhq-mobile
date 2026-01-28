import { usePathname, useRouter } from 'expo-router';
import { useEffect } from 'react';
import { buildContestRoute, buildLobbyRoute, ROUTES } from '../../configs/routes';
import { CONTEST_STATE, PLAYER_STATE, type ContestStateValue } from '../constants';
import { useNotificationRouting } from '../contexts';
import LoadingView from '../../ui/components/LoadingView';

interface ContestRouterProps {
  contestId: string | undefined;
  playerState: string;
  loading: boolean;
  children: React.ReactNode;
  validState: string;
  startTime?: string; // For LobbyScreen
  contestState?: ContestStateValue | null;
  validContestStates?: ContestStateValue[];
  isSpectating?: boolean;
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
  contestState,
  validContestStates,
  isSpectating = false,
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
    if (!isSpectating) {
      return;
    }
    if (!contestId || loading || !contestState) {
      return;
    }

    if (contestState === CONTEST_STATE.FINISHED) {
      router.replace(ROUTES.CONTESTS);
      return;
    }

    const isValidSpectatorState =
      validContestStates?.includes(contestState) ?? false;

    if (isValidSpectatorState) {
      return;
    }

    switch (contestState) {
      case CONTEST_STATE.ROUND_IN_PROGRESS:
        router.replace({
          pathname: `${ROUTES.GAME}/[contestId]`,
          params: { contestId, spectating: 'true' },
        });
        break;
      case CONTEST_STATE.ROUND_CLOSED:
        router.replace({
          pathname: ROUTES.SUBMITTED,
          params: { contestId, spectating: 'true' },
        });
        break;
      case CONTEST_STATE.LOBBY_OPEN:
      case CONTEST_STATE.UPCOMING:
      default:
        router.replace(ROUTES.CONTESTS);
        break;
    }
  }, [contestId, contestState, isSpectating, loading, router, validContestStates]);

  useEffect(() => {
    if (isSpectating) {
      return;
    }
    if (isPendingResultForPath && playerState === validState) {
      clearPendingResultIntent();
    }
  }, [clearPendingResultIntent, isPendingResultForPath, isSpectating, playerState, validState]);

  useEffect(() => {
    if (isSpectating) {
      return;
    }
    if (!contestId || loading || playerState === PLAYER_STATE.UNKNOWN) {
      return;
    }

    if (shouldHoldResultRedirect) {
      return;
    }

    // If playerState doesn't match this screen's valid state, redirect
    if (playerState !== validState) {
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
    isSpectating,
    loading,
    playerState,
    router,
    shouldHoldResultRedirect,
    startTime,
    validState,
  ]);

  // If wrong state, show loading during redirect
  if (isSpectating) {
    const isValidSpectatorState =
      contestState && (validContestStates?.includes(contestState) ?? false);
    if (!loading && contestId && contestState && !isValidSpectatorState) {
      return <LoadingView />;
    }
  } else if (
    !loading &&
    contestId &&
    playerState !== validState &&
    playerState !== PLAYER_STATE.UNKNOWN
  ) {
    return <LoadingView />;
  }

  // Correct state - render screen
  return <>{children}</>;
};
