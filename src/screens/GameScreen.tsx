import { useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { type AnswerOptionValue } from '../configs/constants';
import { ROUTES } from '../configs/routes';
import { PLAYER_STATE } from '../logic/constants';
import { useAuth } from '../logic/hooks/useAuth';
import { useContestState } from '../logic/hooks/useContestState';
import { useHeaderHeight } from '../logic/hooks/useHeaderHeight';
import AnswerOption from '../ui/components/AnswerOption';
import Header from '../ui/components/AppHeader';
import Button from '../ui/components/Button';
import Card from '../ui/components/Card';
import Text from '../ui/components/Text';
import { SPACING, TYPOGRAPHY, useTheme } from '../ui/theme';
import { isAnswerOptionValue, normalizeQuestionOptions } from '../utils/questionOptions';

interface GameScreenProps {
  contestId?: string;
}

const GameScreen = ({ contestId }: GameScreenProps) => {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { derivedUser } = useAuth();
  const router = useRouter();
  const headerHeight = useHeaderHeight();
  const { loading, error, contest, participant, question, answer, playerState, submit, refresh } =
    useContestState(contestId, derivedUser?.id);
  const [selectedOption, setSelectedOption] = useState<AnswerOptionValue | null>(null);

  const options = useMemo(() => normalizeQuestionOptions(question?.options), [question?.options]);

  useEffect(() => {
    if (answer?.answer && isAnswerOptionValue(answer.answer)) {
      setSelectedOption(answer.answer);
      return;
    }
    setSelectedOption(null);
  }, [answer?.answer, question?.id]);

  const handleSubmit = () => {
    if (!participant || !contest || !question) return;
    if (answer || !selectedOption) return;
    void submit({
      participantId: participant.id,
      contestId: contest.id,
      questionId: question.id,
      round: question.round,
      answer: selectedOption,
    });
  };

  useEffect(() => {
    if (!contestId || loading || playerState === PLAYER_STATE.UNKNOWN) return;

    // Only navigate away from game screen if we're NOT in answering state
    if (playerState === PLAYER_STATE.LOBBY) {
      router.push({
        pathname: ROUTES.LOBBY,
        params: { contestId, startTime: contest?.start_time },
      });
    } else if (playerState === PLAYER_STATE.SUBMITTED_WAITING) {
      router.push({ pathname: '/submitted', params: { contestId } });
    } else if (playerState === PLAYER_STATE.CORRECT_WAITING_NEXT) {
      router.push({ pathname: '/correct', params: { contestId } });
    } else if (playerState === PLAYER_STATE.ELIMINATED) {
      router.push({ pathname: ROUTES.ELIMINATED, params: { contestId } });
    } else if (playerState === PLAYER_STATE.WINNER) {
      router.push({ pathname: ROUTES.WINNER, params: { contestId } });
    }
    // Note: ANSWERING should stay on this screen, so we don't navigate
  }, [playerState, router, contestId, contest?.start_time, loading]);

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

  const isAnswerLocked = playerState !== PLAYER_STATE.ANSWERING || !!answer;

  return (
    <View style={styles.container}>
      <Header user={derivedUser} />
      <View style={[styles.content, { paddingTop: headerHeight + SPACING.MD }]}>
        <View style={styles.roundHeader}>
          <Text weight="medium" style={styles.roundLabel}>
            Round
          </Text>
          <Text weight="bold" style={styles.roundNumber}>
            {contest?.current_round ?? '?'}
          </Text>
          <Text weight="medium" style={styles.roundSubtitle}>
            Choose Wisely!
          </Text>
        </View>

        <Card style={styles.questionCard}>
          <Text weight="bold" style={styles.question}>
            {question?.question ?? 'Waiting for question...'}
          </Text>
          {options.map((option) => (
            <AnswerOption
              key={option.key}
              label={option.label}
              selected={selectedOption === option.key}
              disabled={isAnswerLocked}
              onPress={() => setSelectedOption(option.key)}
            />
          ))}
          <View style={styles.submitRow}>
            <Button
              label="Submit"
              onPress={handleSubmit}
              disabled={isAnswerLocked || !selectedOption}
            />
          </View>
        </Card>
      </View>
    </View>
  );
};

const createStyles = (colors: { background: string; muted: string; ink: string }) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingHorizontal: SPACING.MD,
    flex: 1,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.LG,
  },
  roundHeader: {
    alignItems: 'center',
    marginBottom: SPACING.LG,
  },
  roundLabel: {
    fontSize: TYPOGRAPHY.SMALL,
    color: colors.muted,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  roundNumber: {
    fontSize: 32,
    color: colors.ink,
  },
  roundSubtitle: {
    fontSize: TYPOGRAPHY.BODY,
    color: colors.muted,
  },
  questionCard: {
    gap: SPACING.SM,
  },
  question: {
    fontSize: TYPOGRAPHY.SUBTITLE,
  },
  submitRow: {
    marginTop: SPACING.SM,
  },
  spacer: {
    height: SPACING.SM,
  },
});

export default GameScreen;
