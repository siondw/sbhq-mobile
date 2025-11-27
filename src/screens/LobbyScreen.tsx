import React, { useEffect } from 'react';
import { StyleSheet, View, ScrollView } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAuth } from '../logic/auth/useAuth';
import { useContestState } from '../logic/contest/useContestState';
import { PLAYER_STATE } from '../logic/constants';
import Text from '../ui/primitives/Text';
import Countdown from '../ui/primitives/Countdown';
import Card from '../ui/primitives/Card';
import { COLORS, SPACING, TYPOGRAPHY, HEADER_HEIGHT, RADIUS } from '../ui/theme';
import Header from '../ui/Header';

const LobbyScreen = () => {
  const params = useLocalSearchParams<{ contestId?: string; startTime?: string }>();
  const router = useRouter();
  const { derivedUser } = useAuth();
  const { playerState, contest, loading } = useContestState(params.contestId, derivedUser?.id);
  const targetTime = params.startTime
    ? new Date(params.startTime).getTime()
    : contest?.start_time
      ? new Date(contest.start_time).getTime()
      : Date.now();

  useEffect(() => {
    if (!params.contestId || loading) return;
    if (playerState === PLAYER_STATE.ANSWERING || playerState === PLAYER_STATE.SUBMITTED_WAITING) {
      router.replace(`/contest/${params.contestId}`);
    } else if (playerState === PLAYER_STATE.CORRECT_WAITING_NEXT) {
      router.replace('/correct');
    } else if (playerState === PLAYER_STATE.ELIMINATED) {
      router.replace('/eliminated');
    } else if (playerState === PLAYER_STATE.WINNER) {
      router.replace('/winner');
    } else if (playerState === PLAYER_STATE.LOBBY) {
      // stay here
    }
  }, [playerState, router, params.contestId, loading]);

  return (
    <View style={styles.screen}>
      <Header />
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.hero}>
          <Text weight="bold" style={styles.title}>
            Lobby
          </Text>
          <Text style={styles.subtitle}>
            {contest?.name ?? 'Contest'}
          </Text>
        </View>

        <View style={styles.mainContent}>
          <Card style={styles.countdownCard}>
            <Text weight="medium" style={styles.label}>
              Contest Starts In
            </Text>
            <View style={styles.countdownWrapper}>
              <Countdown targetTime={targetTime} />
            </View>
          </Card>

          <Card style={styles.infoCard}>
            <Text weight="medium" style={styles.waitingText}>
              Waiting for the Game Master to start…
            </Text>
            <View style={styles.statusIndicator}>
              <View style={styles.pulsingDot} />
              <Text style={styles.statusText}>Lobby Open</Text>
            </View>
          </Card>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND,
  },
  scrollContent: {
    flexGrow: 1,
    paddingTop: HEADER_HEIGHT + SPACING.XXL,
    paddingBottom: SPACING.XXL,
    paddingHorizontal: SPACING.LG,
    alignItems: 'center',
  },
  hero: {
    alignItems: 'center',
    marginBottom: SPACING.XL,
  },
  title: {
    fontSize: 32,
    textAlign: 'center',
    color: COLORS.PRIMARY_DARK,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: TYPOGRAPHY.SUBTITLE,
    color: COLORS.MUTED,
    textAlign: 'center',
  },
  mainContent: {
    width: '100%',
    maxWidth: 400,
    gap: SPACING.MD,
  },
  countdownCard: {
    alignItems: 'center',
    paddingVertical: SPACING.LG,
    backgroundColor: COLORS.SURFACE,
  },
  label: {
    fontSize: TYPOGRAPHY.BODY,
    color: COLORS.PRIMARY_DARK,
    marginBottom: SPACING.SM,
  },
  countdownWrapper: {
    marginVertical: SPACING.XS,
  },
  infoCard: {
    alignItems: 'center',
    paddingVertical: SPACING.LG,
  },
  waitingText: {
    fontSize: TYPOGRAPHY.BODY,
    color: COLORS.PRIMARY_DARK,
    textAlign: 'center',
    marginBottom: SPACING.MD,
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.XS,
    paddingHorizontal: SPACING.MD,
    paddingVertical: SPACING.XS,
    backgroundColor: COLORS.ACCENT,
    borderRadius: RADIUS.MD,
  },
  pulsingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.PRIMARY,
  },
  statusText: {
    fontSize: TYPOGRAPHY.SMALL,
    color: COLORS.PRIMARY_DARK,
    fontWeight: '500',
  },
});

export default LobbyScreen;
