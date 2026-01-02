import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';

import { LOBBY_TIPS } from '../configs/constants';
import { buildContestRoute } from '../configs/routes';
import { PLAYER_STATE } from '../logic/constants';
import { ContestRouter } from '../logic/routing/ContestRouter';
import { useContestData } from '../logic/contexts';
import { useAuth } from '../logic/hooks/useAuth';
import { useHeaderHeight } from '../logic/hooks/useHeaderHeight';
import { useParticipantCount } from '../logic/hooks/useParticipantCount';
import { useRefresh } from '../logic/hooks/utils';
import Header from '../ui/components/AppHeader';
import HeroCountdown from '../ui/components/HeroCountdown';
import StatusBadge from '../ui/components/StatusBadge';
import Text from '../ui/components/Text';
import GlassyTexture from '../ui/textures/GlassyTexture';
import SonarTexture from '../ui/textures/SonarTexture';
import { SPACING, TYPOGRAPHY, useTheme, withAlpha } from '../ui/theme';

const LobbyScreen = () => {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { startTime } = useLocalSearchParams<{ startTime?: string }>();
  const { derivedUser } = useAuth();
  const headerHeight = useHeaderHeight();
  const { playerState, contest, loading, contestId, refresh } = useContestData();
  const { count: participantCount } = useParticipantCount(contestId, 15000); // Poll every 15s

  const { refreshing, onRefresh } = useRefresh([refresh]);
  const [tipIndex, setTipIndex] = useState(0);
  const tipCount = LOBBY_TIPS.length;

  const targetTime = startTime
    ? new Date(startTime).getTime()
    : contest?.start_time
      ? new Date(contest.start_time).getTime()
      : Date.now();

  useEffect(() => {
    if (tipCount <= 1) return undefined;
    const intervalId = setInterval(() => {
      setTipIndex((prev) => (prev + 1) % tipCount);
    }, 6000);

    return () => clearInterval(intervalId);
  }, [tipCount]);

  return (
    <ContestRouter
      contestId={contestId}
      playerState={playerState}
      loading={loading}
      validState={PLAYER_STATE.LOBBY}
      startTime={contest?.start_time}
    >
      <View style={styles.screen}>
        {/* Full-screen Background Effects */}
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
          <LinearGradient
            colors={[withAlpha(colors.background, 0), withAlpha(colors.ink, 0.12)]}
            style={StyleSheet.absoluteFill}
            locations={[0.4, 1]}
          />
          <LinearGradient
            colors={['transparent', colors.background]}
            style={StyleSheet.absoluteFill}
            locations={[0.8, 1]}
          />
        </View>

        <Header user={derivedUser} />

        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => void onRefresh()} />
          }
        >
          <View style={[styles.mainContainer, { paddingTop: headerHeight }]}>
            <View style={styles.content}>
              {/* Top Stats */}
              <GlassyTexture colors={colors} showShine={false} style={styles.statsPill}>
                <View style={styles.statsDot} />
                <Text weight="medium" style={styles.statsText}>
                  {participantCount.toLocaleString()} PLAYERS
                </Text>
              </GlassyTexture>

              {/* Hero Countdown - Centered in available space */}
              <View style={styles.centerSection}>
                <View style={styles.sonarWrapper}>
                  <SonarTexture colors={colors} />
                </View>
                <View style={styles.labelContainer}>
                  <Text weight="bold" style={styles.contestNameLabel}>
                    {contest?.name ? `${contest.name.toUpperCase()} CONTEST` : 'CONTEST'}
                  </Text>
                  <Text weight="medium" style={styles.startingLabel}>
                    STARTS IN
                  </Text>
                </View>
                <HeroCountdown targetTime={targetTime} />
              </View>

              {/* Reassurance Footer */}
              <View style={styles.bottomSection}>
                <StatusBadge label="GAME TIME" icon="time-outline" />
                <Text style={styles.waitingText}>
                  {`Tip: ${LOBBY_TIPS[tipIndex] ?? 'Stay here. The game will start automatically.'}`}
                </Text>
              </View>
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
  muted: string;
  energy: string;
  primary: string;
  surface: string;
}) =>
  StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: colors.background,
    },
    mainContainer: {
      flex: 1,
      zIndex: 1,
    },
    content: {
      flex: 1,
      alignItems: 'center',
      paddingBottom: SPACING.XXL,
      paddingHorizontal: SPACING.LG,
    },
    statsPill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      paddingVertical: 6,
      paddingHorizontal: 12,
      borderRadius: 100,
      backgroundColor: withAlpha(colors.surface, 0.3),
      borderWidth: 1,
      borderColor: withAlpha(colors.ink, 0.1),
      marginTop: SPACING.MD,
    },
    statsDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: colors.energy,
    },
    statsText: {
      fontSize: 12,
      color: colors.ink,
      letterSpacing: 0.5,
    },
    centerSection: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      gap: SPACING.MD,
      width: '100%',
      position: 'relative',
    },
    sonarWrapper: {
      ...StyleSheet.absoluteFillObject,
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: -1,
    },
    labelContainer: {
      alignItems: 'center',
      gap: 4,
    },
    contestNameLabel: {
      fontSize: TYPOGRAPHY.BODY,
      color: colors.primary,
      letterSpacing: 1,
    },
    startingLabel: {
      fontSize: 14,
      color: colors.ink,
      opacity: 0.6,
      letterSpacing: 4,
    },
    bottomSection: {
      alignItems: 'center',
      gap: SPACING.MD,
      width: '100%',
      marginBottom: SPACING.LG,
    },
    waitingText: {
      fontSize: TYPOGRAPHY.SMALL,
      color: colors.muted,
      textAlign: 'center',
      maxWidth: '80%',
    },
  });

export default LobbyScreen;
