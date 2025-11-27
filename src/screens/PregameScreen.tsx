import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAuth } from '../logic/auth/useAuth';
import { useContestState } from '../logic/contest/useContestState';
import { PLAYER_STATE } from '../logic/constants';
import Text from '../ui/primitives/Text';
import Countdown from '../ui/primitives/Countdown';
import Card from '../ui/primitives/Card';
import { COLORS, SPACING, TYPOGRAPHY, HEADER_HEIGHT } from '../ui/theme';
import Header from '../ui/Header';

const PregameScreen = () => {
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
    if (playerState === PLAYER_STATE.LOBBY) {
      router.replace({ pathname: '/lobby', params: { contestId: params.contestId } });
    } else if (playerState === PLAYER_STATE.ANSWERING) {
      router.replace(`/contest/${params.contestId}`);
    } else if (playerState === PLAYER_STATE.SUBMITTED_WAITING) {
      router.replace({ pathname: '/submitted', params: { contestId: params.contestId } });
    } else if (playerState === PLAYER_STATE.CORRECT_WAITING_NEXT) {
      router.replace('/correct');
    } else if (playerState === PLAYER_STATE.ELIMINATED) {
      router.replace('/eliminated');
    } else if (playerState === PLAYER_STATE.WINNER) {
      router.replace('/winner');
    }
  }, [playerState, router, params.contestId, loading]);

  return (
    <View style={styles.container}>
      <Header />
      <View style={styles.content}>
        <Card>
          <Text weight="bold" style={styles.title}>
            Starting Soon
          </Text>
          <Text style={styles.body}>Contest: {contest?.name ?? params.contestId ?? 'Unknown'}</Text>
          <View style={styles.countdown}>
            <Countdown targetTime={targetTime} />
          </View>
          <Text style={styles.body}>We’ll move you into the lobby when it opens.</Text>
        </Card>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: SPACING.MD,
    paddingTop: HEADER_HEIGHT + SPACING.MD,
    backgroundColor: COLORS.BACKGROUND,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: SPACING.MD,
  },
  title: {
    fontSize: TYPOGRAPHY.TITLE,
    marginBottom: SPACING.XS,
  },
  body: {
    fontSize: TYPOGRAPHY.BODY,
  },
  countdown: {
    marginVertical: SPACING.SM,
  },
});

export default PregameScreen;
