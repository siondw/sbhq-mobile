import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useEffect, useMemo, useRef } from 'react';
import { Animated, Easing, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';

import { ROUTES } from '../configs/routes';
import { celebrationHaptic, startCelebrationHapticLoop } from '../utils/haptics';
import { PLAYER_STATE } from '../logic/constants';
import { ContestRouter } from '../logic/routing/ContestRouter';
import { useContestData } from '../logic/contexts';
import { useAuth } from '../logic/hooks/useAuth';
import { useHeaderHeight } from '../logic/hooks/useHeaderHeight';
import { useParticipantCount } from '../logic/hooks/useParticipantCount';
import { useRefresh } from '../logic/hooks/utils';
import Fireworks from '../ui/animations/Fireworks';
import Header from '../ui/components/AppHeader';
import Button from '../ui/components/Button';
import ContestStatsCard from '../ui/components/ContestStatsCard';
import LoadingView from '../ui/components/LoadingView';
import StatusBadge from '../ui/components/StatusBadge';
import Text from '../ui/components/Text';
import { SPACING, TYPOGRAPHY, useTheme, withAlpha } from '../ui/theme';

const WinnerScreen = () => {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const router = useRouter();
  const { derivedUser } = useAuth();
  const headerHeight = useHeaderHeight();
  const { contestId, loading, error, playerState, refresh, contest } = useContestData();
  const { count: remainingPlayers } = useParticipantCount(contestId);
  const pulse = useRef(new Animated.Value(1)).current;
  const float = useRef(new Animated.Value(0)).current;

  const { refreshing, onRefresh } = useRefresh([refresh]);

  useEffect(() => {
    // Trigger celebration haptic pattern on mount
    celebrationHaptic();
    const stopHaptics = startCelebrationHapticLoop({
      initialDelayMs: 600,
      intervalMs: 1600,
      pulseDelaysMs: [0, 160, 320, 480, 640, 820, 980, 1120, 1260],
      pulseStyle: 'medium',
    });

    const pulseAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1.06,
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

    const floatAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(float, {
          toValue: -6,
          duration: 1400,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(float, {
          toValue: 6,
          duration: 1400,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
    );

    pulseAnimation.start();
    floatAnimation.start();
    return () => {
      stopHaptics();
      pulseAnimation.stop();
      floatAnimation.stop();
    };
  }, [float, pulse]);

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
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
          <LinearGradient
            colors={[withAlpha(colors.background, 0), withAlpha(colors.energy, 0.12)]}
            style={StyleSheet.absoluteFill}
            locations={[0.2, 1]}
          />
          <LinearGradient
            colors={[withAlpha(colors.background, 0), withAlpha(colors.warm, 0.1)]}
            style={StyleSheet.absoluteFill}
            locations={[0.4, 1]}
          />
        </View>
        <Header user={derivedUser} />
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => void onRefresh()} />
          }
        >
          <View style={[styles.content, { paddingTop: headerHeight + SPACING.MD }]}>
            <View style={styles.hero}>
              <View style={styles.trophyWrap}>
                <Fireworks colors={colors} />
                <Animated.View style={[styles.trophyGlow, { transform: [{ scale: pulse }] }]} />
                <Animated.View
                  style={[
                    styles.trophyBadge,
                    {
                      transform: [{ translateY: float }, { scale: pulse }],
                    },
                  ]}
                >
                  <Ionicons name="trophy" size={58} color={colors.energy} />
                </Animated.View>
              </View>

              <StatusBadge label="LAST PLAYER STANDING" icon="sparkles" color={colors.energy} />

              <Text weight="bold" style={styles.title}>
                Champion!
              </Text>
              <Text weight="medium" style={styles.subtitle}>
                You outlasted the field.
              </Text>
              <Text style={styles.body}>
                Final whistle just blew. We are locking scores and prepping rewards.
              </Text>
            </View>

            <View style={styles.statsSection}>
              <ContestStatsCard
                numberOfRemainingPlayers={remainingPlayers}
                roundNumber={contest?.current_round ?? 1}
              />
            </View>

            <View style={styles.footer}>
              <Button label="Back to Contests" onPress={() => router.replace(ROUTES.INDEX)} />
            </View>
          </View>
        </ScrollView>
      </View>
    </ContestRouter>
  );
};

const createStyles = (colors: {
  background: string;
  ink: string;
  surface: string;
  energy: string;
  muted: string;
}) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    content: {
      flexGrow: 1,
      paddingHorizontal: SPACING.LG,
      paddingBottom: SPACING.XXL,
      alignItems: 'center',
      gap: SPACING.LG,
    },
    center: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      padding: SPACING.LG,
    },
    hero: {
      alignItems: 'center',
      gap: SPACING.SM,
      width: '100%',
    },
    trophyWrap: {
      width: 190,
      height: 190,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: SPACING.SM,
    },
    trophyGlow: {
      position: 'absolute',
      width: 150,
      height: 150,
      borderRadius: 75,
      backgroundColor: withAlpha(colors.energy, 0.18),
    },
    trophyBadge: {
      width: 120,
      height: 120,
      borderRadius: 60,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: withAlpha(colors.surface, 0.85),
      borderWidth: 1,
      borderColor: withAlpha(colors.ink, 0.1),
      shadowColor: colors.ink,
      shadowOpacity: 0.18,
      shadowRadius: 16,
      shadowOffset: { width: 0, height: 10 },
      elevation: 4,
    },
    title: {
      fontSize: 52,
      color: colors.ink,
      letterSpacing: -1,
      textAlign: 'center',
    },
    subtitle: {
      fontSize: TYPOGRAPHY.SUBTITLE,
      color: colors.ink,
      textAlign: 'center',
    },
    body: {
      fontSize: TYPOGRAPHY.BODY,
      textAlign: 'center',
      color: colors.muted,
      maxWidth: '82%',
      lineHeight: 22,
    },
    statsSection: {
      width: '100%',
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
