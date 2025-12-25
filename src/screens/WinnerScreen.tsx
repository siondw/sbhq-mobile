import React, { useEffect, useRef } from 'react';
import { ActivityIndicator, Animated, Easing, StyleSheet, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { ROUTES } from '../configs/routes';
import { useAuth } from '../logic/hooks/useAuth';
import { useContestState } from '../logic/hooks/useContestState';
import { useHeaderHeight } from '../logic/hooks/useHeaderHeight';
import { useParticipantCount } from '../logic/hooks/useParticipantCount';
import { PLAYER_STATE } from '../logic/constants';
import Button from '../ui/Button';
import Text from '../ui/Text';
import { COLORS, SPACING, TYPOGRAPHY } from '../ui/theme';
import ContestStatsCard from '../ui/ContestStatsCard';
import Header from '../ui/AppHeader';

const WinnerScreen = () => {
  const router = useRouter();
  const { contestId } = useLocalSearchParams<{ contestId?: string }>();
  const { derivedUser } = useAuth();
  const headerHeight = useHeaderHeight();
  const { count: remainingPlayers } = useParticipantCount(contestId);
  const { loading, error, playerState, refresh, contest } = useContestState(
    contestId,
    derivedUser?.id,
  );
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
      router.replace(`/contest/${contestId}`);
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
    return (
      <View style={styles.center}>
        <ActivityIndicator />
      </View>
    );
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND,
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
    backgroundColor: COLORS.PRIMARY_DARK,
    shadowColor: COLORS.PRIMARY_DARK,
    shadowOpacity: 0.25,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
  },
  badgeText: {
    color: COLORS.SURFACE,
    letterSpacing: 1,
  },
  title: {
    fontSize: 28,
    color: COLORS.PRIMARY_DARK,
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
