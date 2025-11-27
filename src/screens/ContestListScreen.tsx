import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, View, useWindowDimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { getContests } from '../db/contests';
import { getOrCreateParticipant } from '../db/participants';
import type { ContestRow } from '../db/types';
import { useAuth } from '../logic/auth/useAuth';
import ContestCard from '../ui/contest/ContestCard';
import Header from '../ui/Header';
import Button from '../ui/primitives/Button';
import Text from '../ui/primitives/Text';
import { COLORS, HEADER_HEIGHT, SPACING, TYPOGRAPHY } from '../ui/theme';

const ContestListScreen = () => {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const [contests, setContests] = useState<ContestRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { derivedUser } = useAuth();

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getContests();
      setContests(data);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  const handleEnterContest = async (contest: ContestRow) => {
    if (!derivedUser?.id) {
      setError('Please log in to enter a contest.');
      return;
    }
    try {
      await getOrCreateParticipant(contest.id, derivedUser.id);
      if (contest.finished) {
        router.push('/');
        return;
      }
      if (contest.lobby_open) {
        router.push({ pathname: '/lobby', params: { contestId: contest.id, startTime: contest.start_time } });
        return;
      }
      if (contest.submission_open) {
        router.push(`/contest/${contest.id}`);
        return;
      }
      router.push({ pathname: '/pregame', params: { contestId: contest.id, startTime: contest.start_time } });
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const maxCardWidth = 360;
  const availableWidth = Math.max(0, width - SPACING.LG * 2);
  const numColumns = Math.max(1, Math.floor(availableWidth / maxCardWidth));
  const cardWidth = useMemo(() => {
    if (numColumns === 1) return undefined;
    const gutterTotal = SPACING.MD * (numColumns - 1);
    return (availableWidth - gutterTotal) / numColumns;
  }, [availableWidth, numColumns]);

  const isRefreshing = loading && contests.length > 0;
  const isInitialLoading = loading && contests.length === 0;

  return (
    <View style={styles.screen}>
      <Header />
      <FlatList
        data={contests}
        key={`columns-${numColumns}`}
        numColumns={numColumns}
        renderItem={({ item }) => (
          <View style={[styles.cardWrapper, numColumns === 1 ? styles.fullWidthCard : styles.multiCard, cardWidth ? { width: cardWidth } : null]}>
            <ContestCard contest={item} onPress={() => void handleEnterContest(item)} />
          </View>
        )}
        contentContainerStyle={[styles.listContent, { paddingTop: HEADER_HEIGHT + SPACING.XXL }]}
        columnWrapperStyle={numColumns > 1 ? styles.columnWrapper : undefined}
        ItemSeparatorComponent={() => <View style={styles.itemSpacer} />}
        ListHeaderComponent={
          <View style={styles.hero}>
            <Text weight="bold" style={styles.title}>
              Contests
            </Text>
            <Text style={styles.subtitle}>Pick a contest and jump into the action.</Text>
            {error ? (
              <Text weight="medium" style={styles.error}>
                {error}
              </Text>
            ) : null}
          </View>
        }
        ListEmptyComponent={
          !isInitialLoading ? (
            <View style={styles.emptyState}>
              <Text weight="medium" style={styles.emptyTitle}>
                No contests available
              </Text>
              <Text style={styles.emptySubtitle}>Check back soon for the next round.</Text>
              <View style={styles.retryWrapper}>
                <Button label="Refresh" onPress={() => void fetchData()} />
              </View>
            </View>
          ) : null
        }
        ListFooterComponent={
          isInitialLoading ? (
            <View style={styles.loading}>
              <ActivityIndicator color={COLORS.PRIMARY_DARK} />
            </View>
          ) : null
        }
        refreshing={isRefreshing}
        onRefresh={() => void fetchData()}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND,
  },
  listContent: {
    paddingHorizontal: SPACING.LG,
    paddingBottom: SPACING.XXL,
    alignItems: 'center',
  },
  hero: {
    width: '100%',
    alignItems: 'center',
    marginBottom: SPACING.LG,
    paddingHorizontal: SPACING.SM,
  },
  title: {
    fontSize: 44,
    color: '#675A4A',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: TYPOGRAPHY.BODY,
    color: COLORS.MUTED,
    textAlign: 'center',
    maxWidth: 420,
  },
  error: {
    color: '#B91C1C',
    textAlign: 'center',
    marginTop: SPACING.SM,
  },
  cardWrapper: {
    flexGrow: 1,
    maxWidth: 420,
  },
  fullWidthCard: {
    width: '100%',
  },
  multiCard: {
    marginHorizontal: SPACING.SM / 2,
  },
  columnWrapper: {
    justifyContent: 'center',
  },
  itemSpacer: {
    height: SPACING.MD,
  },
  emptyState: {
    width: '100%',
    alignItems: 'center',
    paddingVertical: SPACING.LG,
  },
  emptyTitle: {
    fontSize: TYPOGRAPHY.SUBTITLE,
    color: COLORS.PRIMARY_DARK,
    marginBottom: SPACING.XS,
  },
  emptySubtitle: {
    color: COLORS.MUTED,
    textAlign: 'center',
    marginBottom: SPACING.SM,
  },
  retryWrapper: {
    width: 200,
  },
  loading: {
    paddingVertical: SPACING.LG,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default ContestListScreen;
