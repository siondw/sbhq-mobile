import { useRouter } from 'expo-router';
import React, { useEffect, useMemo, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';

import { buildContestRoute, ROUTES } from '../configs/routes';
import { PLAYER_STATE } from '../logic/constants';
import { useContestData } from '../logic/contexts';
import { useAuth } from '../logic/hooks/useAuth';
import { useHeaderHeight } from '../logic/hooks/useHeaderHeight';
import { useParticipantCount } from '../logic/hooks/useParticipantCount';
import Header from '../ui/components/AppHeader';
import Button from '../ui/components/Button';
import ContestStatsCard from '../ui/components/ContestStatsCard';
import LoadingView from '../ui/components/LoadingView';
import Text from '../ui/components/Text';
import { SPACING, TYPOGRAPHY, useTheme } from '../ui/theme';

const WinnerScreen = () => {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const router = useRouter();
  const { derivedUser } = useAuth();
  const headerHeight = useHeaderHeight();
  const { contestId, loading, error, playerState, refresh, contest } = useContestData();
  const { count: remainingPlayers } = useParticipantCount(contestId);
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1.05,
          duration: 1200,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 1,
          duration: 1200,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
    );

    animation.start();
    return () => animation.stop();
  }, [pulse]);

  useEffect(() => {
    if (!contestId || loading) return;
    if (playerState === PLAYER_STATE.ANSWERING) {
      router.replace(buildContestRoute(contestId));
    } else if (playerState === PLAYER_STATE.SUBMITTED_WAITING) {
      router.replace({ pathname: ROUTES.SUBMITTED, params: { contestId } });
    } else if (playerState === PLAYER_STATE.CORRECT_WAITING_NEXT) {
      router.replace({ pathname: ROUTES.CORRECT, params: { contestId } });
    } else if (playerState === PLAYER_STATE.ELIMINATED) {
      router.replace({ pathname: ROUTES.ELIMINATED, params: { contestId } });
    } else if (playerState === PLAYER_STATE.LOBBY) {
      router.replace({ pathname: ROUTES.LOBBY, params: { contestId } });
    }
  }, [playerState, router, contestId, loading]);

  if (loading) {
    return <LoadingView />;
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text weight="bold">Error</Text>
        <Text>{error}</Text>
        <View style={styles.spacer} />
        <Button label="Retry" onPress={() => void refresh()} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header user={derivedUser} />
      <View style={[styles.content, { paddingTop: headerHeight + SPACING.MD }]}>
        <Animated.View style={[styles.badge, { transform: [{ scale: pulse }] }]}>
          <Text weight="bold" style={styles.badgeText}>
            WINNER
          </Text>
        </Animated.View>
        <Text weight="bold" style={styles.title}>
          You won!
        </Text>
        <Text style={styles.body}>Congratulations on being the last player standing.</Text>

        <ContestStatsCard
          numberOfRemainingPlayers={remainingPlayers}
          roundNumber={contest?.current_round ?? 1}
        />

        <View style={styles.footer}>
          <Button label="Back to Contests" onPress={() => router.replace(ROUTES.INDEX)} />
        </View>
      </View>
    </View>
  );
};

const createStyles = (colors: { background: string; ink: string; surface: string }) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    content: {
      flex: 1,
      paddingHorizontal: SPACING.MD,
      justifyContent: 'center',
      alignItems: 'center',
      gap: SPACING.SM,
    },
    center: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      padding: SPACING.LG,
    },
    badge: {
      paddingHorizontal: SPACING.LG,
      paddingVertical: SPACING.SM,
      borderRadius: 999,
      backgroundColor: colors.ink,
      shadowColor: colors.ink,
      shadowOpacity: 0.25,
      shadowRadius: 16,
      shadowOffset: { width: 0, height: 6 },
    },
    badgeText: {
      color: colors.surface,
      letterSpacing: 1,
    },
    title: {
      fontSize: 28,
      color: colors.ink,
    },
    body: {
      fontSize: TYPOGRAPHY.BODY,
      textAlign: 'center',
    },
    footer: {
      marginTop: SPACING.SM,
      width: '100%',
    },
    spacer: {
      height: SPACING.SM,
    },
  });

export default WinnerScreen;
