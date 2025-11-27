import { useRouter } from 'expo-router';
import React, { useEffect, useMemo } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { useAuth } from '../logic/auth/useAuth';
import { PLAYER_STATE } from '../logic/constants';
import { useContestState } from '../logic/contest/useContestState';
import Header from '../ui/Header';
import AnswerOption from '../ui/primitives/AnswerOption';
import Button from '../ui/primitives/Button';
import Card from '../ui/primitives/Card';
import Text from '../ui/primitives/Text';
import { COLORS, HEADER_HEIGHT, SPACING, TYPOGRAPHY } from '../ui/theme';

interface GameScreenProps {
  contestId?: string;
}

const GameScreen = ({ contestId }: GameScreenProps) => {
  const { derivedUser } = useAuth();
  const router = useRouter();
  const { loading, error, contest, participant, question, answer, playerState, submit, refresh } =
    useContestState(contestId, derivedUser?.id);

  const options = useMemo(() => {
    if (!question?.options) return [];
    return Object.entries(question.options).map(([key, value]) => ({ key, label: value }));
  }, [question]);

  const handleSubmit = (optionKey: string) => {
    if (!participant || !contest || !question) return;
    if (answer) return;
    void submit({
      participantId: participant.id,
      contestId: contest.id,
      questionId: question.id,
      round: question.round,
      answer: optionKey,
    });
  };

  useEffect(() => {
    if (!contestId || loading || playerState === PLAYER_STATE.UNKNOWN) return;
    
    // Only navigate away from game screen if we're NOT in answering state
    if (playerState === PLAYER_STATE.LOBBY) {
      router.replace({ pathname: '/lobby', params: { contestId, startTime: contest?.start_time } });
    } else if (playerState === PLAYER_STATE.SUBMITTED_WAITING) {
      router.replace({ pathname: '/submitted', params: { contestId } });
    } else if (playerState === PLAYER_STATE.CORRECT_WAITING_NEXT) {
      router.replace({ pathname: '/correct', params: { contestId } });
    } else if (playerState === PLAYER_STATE.ELIMINATED) {
      router.replace('/eliminated');
    } else if (playerState === PLAYER_STATE.WINNER) {
      router.replace('/winner');
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

  return (
    <View style={styles.container}>
      <Header />
      <View style={styles.content}>
        <Text weight="bold" style={styles.title}>
          {contest?.name ?? 'Contest'}
        </Text>
        <Text style={styles.subtitle}>{`Round ${contest?.current_round ?? '?'}`}</Text>
        <Text weight="medium" style={styles.state}>
          State: {playerState}
        </Text>

        <Card>
          <Text weight="bold" style={styles.question}>
            {question?.question ?? 'Waiting for question…'}
          </Text>
          {options.map((option) => (
            <AnswerOption
              key={option.key}
              label={option.label}
              selected={answer?.answer === option.key}
              disabled={playerState !== PLAYER_STATE.ANSWERING}
              onPress={() => handleSubmit(option.key)}
            />
          ))}
        </Card>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND,
    paddingTop: HEADER_HEIGHT + SPACING.MD,
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
  title: {
    fontSize: TYPOGRAPHY.TITLE,
  },
  subtitle: {
    fontSize: TYPOGRAPHY.BODY,
    marginBottom: SPACING.XS,
  },
  state: {
    marginBottom: SPACING.SM,
  },
  question: {
    fontSize: TYPOGRAPHY.SUBTITLE,
    marginBottom: SPACING.SM,
  },
  spacer: {
    height: SPACING.SM,
  },
});

export default GameScreen;
