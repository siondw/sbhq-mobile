import { useRouter } from 'expo-router';
import React, { useMemo } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, View, useWindowDimensions } from 'react-native';

import { ROUTES } from '../configs/routes';
import type { ContestRow } from '../db/types';
import { useAuth } from '../logic/hooks/useAuth';
import { useContestRegistration } from '../logic/hooks/useContestRegistration';
import { useContests } from '../logic/hooks/useContests';
import { useHeaderHeight } from '../logic/hooks/useHeaderHeight';
import Header from '../ui/AppHeader';
import Button from '../ui/Button';
import Card from '../ui/Card';
import Text from '../ui/Text';
import { COLORS, RADIUS, SPACING, TYPOGRAPHY } from '../ui/theme';

const ContestListScreen = () => {
  const router = useRouter();
  const { derivedUser } = useAuth();
  const headerHeight = useHeaderHeight();
  const { width } = useWindowDimensions();

  const { contests, loading: contestsLoading, error: contestsError, refresh } = useContests();
  const {
    participants,
    loading: participantsLoading,
    error: participantsError,
    registerForContest,
  } = useContestRegistration(contests, derivedUser?.id);

  const loading = contestsLoading || participantsLoading;
  const error = contestsError || participantsError;

  const numColumns = width >= 1100 ? 3 : width >= 760 ? 2 : 1;

  const filteredContests = useMemo(
    () => contests.filter((contest) => !contest.finished),
    [contests],
  );

  const formatStart = (startTime: string) => {
    const date = new Date(startTime);
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const hours = date.getHours();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;

    const shortTz = new Date().toLocaleTimeString('en-US', { timeZoneName: 'short' }).split(' ')[2];

    return `${month}/${day} @ ${displayHours}${ampm} ${shortTz}`;
  };

  const handleEnterContest = async (contest: ContestRow) => {
    if (!derivedUser?.id) {
      return;
    }

    await registerForContest(contest.id);

    if (contest.finished) {
      router.push(ROUTES.INDEX);
      return;
    }
    if (contest.lobby_open) {
      router.push({
        pathname: ROUTES.LOBBY,
        params: { contestId: contest.id, startTime: contest.start_time },
      });
      return;
    }
    if (contest.submission_open) {
      router.push({
        pathname: `${ROUTES.CONTEST}/[contestId]`,
        params: { contestId: contest.id },
      });
      return;
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={COLORS.PRIMARY} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text weight="bold">Error loading contests</Text>
        <Text>{error}</Text>
        <View style={styles.spacer} />
        <Button label="Retry" onPress={() => void refresh()} />
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
        renderItem={({ item }) => {
          const participant = participants.get(item.id);
          const isRegistered = !!participant;
          const isLive = item.lobby_open || item.submission_open;
          const isLocked = item.submission_open && !isRegistered;

          const startLabel = formatStart(item.start_time);
          const priceLabel = typeof item.price === 'number' ? `$${item.price.toFixed(2)}` : 'Free';

          let buttonLabel = 'Register';
          let buttonVariant: 'primary' | 'success' = 'primary';

          if (isLocked) {
            buttonLabel = '🔒 Locked';
            buttonVariant = 'primary';
          } else if (isRegistered && (item.lobby_open || item.submission_open)) {
            buttonLabel = 'Join';
            buttonVariant = 'success';
          } else if (isRegistered) {
            buttonLabel = 'Registered';
            buttonVariant = 'success';
          } else if (item.lobby_open) {
            buttonLabel = 'Register';
            buttonVariant = 'primary';
          }

          return (
            <Card
              style={[
                styles.card,
                numColumns > 1 && styles.cardGridItem,
                isLocked && styles.cardLocked,
              ]}
            >
              <View style={styles.cardHeader}>
                <Text weight="bold" style={styles.cardTitle}>
                  {item.name}
                </Text>
                {isLive && (
                  <View style={styles.liveIndicator}>
                    <View style={styles.liveDot} />
                    <Text weight="medium" style={styles.liveText}>
                      LIVE
                    </Text>
                  </View>
                )}
              </View>

              <Text style={styles.meta}>Start: {startLabel}</Text>
              <Text style={styles.meta}>Entry: {priceLabel}</Text>
              {item.current_round ? (
                <Text style={styles.meta}>Round: {item.current_round}</Text>
              ) : null}

              <View style={styles.cardFooter}>
                <Button
                  label={buttonLabel}
                  variant={buttonVariant}
                  onPress={() => void handleEnterContest(item)}
                  disabled={
                    !!isLocked || (isRegistered && !item.lobby_open && !item.submission_open)
                  }
                />
              </View>
            </Card>
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
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND,
  },
  listContent: {
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
  card: {
    gap: SPACING.XS,
  },
  cardTitle: {
    fontSize: TYPOGRAPHY.SUBTITLE,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: SPACING.SM,
  },
  meta: {
    fontSize: TYPOGRAPHY.BODY,
    color: COLORS.MUTED,
  },
  cardFooter: {
    marginTop: SPACING.SM,
  },
  cardGridItem: {
    flex: 1,
    marginHorizontal: SPACING.XS,
  },
  cardLocked: {
    opacity: 0.6,
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 4,
    paddingHorizontal: SPACING.SM,
    borderRadius: RADIUS.SM,
    backgroundColor: 'rgba(255, 68, 68, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255, 68, 68, 0.3)',
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FF4444',
  },
  liveText: {
    fontSize: TYPOGRAPHY.SMALL,
    color: '#FF4444',
    letterSpacing: 0.5,
    fontWeight: '600',
  },
  emptyState: {
    backgroundColor: COLORS.SURFACE,
    borderRadius: RADIUS.MD,
    padding: SPACING.LG,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.BORDER,
  },
  emptyTitle: {
    fontSize: TYPOGRAPHY.SUBTITLE,
    marginBottom: SPACING.XS,
  },
  emptySubtitle: {
    fontSize: TYPOGRAPHY.BODY,
    color: COLORS.MUTED,
    textAlign: 'center',
  },
});

export default ContestListScreen;
