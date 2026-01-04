import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, View, useWindowDimensions } from 'react-native';

import { Feather } from '@expo/vector-icons';
import { ROUTES, buildLobbyRoute } from '../configs/routes';
import type { ContestRow } from '../db/types';
import { CONTEST_STATE } from '../logic/constants';
import { useAuth } from '../logic/hooks/useAuth';
import { useContestRegistration } from '../logic/hooks/useContestRegistration';
import { useContests } from '../logic/hooks/useContests';
import { useHeaderHeight } from '../logic/hooks/useHeaderHeight';
import { useRefresh } from '../logic/hooks/utils';
import Header from '../ui/components/AppHeader';
import Button from '../ui/components/Button';
import ContestListTicket from '../ui/components/ContestListTicket';
import LoadingView from '../ui/components/LoadingView';
import OnboardingModal from '../ui/components/OnboardingModal';
import PullHint from '../ui/components/PullHint';
import Text from '../ui/components/Text';
import { getHasSeenPullHint, setHasSeenPullHint } from '../utils/storage';
import { RADIUS, SPACING, TYPOGRAPHY, useTheme } from '../ui/theme';

const ContestListScreen = () => {
  const router = useRouter();
  const { colors } = useTheme();
  const {
    derivedUser,
    needsOnboarding,
    completeOnboarding,
    error: authError,
    loading: authLoading,
  } = useAuth();
  const headerHeight = useHeaderHeight();
  const { width } = useWindowDimensions();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const {
    contests,
    loading: contestsLoading,
    error: contestsError,
    refresh: refreshContests,
  } = useContests();
  const {
    participants,
    loading: participantsLoading,
    error: participantsError,
    registerForContest,
    refresh: refreshParticipants,
  } = useContestRegistration(contests, derivedUser?.id);
  const { refreshing, onRefresh } = useRefresh([refreshContests, refreshParticipants]);

  const [showPullHint, setShowPullHint] = useState(false);

  useEffect(() => {
    const checkPullHint = async () => {
      const hasSeen = await getHasSeenPullHint();
      if (!hasSeen) {
        setShowPullHint(true);
      }
    };
    void checkPullHint();
  }, []);

  const dismissPullHint = useCallback(() => {
    setShowPullHint(false);
    void setHasSeenPullHint();
  }, []);

  const handleRefresh = useCallback(() => {
    if (showPullHint) {
      dismissPullHint();
    }
    void onRefresh();
  }, [showPullHint, dismissPullHint, onRefresh]);

  const loading = authLoading || contestsLoading || participantsLoading;
  const error = contestsError || participantsError;

  const numColumns = width >= 1100 ? 3 : width >= 760 ? 2 : 1;

  const filteredContests = useMemo(
    () => contests.filter((contest) => contest.state !== CONTEST_STATE.FINISHED),
    [contests],
  );

  const formatStart = (startTime: string) => {
    const date = new Date(startTime);
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/New_York',
      month: 'numeric',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    }).formatToParts(date);

    const month = parts.find((part) => part.type === 'month')?.value ?? '';
    const day = parts.find((part) => part.type === 'day')?.value ?? '';
    const hour = parts.find((part) => part.type === 'hour')?.value ?? '';
    const minute = parts.find((part) => part.type === 'minute')?.value ?? '00';
    const period = parts.find((part) => part.type === 'dayPeriod')?.value ?? '';
    const minuteSuffix = minute === '00' ? '' : `:${minute}`;

    return `${month}/${day} @ ${hour}${minuteSuffix}${period} EST`;
  };

  const handleEnterContest = async (contest: ContestRow) => {
    if (!derivedUser?.id) {
      return;
    }

    await registerForContest(contest.id);

    if (contest.state === CONTEST_STATE.FINISHED) {
      router.push(ROUTES.INDEX);
      return;
    }
    if (contest.state === CONTEST_STATE.LOBBY_OPEN) {
      const lobbyRoute = buildLobbyRoute(contest.id);
      router.push({
        ...lobbyRoute,
        params: { ...lobbyRoute.params, startTime: contest.start_time },
      });
      return;
    }
    if (contest.state === CONTEST_STATE.ROUND_IN_PROGRESS) {
      router.push({
        pathname: `${ROUTES.GAME}/[contestId]`,
        params: { contestId: contest.id },
      });
      return;
    }
  };

  if (loading) {
    return <LoadingView />;
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text weight="bold">Error loading contests</Text>
        <Text>{error}</Text>
        <View style={styles.spacer} />
        <Button label="Retry" onPress={handleRefresh} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header user={derivedUser} />
      <FlatList
        data={filteredContests}
        keyExtractor={(item) => item.id}
        numColumns={numColumns}
        columnWrapperStyle={numColumns > 1 ? styles.columnWrapper : undefined}
        contentContainerStyle={[styles.listContent, { paddingTop: headerHeight + SPACING.SM }]}
        onRefresh={handleRefresh}
        refreshing={refreshing}
        ListHeaderComponent={
          <>
            {refreshing && (
              <View style={styles.refreshIndicator}>
                <ActivityIndicator size="small" color={colors.primary} />
              </View>
            )}
            {showPullHint && <PullHint onDismiss={dismissPullHint} />}
          </>
        }
        renderItem={({ item }) => {
          const participant = participants.get(item.id);
          const isRegistered = !!participant;
          const isLive =
            item.state !== CONTEST_STATE.UPCOMING && item.state !== CONTEST_STATE.FINISHED;
          const isInProgress =
            item.state === CONTEST_STATE.ROUND_IN_PROGRESS ||
            item.state === CONTEST_STATE.ROUND_CLOSED;
          const isEliminated = participant?.elimination_round !== null;
          const isLocked = item.state === CONTEST_STATE.ROUND_IN_PROGRESS && !isRegistered;

          const startLabel = formatStart(item.start_time);
          const priceLabel = item.price ? `$${item.price.toFixed(2)}` : 'Free';

          let buttonLabel = 'Register';
          let buttonVariant: 'primary' | 'success' = 'primary';
          let buttonIcon: React.ReactNode = null;

          if (isEliminated && isInProgress) {
            buttonLabel = 'Eliminated';
            buttonVariant = 'primary';
          } else if (isLocked) {
            buttonLabel = 'Locked';
            buttonVariant = 'primary';
          } else if (
            isRegistered &&
            (item.state === CONTEST_STATE.LOBBY_OPEN ||
              item.state === CONTEST_STATE.ROUND_IN_PROGRESS)
          ) {
            buttonLabel = 'Join Contest';
            buttonVariant = 'success';
            buttonIcon = <Feather name="arrow-right" size={20} color={colors.surface} />;
          } else if (isRegistered) {
            buttonLabel = 'Registered';
            buttonVariant = 'success';
            buttonIcon = null;
          } else if (item.state === CONTEST_STATE.LOBBY_OPEN) {
            buttonLabel = 'Register';
            buttonVariant = 'primary';
          }

          return (
            <ContestListTicket
              title={item.name}
              startLabel={startLabel}
              priceLabel={priceLabel}
              roundLabel={item.current_round ? String(item.current_round) : null}
              live={isLive}
              dimmed={isLocked || (isEliminated && isInProgress)}
              buttonLabel={buttonLabel}
              buttonVariant={buttonVariant}
              buttonIconRight={buttonIcon}
              buttonDisabled={
                !!isLocked ||
                (isEliminated && isInProgress) ||
                (isRegistered &&
                  item.state !== CONTEST_STATE.LOBBY_OPEN &&
                  item.state !== CONTEST_STATE.ROUND_IN_PROGRESS)
              }
              onPress={() => void handleEnterContest(item)}
            />
          );
        }}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text weight="bold" style={styles.emptyTitle}>
              No contests yet
            </Text>
            <Text style={styles.emptySubtitle}>
              Check back soon or pull to refresh for the latest matchups.
            </Text>
          </View>
        }
      />
      {needsOnboarding && (
        <OnboardingModal visible={true} onComplete={completeOnboarding} error={authError} />
      )}
    </View>
  );
};

const createStyles = (colors: ReturnType<typeof useTheme>['colors']) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    refreshIndicator: {
      alignItems: 'center',
      paddingVertical: SPACING.MD,
    },
    listContent: {
      flexGrow: 1,
      paddingHorizontal: SPACING.MD,
      paddingBottom: SPACING.XXL,
      gap: SPACING.MD,
      maxWidth: 1200,
      width: '100%',
      alignSelf: 'center',
    },
    center: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      padding: SPACING.LG,
    },
    spacer: {
      height: SPACING.SM,
    },

    columnWrapper: {
      justifyContent: 'space-between',
    },
    emptyState: {
      backgroundColor: colors.surface,
      borderRadius: RADIUS.MD,
      padding: SPACING.LG,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.border,
    },
    emptyTitle: {
      fontSize: TYPOGRAPHY.SUBTITLE,
      marginBottom: SPACING.XS,
    },
    emptySubtitle: {
      fontSize: TYPOGRAPHY.BODY,
      color: colors.muted,
      textAlign: 'center',
    },
  });

export default ContestListScreen;
