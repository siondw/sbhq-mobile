import { LinearGradient } from 'expo-linear-gradient';
import React, { useMemo } from 'react';
import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';

import { CONTEST_STATE, PLAYER_STATE } from '../logic/constants';
import { ContestRouter } from '../logic/routing/ContestRouter';
import { useContestData } from '../logic/contexts';
import { useAnswerDistribution } from '../logic/hooks/useAnswerDistribution';
import { useAuth } from '../logic/hooks/useAuth';
import { useHeaderHeight } from '../logic/hooks/useHeaderHeight';
import { useParticipantCount } from '../logic/hooks/useParticipantCount';
import { useRefresh } from '../logic/hooks/utils';
import RollingFootball from '../ui/animations/RollingFootball';
import AnswerDistributionChart from '../ui/components/AnswerDistributionChart';
import Header from '../ui/components/AppHeader';
import Button from '../ui/components/Button';
import LoadingView from '../ui/components/LoadingView';
import Scorebug from '../ui/components/Scorebug';
import SubmittedQuestionCard from '../ui/components/SubmittedQuestionCard';
import Text from '../ui/components/Text';
import { SPACING, TYPOGRAPHY, useTheme, withAlpha } from '../ui/theme';
import { buildAnswerDistribution } from '../utils/answerDistribution';
import { normalizeQuestionOptions } from '../utils/questionOptions';

const SubmittedScreen = () => {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { derivedUser } = useAuth();
  const headerHeight = useHeaderHeight();
  const { contestId, loading, error, playerState, refresh, question, answer, contest } =
    useContestData();

  const { count: participantCount } = useParticipantCount(contestId);

  const { refreshing, onRefresh } = useRefresh([refresh]);

  const roundToFetch =
    contest?.state === CONTEST_STATE.ROUND_CLOSED && contest.current_round !== null
      ? contest.current_round
      : undefined;

  const { distribution } = useAnswerDistribution(contestId, roundToFetch);

  const options = useMemo(() => normalizeQuestionOptions(question?.options), [question?.options]);
  const showDistribution =
    contest?.state === CONTEST_STATE.ROUND_CLOSED && distribution.length > 0;

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
      validState={PLAYER_STATE.SUBMITTED_WAITING}
    >
      <View style={styles.container}>
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
          <LinearGradient
            colors={[withAlpha(colors.background, 0), withAlpha(colors.ink, 0.05)]}
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
            <View style={[styles.scorebugContainer, { top: headerHeight + SPACING.MD }]}>
              <Scorebug playerCount={participantCount} />
            </View>

            <View style={styles.centerStack}>
              {/* Football positioned above the card */}
              <View style={styles.footballContainer}>
                <RollingFootball />
              </View>

              <View style={styles.cardContainer}>
                <SubmittedQuestionCard
                  round={contest?.current_round ?? 1}
                  question={question?.question ?? 'Waiting for update...'}
                  options={options}
                  selectedOptionKey={answer?.answer}
                  layoutVariant="wrap"
                />

                {!showDistribution && (
                  <Text style={styles.waitingText}>
                    Play in progress
                  </Text>
                )}

                {/* Distribution Chart */}
                {showDistribution && (
                  <View style={styles.chartSection}>
                    <AnswerDistributionChart
                      distribution={buildAnswerDistribution(options, distribution)}
                      correctAnswer={null}
                      userAnswer={answer?.answer ?? null}
                    />
                  </View>
                )}
              </View>
            </View>
          </View>
        </ScrollView>
      </View>
    </ContestRouter>
  );
};

const createStyles = (colors: { background: string; muted: string; ink: string }) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    content: {
      flex: 1,
      paddingHorizontal: SPACING.MD,
      justifyContent: 'center',
      paddingBottom: 100,
    },
    center: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      padding: SPACING.LG,
    },
    spacer: {
      height: SPACING.SM,
    },
    scorebugContainer: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      alignItems: 'center',
      zIndex: 10,
    },
    centerStack: {
      width: '100%',
      alignItems: 'center',
    },
    cardContainer: {
      width: '100%',
      maxWidth: 500,
      gap: SPACING.MD,
    },
    waitingText: {
      fontSize: TYPOGRAPHY.SMALL,
      color: colors.muted,
      textAlign: 'center',
      alignSelf: 'center',
      maxWidth: '80%',
      lineHeight: 18,
    },
    chartSection: {
      marginTop: SPACING.XL,
      paddingTop: SPACING.SM,
    },
    footballContainer: {
      width: '100%',
      height: 100,
      marginBottom: -30,
      zIndex: 20,
      elevation: 20,
    },
  });

export default SubmittedScreen;
