import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useEffect, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

import { buildContestRoute, ROUTES } from '../configs/routes';
import { CONTEST_STATE, PLAYER_STATE } from '../logic/constants';
import { useContestData } from '../logic/contexts';
import { useAnswerDistribution } from '../logic/hooks/useAnswerDistribution';
import { useAuth } from '../logic/hooks/useAuth';
import { useHeaderHeight } from '../logic/hooks/useHeaderHeight';
import { useParticipantCount } from '../logic/hooks/useParticipantCount';
import RollingFootball from '../ui/animations/RollingFootball';
import AnswerDistributionChart from '../ui/components/AnswerDistributionChart';
import Header from '../ui/components/AppHeader';
import Button from '../ui/components/Button';
import LoadingView from '../ui/components/LoadingView';
import Scorebug from '../ui/components/Scorebug';
import SubmittedQuestionCard from '../ui/components/SubmittedQuestionCard';
import Text from '../ui/components/Text';
import { SPACING, useTheme, withAlpha } from '../ui/theme';
import { normalizeQuestionOptions } from '../utils/questionOptions';

const SubmittedScreen = () => {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const router = useRouter();
  const { derivedUser } = useAuth();
  const headerHeight = useHeaderHeight();
  const { contestId, loading, error, playerState, refresh, question, answer, contest } =
    useContestData();

  const { count: participantCount } = useParticipantCount(contestId);

  const roundToFetch =
    contest?.state === CONTEST_STATE.ROUND_CLOSED && contest.current_round !== null
      ? contest.current_round
      : undefined;

  const { distribution } = useAnswerDistribution(contestId, roundToFetch);

  useEffect(() => {
    if (!contestId || loading || playerState === PLAYER_STATE.UNKNOWN) return;

    if (playerState === PLAYER_STATE.ANSWERING) {
      router.replace(buildContestRoute(contestId));
    } else if (playerState === PLAYER_STATE.CORRECT_WAITING_NEXT) {
      router.replace({ pathname: ROUTES.CORRECT, params: { contestId } });
    } else if (playerState === PLAYER_STATE.ELIMINATED) {
      router.replace({ pathname: ROUTES.ELIMINATED, params: { contestId } });
    } else if (playerState === PLAYER_STATE.WINNER) {
      router.replace({ pathname: ROUTES.WINNER, params: { contestId } });
    } else if (playerState === PLAYER_STATE.LOBBY) {
      router.replace({ pathname: ROUTES.LOBBY, params: { contestId } });
    }
  }, [playerState, router, contestId, loading]);

  const options = useMemo(() => normalizeQuestionOptions(question?.options), [question?.options]);

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
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <LinearGradient
          colors={[withAlpha(colors.background, 0), withAlpha(colors.ink, 0.05)]}
          style={StyleSheet.absoluteFill}
          locations={[0.4, 1]}
        />
      </View>

      <Header user={derivedUser} />

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
            />

            {/* Distribution Chart */}
            {contest?.state === CONTEST_STATE.ROUND_CLOSED && distribution.length > 0 && (
              <View style={styles.chartSection}>
                <AnswerDistributionChart
                  distribution={distribution.map((d) => ({
                    option: options.find((o) => o.label === d.answer)?.key ?? d.answer,
                    label: d.answer,
                    count: d.count,
                  }))}
                  correctAnswer={null}
                  userAnswer={answer?.answer ?? null}
                />
              </View>
            )}
          </View>
        </View>
      </View>
    </View>
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
