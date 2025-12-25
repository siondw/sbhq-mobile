import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useMemo } from 'react';
import { ActivityIndicator, Image, StyleSheet, View } from 'react-native';

import { ROUTES } from '../configs/routes';
import { useAuth } from '../logic/hooks/useAuth';
import { PLAYER_STATE } from '../logic/constants';
import { useContestState } from '../logic/hooks/useContestState';
import { useHeaderHeight } from '../logic/hooks/useHeaderHeight';
import { resolveOptionLabel } from '../utils/questionOptions';
import { debugRoute } from '../utils/debug';
import Button from '../ui/Button';
import AnswerSummaryCard from '../ui/AnswerSummaryCard';
import Text from '../ui/Text';
import { COLORS, SPACING, TYPOGRAPHY } from '../ui/theme';
import Header from '../ui/AppHeader';
import ballGif from '../../assets/gifs/ball.gif';

const SubmittedScreen = () => {
  const { contestId } = useLocalSearchParams<{ contestId?: string }>();
  const router = useRouter();
  const { derivedUser } = useAuth();
  const headerHeight = useHeaderHeight();
  const { loading, error, playerState, refresh, question, answer } = useContestState(
    contestId,
    derivedUser?.id,
  );

  useEffect(() => {
    debugRoute('SubmittedScreen', {
      contestId,
      loading,
      playerState,
      answer: answer?.answer,
      correctOption: question?.correct_option,
      questionId: question?.id,
    });
  }, [contestId, loading, playerState, answer?.answer, question?.correct_option, question?.id]);

  useEffect(() => {
    if (!contestId || loading || playerState === PLAYER_STATE.UNKNOWN) return;

    if (playerState === PLAYER_STATE.ANSWERING) {
      router.replace(`/contest/${contestId}`);
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

  const selectedAnswerLabel = useMemo(() => {
    const resolved = resolveOptionLabel(question?.options, answer?.answer);
    return resolved ?? 'Awaiting selection';
  }, [question?.options, answer?.answer]);

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
        <Text weight="bold" style={styles.title}>
          Submitted
        </Text>
        <Text style={styles.body}>You are locked in. Waiting for the result...</Text>

        <AnswerSummaryCard
          question={question?.question ?? 'Waiting for the next update'}
          selectedAnswer={selectedAnswerLabel}
        />

        <Image source={ballGif} style={styles.submittedGif} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND,
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
  title: {
    fontSize: TYPOGRAPHY.TITLE,
  },
  body: {
    fontSize: TYPOGRAPHY.BODY,
  },
  submittedGif: {
    width: 240,
    height: 240,
    alignSelf: 'center',
  },
  spacer: {
    height: SPACING.SM,
  },
});

export default SubmittedScreen;
