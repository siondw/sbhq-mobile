import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useMemo } from 'react';
import { Image, ScrollView, StyleSheet, View } from 'react-native';

import pregameGif from '../../assets/gifs/catch_nobg.gif';
import { ROUTES } from '../configs/routes';
import { PLAYER_STATE } from '../logic/constants';
import { useAuth } from '../logic/hooks/useAuth';
import { useContestState } from '../logic/hooks/useContestState';
import { useHeaderHeight } from '../logic/hooks/useHeaderHeight';
import Header from '../ui/components/AppHeader';
import Countdown from '../ui/components/Countdown';
import Text from '../ui/components/Text';
import { SPACING, TYPOGRAPHY, useTheme } from '../ui/theme';

const LobbyScreen = () => {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
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

const createStyles = (colors: { background: string; ink: string; muted: string }) =>
  StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: colors.background,
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
      color: colors.ink,
      letterSpacing: 0.5,
    },
    countdownSection: {
      alignItems: 'center',
      gap: SPACING.SM,
    },
    startingLabel: {
      fontSize: TYPOGRAPHY.BODY,
      color: colors.muted,
      textAlign: 'center',
    },
    pregameGif: {
      width: 250,
      height: 250,
      alignSelf: 'center',
    },
  });

export default LobbyScreen;
