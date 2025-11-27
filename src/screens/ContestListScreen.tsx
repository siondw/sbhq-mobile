import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  View,
  useWindowDimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { getContests } from '../db/contests';
import { getOrCreateParticipant } from '../db/participants';
import type { ContestRow } from '../db/types';
import { useAuth } from '../logic/auth/useAuth';
import Card from '../ui/primitives/Card';
import Text from '../ui/primitives/Text';
import Button from '../ui/primitives/Button';
import { COLORS, HEADER_HEIGHT, RADIUS, SPACING, TYPOGRAPHY } from '../ui/theme';
import Header from '../ui/Header';

type TabKey = 'all' | 'live' | 'upcoming' | 'finished';

const TABS: Array<{ key: TabKey; label: string }> = [
  { key: 'all', label: 'All' },
  { key: 'live', label: 'Live' },
  { key: 'upcoming', label: 'Upcoming' },
  { key: 'finished', label: 'Finished' },
];

const ContestListScreen = () => {
  const router = useRouter();
  const [contests, setContests] = useState<ContestRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { derivedUser } = useAuth();
  const [activeTab, setActiveTab] = useState<TabKey>('all');
  const { width } = useWindowDimensions();

  const numColumns = width >= 1100 ? 3 : width >= 760 ? 2 : 1;

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

  const getStatus = (contest: ContestRow): TabKey => {
    if (contest.finished) return 'finished';
    if (contest.lobby_open || contest.submission_open) return 'live';
    return 'upcoming';
  };

  const filteredContests = useMemo(
    () => contests.filter((contest) => activeTab === 'all' || getStatus(contest) === activeTab),
    [activeTab, contests],
  );

  const stats = useMemo(() => {
    const upcoming = contests.filter((contest) => getStatus(contest) === 'upcoming').length;
    const live = contests.filter((contest) => getStatus(contest) === 'live').length;
    const finished = contests.filter((contest) => getStatus(contest) === 'finished').length;
    return { total: contests.length, upcoming, live, finished };
  }, [contests]);

  const formatStart = (startTime: string) => {
    const date = new Date(startTime);
    return {
      dateLabel: date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
      timeLabel: date.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' }),
      fullLabel: date.toLocaleString(),
    };
  };

  const getStatusStyle = (contest: ContestRow) => {
    const status = getStatus(contest);
    if (status === 'live') return styles.statusLive;
    if (status === 'finished') return styles.statusFinished;
    return styles.statusUpcoming;
  };

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
        <Button label="Retry" onPress={() => void fetchData()} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header />
      <FlatList
        data={filteredContests}
        keyExtractor={(item) => item.id}
        numColumns={numColumns}
        columnWrapperStyle={numColumns > 1 ? styles.columnWrapper : undefined}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <View style={styles.hero}>
            <Text weight="medium" style={styles.overline}>
              Contest HQ
            </Text>
            <Text weight="bold" style={styles.title}>
              Pick your next showdown
            </Text>
            <Text style={styles.subtitle}>
              Live trivia contests, upcoming rounds, and finished games - all in one spot.
            </Text>

            <View style={styles.tabsRow}>
              {TABS.map((tab) => {
                const isActive = activeTab === tab.key;
                return (
                  <Pressable
                    key={tab.key}
                    style={[styles.tab, isActive ? styles.tabActive : styles.tabInactive]}
                    onPress={() => setActiveTab(tab.key)}
                  >
                    <Text weight="medium" style={[styles.tabLabel, isActive && styles.tabLabelActive]}>
                      {tab.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <View style={styles.statsRow}>
              <View style={styles.statCard}>
                <Text style={styles.statLabel}>Total</Text>
                <Text weight="bold" style={styles.statValue}>
                  {stats.total}
                </Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statLabel}>Live</Text>
                <Text weight="bold" style={styles.statValue}>
                  {stats.live}
                </Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statLabel}>Upcoming</Text>
                <Text weight="bold" style={styles.statValue}>
                  {stats.upcoming}
                </Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statLabel}>Finished</Text>
                <Text weight="bold" style={styles.statValue}>
                  {stats.finished}
                </Text>
              </View>
            </View>
          </View>
        }
        renderItem={({ item }) => {
          const statusStyle = getStatusStyle(item);
          const statusLabel =
            getStatus(item) === 'live'
              ? item.lobby_open
                ? 'Lobby Open'
                : 'In Progress'
              : getStatus(item) === 'finished'
                ? 'Finished'
                : 'Upcoming';
          const { dateLabel, timeLabel, fullLabel } = formatStart(item.start_time);
          const priceLabel =
            typeof item.price === 'number' ? `$${item.price.toFixed(2)}` : 'Free entry';

          return (
            <Card style={[styles.card, numColumns > 1 && styles.cardGridItem]}>
              <View style={styles.cardHeader}>
                <View style={styles.dateBadge}>
                  <Text weight="bold" style={styles.dateText}>
                    {dateLabel}
                  </Text>
                  <Text style={styles.timeText}>{timeLabel}</Text>
                </View>
                <View style={[styles.statusPill, statusStyle]}>
                  <Text weight="medium" style={styles.statusText}>
                    {statusLabel}
                  </Text>
                </View>
              </View>

              <Text weight="bold" style={styles.cardTitle}>
                {item.name}
              </Text>
              <Text style={styles.meta}>Starts {fullLabel}</Text>
              <Text style={styles.meta}>Entry: {priceLabel}</Text>
              {item.current_round ? (
                <Text style={styles.meta}>Current round: {item.current_round}</Text>
              ) : null}

              <View style={styles.cardFooter}>
                <Button label="Enter" onPress={() => void handleEnterContest(item)} />
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
    paddingTop: HEADER_HEIGHT + SPACING.SM,
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
  hero: {
    backgroundColor: COLORS.SURFACE,
    borderRadius: RADIUS.LG,
    padding: SPACING.LG,
    gap: SPACING.SM,
    shadowColor: COLORS.PRIMARY_DARK,
    shadowOpacity: 0.08,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  overline: {
    fontSize: TYPOGRAPHY.SMALL,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    color: COLORS.PRIMARY_DARK,
  },
  title: {
    fontSize: TYPOGRAPHY.TITLE,
  },
  subtitle: {
    fontSize: TYPOGRAPHY.BODY,
    color: COLORS.MUTED,
  },
  tabsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.SM,
    marginTop: SPACING.SM,
  },
  tab: {
    paddingVertical: 10,
    paddingHorizontal: SPACING.MD,
    borderRadius: RADIUS.MD,
    borderWidth: 1,
  },
  tabInactive: {
    backgroundColor: COLORS.SURFACE,
    borderColor: COLORS.BORDER,
  },
  tabActive: {
    backgroundColor: '#e6f2ff',
    borderColor: COLORS.PRIMARY,
  },
  tabLabel: {
    fontSize: TYPOGRAPHY.BODY,
    color: COLORS.TEXT,
  },
  tabLabelActive: {
    color: COLORS.PRIMARY_DARK,
  },
  statsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.SM,
    marginTop: SPACING.SM,
  },
  statCard: {
    backgroundColor: COLORS.SURFACE,
    borderRadius: RADIUS.MD,
    padding: SPACING.MD,
    borderWidth: 1,
    borderColor: COLORS.BORDER,
    minWidth: 130,
  },
  statLabel: {
    fontSize: TYPOGRAPHY.SMALL,
    color: COLORS.MUTED,
  },
  statValue: {
    fontSize: TYPOGRAPHY.SUBTITLE,
    color: COLORS.PRIMARY_DARK,
  },
  columnWrapper: {
    justifyContent: 'space-between',
  },
  card: {
    gap: SPACING.XS,
  },
  cardTitle: {
    fontSize: TYPOGRAPHY.SUBTITLE,
    marginTop: SPACING.XS,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: SPACING.SM,
  },
  dateBadge: {
    paddingVertical: 6,
    paddingHorizontal: SPACING.SM,
    backgroundColor: '#e6f2ff',
    borderRadius: RADIUS.SM,
  },
  dateText: {
    fontSize: TYPOGRAPHY.BODY,
    color: COLORS.PRIMARY_DARK,
  },
  timeText: {
    fontSize: TYPOGRAPHY.SMALL,
    color: COLORS.MUTED,
  },
  statusPill: {
    paddingVertical: 6,
    paddingHorizontal: SPACING.SM,
    borderRadius: RADIUS.SM,
  },
  statusLive: {
    backgroundColor: '#e6f2ff',
  },
  statusUpcoming: {
    backgroundColor: COLORS.BORDER,
  },
  statusFinished: {
    backgroundColor: '#f0f0f0',
  },
  statusText: {
    fontSize: TYPOGRAPHY.SMALL,
    color: COLORS.PRIMARY_DARK,
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
