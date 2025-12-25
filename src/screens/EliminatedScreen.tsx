import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useMemo } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { ROUTES } from '../configs/routes';
import { PLAYER_STATE } from '../logic/constants';
import { useAuth } from '../logic/hooks/useAuth';
import { useContestState } from '../logic/hooks/useContestState';
import { useHeaderHeight } from '../logic/hooks/useHeaderHeight';
import { useParticipantCount } from '../logic/hooks/useParticipantCount';
import AnswerSummaryCard from '../ui/components/AnswerSummaryCard';
import Header from '../ui/components/AppHeader';
import Button from '../ui/components/Button';
import ContestStatsCard from '../ui/components/ContestStatsCard';
import Text from '../ui/components/Text';
import { SPACING, TYPOGRAPHY, useTheme } from '../ui/theme';
import { resolveOptionLabel, resolveOptionLabels } from '../utils/questionOptions';

const EliminatedScreen = () => {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const router = useRouter();
  const { contestId } = useLocalSearchParams<{ contestId?: string }>();
  const { derivedUser } = useAuth();
  const headerHeight = useHeaderHeight();
  const { count: remainingPlayers } = useParticipantCount(contestId);
  const { loading, error, playerState, refresh, contest, participant, question, answer } =
    useContestState(contestId, derivedUser?.id);

  useEffect(() => {
    if (!contestId || loading || playerState === PLAYER_STATE.UNKNOWN) return;
    if (playerState === PLAYER_STATE.ANSWERING) {
      router.replace(`/contest/${contestId}`);
    } else if (playerState === PLAYER_STATE.SUBMITTED_WAITING) {
      router.replace({ pathname: ROUTES.SUBMITTED, params: { contestId } });
    } else if (playerState === PLAYER_STATE.CORRECT_WAITING_NEXT) {
      router.replace({ pathname: ROUTES.CORRECT, params: { contestId } });
    } else if (playerState === PLAYER_STATE.WINNER) {
      router.replace({ pathname: ROUTES.WINNER, params: { contestId } });
    } else if (playerState === PLAYER_STATE.LOBBY) {
      router.replace({ pathname: ROUTES.LOBBY, params: { contestId } });
    }
  }, [playerState, router, contestId, loading]);

  const eliminatedRound = participant?.elimination_round ?? contest?.current_round ?? 1;

  const selectedAnswerLabel = useMemo(() => {
    return resolveOptionLabel(question?.options, answer?.answer) ?? 'No answer';
  }, [question?.options, answer?.answer]);

  const correctAnswerLabel = useMemo(() => {
    const labels = resolveOptionLabels(question?.options, question?.correct_option);
    return labels ? labels.join(', ') : null;
  }, [question?.options, question?.correct_option]);

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
        <View style={styles.headerBlock}>
          <Text weight="bold" style={styles.title}>
            Eliminated
          </Text>
          <Text style={styles.body}>You are out for this contest. Thanks for playing.</Text>
        </View>

        <AnswerSummaryCard
          header="Round Summary"
          roundLabel={`Eliminated in Round ${eliminatedRound}`}
          question={question?.question ?? 'Waiting for the round details'}
          selectedAnswer={selectedAnswerLabel}
          correctAnswer={correctAnswerLabel}
        />

        <ContestStatsCard
          numberOfRemainingPlayers={remainingPlayers}
          roundNumber={contest?.current_round ?? eliminatedRound}
        />

        <View style={styles.footer}>
          <Button label="Back to Contests" onPress={() => router.replace(ROUTES.INDEX)} />
        </View>
      </View>
    </View>
  );
};

const createStyles = (colors: { background: string; danger: string }) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    paddingHorizontal: SPACING.MD,
    justifyContent: 'center',
    gap: SPACING.MD,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.LG,
  },
  headerBlock: {
    gap: SPACING.XS,
  },
  title: {
    fontSize: TYPOGRAPHY.TITLE,
    color: colors.danger,
  },
  body: {
    fontSize: TYPOGRAPHY.BODY,
  },
  footer: {
    marginTop: SPACING.SM,
  },
  spacer: {
    height: SPACING.SM,
  },
});

export default EliminatedScreen;
