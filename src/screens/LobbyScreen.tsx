import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect } from 'react';
import { Image, ScrollView, StyleSheet, View } from 'react-native';

import { ROUTES } from '../configs/routes';
import { useAuth } from '../logic/hooks/useAuth';
import { PLAYER_STATE } from '../logic/constants';
import { useContestState } from '../logic/hooks/useContestState';
import { useHeaderHeight } from '../logic/hooks/useHeaderHeight';
import Countdown from '../ui/Countdown';
import Text from '../ui/Text';
import { COLORS, SPACING, TYPOGRAPHY } from '../ui/theme';
import Header from '../ui/AppHeader';
import pregameGif from '../../assets/gifs/catch_nobg.gif';

const LobbyScreen = () => {
  const params = useLocalSearchParams<{ contestId?: string; startTime?: string }>();
  const router = useRouter();
  const { derivedUser } = useAuth();
  const headerHeight = useHeaderHeight();
  const { playerState, contest, loading } = useContestState(params.contestId, derivedUser?.id);
  const targetTime = params.startTime
    ? new Date(params.startTime).getTime()
    : contest?.start_time
      ? new Date(contest.start_time).getTime()
      : Date.now();

  useEffect(() => {
    if (!params.contestId || loading) return;
    if (playerState === PLAYER_STATE.ANSWERING) {
      router.replace(`/contest/${params.contestId}`);
    } else if (playerState === PLAYER_STATE.SUBMITTED_WAITING) {
      router.replace({ pathname: ROUTES.SUBMITTED, params: { contestId: params.contestId } });
    } else if (playerState === PLAYER_STATE.CORRECT_WAITING_NEXT) {
      router.replace({ pathname: ROUTES.CORRECT, params: { contestId: params.contestId } });
    } else if (playerState === PLAYER_STATE.ELIMINATED) {
      router.replace({ pathname: ROUTES.ELIMINATED, params: { contestId: params.contestId } });
    } else if (playerState === PLAYER_STATE.WINNER) {
      router.replace({ pathname: ROUTES.WINNER, params: { contestId: params.contestId } });
    } else if (playerState === PLAYER_STATE.LOBBY) {
      // stay here
    }
  }, [playerState, router, params.contestId, loading]);

  return (
    <View style={styles.screen}>
      <Header user={derivedUser} />
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingTop: headerHeight + SPACING.LG }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
          <Text weight="bold" style={styles.contestName}>
            {contest?.name || 'Contest Lobby'}
          </Text>

          <View style={styles.countdownSection}>
            <Text weight="medium" style={styles.startingLabel}>
              Starting in:
            </Text>
            <Countdown targetTime={targetTime} />
          </View>

          <Image source={pregameGif} style={styles.pregameGif} />
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
    paddingBottom: SPACING.XXL,
    paddingHorizontal: SPACING.LG,
  },
  content: {
    alignItems: 'center',
    gap: SPACING.XL,
  },
  contestName: {
    fontSize: 32,
    textAlign: 'center',
    color: COLORS.PRIMARY_DARK,
    letterSpacing: 0.5,
  },
  countdownSection: {
    alignItems: 'center',
    gap: SPACING.SM,
  },
  startingLabel: {
    fontSize: TYPOGRAPHY.BODY,
    color: COLORS.MUTED,
    textAlign: 'center',
  },
  pregameGif: {
    width: 250,
    height: 250,
    alignSelf: 'center',
  },
});

export default LobbyScreen;
