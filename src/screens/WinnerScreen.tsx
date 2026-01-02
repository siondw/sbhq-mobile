import { useRouter } from 'expo-router';
import React, { useEffect, useMemo, useRef } from 'react';
import { Animated, Easing, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';

import { buildContestRoute, buildLobbyRoute, ROUTES } from '../configs/routes';
import { celebrationHaptic } from '../utils/haptics';
import { PLAYER_STATE } from '../logic/constants';
import { ContestRouter } from '../logic/routing/ContestRouter';
import { useContestData } from '../logic/contexts';
import { useAuth } from '../logic/hooks/useAuth';
import { useHeaderHeight } from '../logic/hooks/useHeaderHeight';
import { useParticipantCount } from '../logic/hooks/useParticipantCount';
import { useRefresh } from '../logic/hooks/utils';
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

  const { refreshing, onRefresh } = useRefresh([refresh]);

  useEffect(() => {
    // Trigger celebration haptic pattern on mount
    celebrationHaptic();

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
    <ContestRouter
      contestId={contestId}
      playerState={playerState}
      loading={loading}
      validState={PLAYER_STATE.WINNER}
    >
      <View style={styles.container}>
        <Header user={derivedUser} />
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => void onRefresh()} />
          }
        >
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
        </ScrollView>
      </View>
    </ContestRouter>
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
