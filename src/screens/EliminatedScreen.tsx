import { useRouter } from 'expo-router';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, StyleSheet, View } from 'react-native';

import { Ionicons } from '@expo/vector-icons';

import { eliminationHaptic } from '../utils/haptics';

import { buildContestRoute, buildLobbyRoute, ROUTES } from '../configs/routes';
import { PLAYER_STATE } from '../logic/constants';
import { ContestRouter } from '../logic/routing/ContestRouter';
import { useContestData } from '../logic/contexts';
import { useAnswerDistribution } from '../logic/hooks/useAnswerDistribution';
import { useAuth } from '../logic/hooks/useAuth';
import { useEliminationQuestion } from '../logic/hooks/useEliminationQuestion';
import { useHeaderHeight } from '../logic/hooks/useHeaderHeight';
import { useParticipantCount } from '../logic/hooks/useParticipantCount';
import AnswerDistributionChart from '../ui/components/AnswerDistributionChart';
import Header from '../ui/components/AppHeader';
import Button from '../ui/components/Button';
import ContestStatsCard from '../ui/components/ContestStatsCard';
import LoadingView from '../ui/components/LoadingView';
import Text from '../ui/components/Text';
import { SPACING, TYPOGRAPHY, useTheme } from '../ui/theme';
import { normalizeQuestionOptions } from '../utils/questionOptions';

const EliminatedScreen = () => {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const router = useRouter();
  const { derivedUser } = useAuth();
  const headerHeight = useHeaderHeight();
  const { contestId, loading, error, playerState, refresh, participant, answer } = useContestData();
  const { count: remainingPlayers } = useParticipantCount(contestId);

  console.log('[DEBUG] EliminatedScreen render, playerState:', playerState, 'contestId:', contestId);

  const { distribution } = useAnswerDistribution(
    contestId,
    participant?.elimination_round ?? undefined,
  );

  const { question: eliminationQuestion } = useEliminationQuestion(
    contestId,
    participant?.elimination_round,
  );

  // Staggered slam animations
  const skullAnim = useRef(new Animated.Value(-200)).current;
  const textAnim = useRef(new Animated.Value(-200)).current;
  const contentAnim = useRef(new Animated.Value(0)).current;
  const chartAnim = useRef(new Animated.Value(0)).current;
  const [showChart, setShowChart] = useState(false);

  useEffect(() => {
    // Trigger elimination haptic pattern on mount (dramatic "you're out" feel)
    eliminationHaptic();

    // Skull slams first
    Animated.spring(skullAnim, {
      toValue: 0,
      tension: 40,
      friction: 5,
      useNativeDriver: true,
    }).start();

    // Text slams 500ms later
    Animated.sequence([
      Animated.delay(500),
      Animated.spring(textAnim, {
        toValue: 0,
        tension: 40,
        friction: 5,
        useNativeDriver: true,
      }),
    ]).start();

    // Content fades in 1000ms later (slower fade)
    Animated.sequence([
      Animated.delay(1000),
      Animated.timing(contentAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();

    // Show chart at 1800ms, then fade it in
    setTimeout(() => setShowChart(true), 1800);
    Animated.sequence([
      Animated.delay(1800),
      Animated.timing(chartAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, [skullAnim, textAnim, contentAnim, chartAnim]);

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
      validState={PLAYER_STATE.ELIMINATED}
    >
      <View style={styles.container}>
        <Header user={derivedUser} />
        <View style={[styles.content, { paddingTop: headerHeight + SPACING.MD }]}>
          <View style={styles.headerBlock}>
          <Animated.View
            style={{
              transform: [{ translateY: textAnim }],
            }}
          >
            <Text weight="bold" style={styles.title}>
              Eliminated
            </Text>
          </Animated.View>
          <Animated.View
            style={[
              styles.iconContainer,
              {
                transform: [{ translateY: skullAnim }],
              },
            ]}
          >
            <Ionicons name="skull" size={80} color={colors.danger} />
          </Animated.View>
        </View>

        <Animated.View style={[styles.statsSection, { opacity: contentAnim }]}>
          <ContestStatsCard
            numberOfRemainingPlayers={remainingPlayers}
            roundNumber={participant?.elimination_round ?? 1}
            variant="eliminated"
          />
        </Animated.View>

        {distribution.length > 0 && eliminationQuestion?.correct_option && showChart && (
          <Animated.View style={[styles.chartSection, { opacity: chartAnim }]}>
            <AnswerDistributionChart
              distribution={distribution.map((d) => {
                const options = normalizeQuestionOptions(eliminationQuestion?.options);
                return {
                  option: d.answer,
                  label: options.find((o) => o.key === d.answer)?.label ?? d.answer,
                  count: d.count,
                };
              })}
              correctAnswer={eliminationQuestion.correct_option?.[0] ?? null}
              userAnswer={answer?.answer ?? null}
            />
          </Animated.View>
        )}

        <Animated.View style={[styles.footer, { opacity: contentAnim }]}>
          <Button label="Back to Contests" onPress={() => router.replace(ROUTES.INDEX)} />
        </Animated.View>
      </View>
    </View>
    </ContestRouter>
  );
};

const createStyles = (colors: { background: string; danger: string; muted: string }) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    content: {
      flex: 1,
      paddingHorizontal: SPACING.MD,
      paddingTop: SPACING.XL,
      gap: SPACING.LG,
    },
    center: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      padding: SPACING.LG,
    },
    headerBlock: {
      alignItems: 'center',
      gap: SPACING.XS,
    },
    iconContainer: {
      marginTop: SPACING.XS,
    },
    title: {
      fontSize: 56,
      color: colors.danger,
      textAlign: 'center',
      letterSpacing: -1,
    },
    statsSection: {
      marginTop: SPACING.LG,
    },
    sectionLabel: {
      fontSize: TYPOGRAPHY.SUBTITLE,
      marginBottom: SPACING.SM,
      textAlign: 'center',
    },
    chartSection: {
      marginTop: SPACING.MD,
    },
    footer: {
      marginTop: SPACING.MD,
    },
    spacer: {
      height: SPACING.SM,
    },
  });

export default EliminatedScreen;
