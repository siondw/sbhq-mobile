import React, { useEffect, useState, useCallback } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { getContests } from '../db/contests';
import { getOrCreateParticipant } from '../db/participants';
import type { ContestRow } from '../db/types';
import { useAuth } from '../logic/auth/useAuth';
import Card from '../ui/primitives/Card';
import Text from '../ui/primitives/Text';
import Button from '../ui/primitives/Button';
import { COLORS, SPACING, TYPOGRAPHY, HEADER_HEIGHT } from '../ui/theme';
import Header from '../ui/Header';

const ContestListScreen = () => {
  const router = useRouter();
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

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
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
      <View style={styles.content}>
        <Text weight="bold" style={styles.title}>
          Contests
        </Text>
        <FlatList
          data={contests}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <Card>
              <Text weight="bold" style={styles.cardTitle}>
                {item.name}
              </Text>
              <Text style={styles.meta}>{`Starts: ${new Date(item.start_time).toLocaleString()}`}</Text>
              <Text style={styles.status}>
                {item.lobby_open ? 'Lobby Open' : item.submission_open ? 'In Progress' : 'Starting Soon'}
              </Text>
              <View style={styles.cardFooter}>
                <Button label="Enter" onPress={() => void handleEnterContest(item)} />
              </View>
            </Card>
          )}
          ItemSeparatorComponent={() => <View style={styles.spacer} />}
          ListEmptyComponent={<Text>No contests available.</Text>}
          contentContainerStyle={styles.listContent}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND,
    paddingTop: HEADER_HEIGHT + SPACING.MD,
  },
  content: {
    paddingHorizontal: SPACING.MD,
    flex: 1,
    gap: SPACING.SM,
  },
  listContent: {
    paddingBottom: SPACING.LG,
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
  title: {
    fontSize: TYPOGRAPHY.TITLE,
    marginBottom: SPACING.SM,
  },
  cardTitle: {
    fontSize: TYPOGRAPHY.SUBTITLE,
    marginBottom: 6,
  },
  meta: {
    fontSize: TYPOGRAPHY.BODY,
    color: COLORS.MUTED,
    marginBottom: 4,
  },
  status: {
    fontSize: TYPOGRAPHY.SMALL,
    color: COLORS.PRIMARY_DARK,
    marginBottom: SPACING.SM,
  },
  cardFooter: {
    marginTop: SPACING.SM,
  },
});

export default ContestListScreen;
