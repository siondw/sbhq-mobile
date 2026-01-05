import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';

import { Ionicons } from '@expo/vector-icons';

import { successHaptic } from '../utils/haptics';

import { PLAYER_STATE } from '../logic/constants';
import { ContestRouter } from '../logic/routing/ContestRouter';
import { useContestData } from '../logic/contexts';
import { useAnswerDistribution } from '../logic/hooks/useAnswerDistribution';
import { useAuth } from '../logic/hooks/useAuth';
import { useHeaderHeight } from '../logic/hooks/useHeaderHeight';
import { useParticipantCount } from '../logic/hooks/useParticipantCount';
import { useRefresh } from '../logic/hooks/utils';
import { useShineAnimation } from '../ui/animations';
import AnswerDistributionChart from '../ui/components/AnswerDistributionChart';
import Header from '../ui/components/AppHeader';
import Button from '../ui/components/Button';
import ContestStatsCard from '../ui/components/ContestStatsCard';
import LoadingView from '../ui/components/LoadingView';
import Text from '../ui/components/Text';
import { SPACING, useTheme } from '../ui/theme';
import { buildAnswerDistribution } from '../utils/answerDistribution';
import { normalizeQuestionOptions } from '../utils/questionOptions';

const CorrectScreen = () => {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { derivedUser } = useAuth();
  const headerHeight = useHeaderHeight();
  const { contestId, loading, error, playerState, refresh, contest, question, answer } =
    useContestData();
  const { count: remainingPlayers } = useParticipantCount(contestId);

  const { refreshing, onRefresh } = useRefresh([refresh]);

  const { distribution } = useAnswerDistribution(
    contestId,
    answer?.round ?? contest?.current_round ?? undefined,
  );
  const options = useMemo(() => normalizeQuestionOptions(question?.options), [question?.options]);

  // Staggered scale/fade animations
  const checkmarkScale = useRef(new Animated.Value(0)).current;
  const checkmarkOpacity = useRef(new Animated.Value(0)).current;
  const textScale = useRef(new Animated.Value(0)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;

  const contentAnim = useRef(new Animated.Value(0)).current;
  const chartAnim = useRef(new Animated.Value(0)).current;
  const [showChart, setShowChart] = useState(false);

  const { translateX: shineTranslateX, opacity: shineOpacity } = useShineAnimation({
    preset: 'NORMAL',
    delay: 800,
    loop: false,
  });

  useEffect(() => {
    // Trigger success haptic on mount
    successHaptic();

    // Checkmark scales and fades in
    Animated.parallel([
      Animated.spring(checkmarkScale, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
      Animated.timing(checkmarkOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();

    // Text scales and fades in 400ms later
    Animated.sequence([
      Animated.delay(400),
      Animated.parallel([
        Animated.spring(textScale, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
        Animated.timing(textOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]),
    ]).start();

    // Content fades in 1000ms later
    Animated.sequence([
      Animated.delay(1000),
      Animated.timing(contentAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();

    // Show chart at 1600ms, then fade it in
    setTimeout(() => setShowChart(true), 1600);
    Animated.sequence([
      Animated.delay(1600),
      Animated.timing(chartAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, [checkmarkScale, checkmarkOpacity, textScale, textOpacity, contentAnim, chartAnim]);

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
      validState={PLAYER_STATE.CORRECT_WAITING_NEXT}
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
            <View style={styles.headerBlock}>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: SPACING.SM,
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                <Animated.View
                  style={{
                    opacity: textOpacity,
                    transform: [{ scale: textScale }],
                  }}
                >
                  <Text weight="bold" style={styles.title}>
                    Correct!
                  </Text>
                </Animated.View>
                <Animated.View
                  style={{
                    opacity: checkmarkOpacity,
                    transform: [{ scale: checkmarkScale }],
                  }}
                >
                  <Ionicons name="checkmark" size={64} color={colors.success} />
                </Animated.View>
                <Animated.View
                  style={[
                    styles.shineContainer,
                    {
                      opacity: shineOpacity,
                      transform: [{ translateX: shineTranslateX }, { rotate: '-15deg' }],
                    },
                  ]}
                  pointerEvents="none"
                >
                  <LinearGradient
                    colors={[
                      'rgba(255, 255, 255, 0)',
                      'rgba(255, 255, 255, 0.15)',
                      'rgba(255, 255, 255, 0.25)',
                      'rgba(255, 255, 255, 0.12)',
                      'rgba(255, 255, 255, 0.3)',
                      'rgba(255, 255, 255, 0.4)',
                      'rgba(255, 255, 255, 0.25)',
                      'rgba(255, 255, 255, 0.12)',
                      'rgba(255, 255, 255, 0)',
                    ]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.shine}
                  />
                </Animated.View>
              </View>
            </View>

            <Animated.View style={[styles.statsSection, { opacity: contentAnim }]}>
              <ContestStatsCard
                numberOfRemainingPlayers={remainingPlayers}
                roundNumber={contest?.current_round ?? 1}
                variant="success"
              />
            </Animated.View>

            {distribution.length > 0 && question?.correct_option && showChart && (
              <Animated.View style={[styles.chartSection, { opacity: chartAnim }]}>
                <AnswerDistributionChart
                  distribution={buildAnswerDistribution(options, distribution)}
                  correctAnswer={question.correct_option?.[0] ?? null}
                  userAnswer={answer?.answer ?? null}
                />
              </Animated.View>
            )}
          </View>
        </ScrollView>
      </View>
    </ContestRouter>
  );
};

const createStyles = (colors: { background: string; success: string }) =>
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
      color: colors.success,
      textAlign: 'center',
      letterSpacing: -1,
    },
    statsSection: {
      marginTop: SPACING.LG,
    },
    chartSection: {
      marginTop: SPACING.XL,
    },
    shineContainer: {
      position: 'absolute',
      top: -120,
      left: -150,
      width: 600,
      height: 200,
      borderRadius: 200,
      overflow: 'hidden',
      zIndex: 2,
    },
    shine: {
      flex: 1,
      width: '100%',
      height: '100%',
    },
    spacer: {
      height: SPACING.SM,
    },
  });

export default CorrectScreen;
