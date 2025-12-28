import { useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { type AnswerOptionValue } from '../configs/constants';
import { ROUTES } from '../configs/routes';
import { PLAYER_STATE } from '../logic/constants';
import { useContestData } from '../logic/contexts';
import { useAuth } from '../logic/hooks/useAuth';
import { useHeaderHeight } from '../logic/hooks/useHeaderHeight';
import { useParticipantCount } from '../logic/hooks/useParticipantCount';
import AnswerOption from '../ui/components/AnswerOption';
import Header from '../ui/components/AppHeader';
import Button from '../ui/components/Button';
import LoadingView from '../ui/components/LoadingView';
import Scorebug from '../ui/components/Scorebug';
import Text from '../ui/components/Text';
import { SPACING, TYPOGRAPHY, useTheme, withAlpha } from '../ui/theme';
import { isAnswerOptionValue, normalizeQuestionOptions } from '../utils/questionOptions';

const GameScreen = () => {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { derivedUser } = useAuth();
  const router = useRouter();
  const headerHeight = useHeaderHeight();
  const {
    contestId,
    loading,
    error,
    contest,
    participant,
    question,
    answer,
    playerState,
    submit,
    refresh,
  } = useContestData();
  const { count: participantCount } = useParticipantCount(contestId);
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
      router.push({ pathname: ROUTES.SUBMITTED, params: { contestId } });
    } else if (playerState === PLAYER_STATE.CORRECT_WAITING_NEXT) {
      router.push({ pathname: ROUTES.CORRECT, params: { contestId } });
    } else if (playerState === PLAYER_STATE.ELIMINATED) {
      router.push({ pathname: ROUTES.ELIMINATED, params: { contestId } });
    } else if (playerState === PLAYER_STATE.WINNER) {
      router.push({ pathname: ROUTES.WINNER, params: { contestId } });
    }
    // Note: ANSWERING should stay on this screen, so we don't navigate
  }, [playerState, router, contestId, contest?.start_time, loading]);

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

  const isAnswerLocked = playerState !== PLAYER_STATE.ANSWERING || !!answer;

  return (
    <View style={styles.container}>
      <Header user={derivedUser} />
      <View style={[styles.content, { paddingTop: headerHeight + SPACING.MD }]}>
        <View style={styles.scorebugSection}>
          <Scorebug playerCount={participantCount} />
        </View>

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

        <View style={styles.questionSection}>
          <Text weight="bold" style={styles.question}>
            {question?.question ?? 'Waiting for question...'}
          </Text>
        </View>

        <View style={styles.optionsSection}>
          {options.map((option) => (
            <AnswerOption
              key={option.key}
              label={option.label}
              selected={selectedOption === option.key}
              disabled={isAnswerLocked}
              onPress={() => setSelectedOption(option.key)}
            />
          ))}
        </View>

        <View style={styles.submitRow}>
          <Button
            label="Submit"
            onPress={handleSubmit}
            disabled={isAnswerLocked || !selectedOption}
          />
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
      paddingHorizontal: SPACING.MD,
      flex: 1,
    },
    center: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      padding: SPACING.LG,
    },
    scorebugSection: {
      marginBottom: SPACING.MD,
    },
    roundHeader: {
      alignItems: 'center',
      marginBottom: SPACING.XL,
      paddingBottom: SPACING.LG,
      borderBottomWidth: 1,
      borderBottomColor: withAlpha(colors.ink, 0.1),
    },
    roundLabel: {
      fontSize: TYPOGRAPHY.BODY,
      color: colors.muted,
      letterSpacing: 1,
      textTransform: 'uppercase',
      marginBottom: SPACING.XS,
    },
    roundNumber: {
      fontSize: 80,
      color: colors.ink,
      lineHeight: 88,
      marginBottom: SPACING.XS,
    },
    roundSubtitle: {
      fontSize: TYPOGRAPHY.BODY,
      color: colors.muted,
    },
    questionSection: {
      marginBottom: SPACING.MD,
    },
    question: {
      fontSize: TYPOGRAPHY.SUBTITLE,
      textAlign: 'center',
    },
    optionsSection: {
      marginBottom: SPACING.MD,
      paddingHorizontal: SPACING.SM,
    },
    submitRow: {
      marginTop: SPACING.SM,
    },
    spacer: {
      height: SPACING.SM,
    },
  });

export default GameScreen;
