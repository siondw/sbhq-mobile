import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';

import { type AnswerOptionValue } from '../configs/constants';
import { heavyImpact } from '../utils/haptics';
import { ROUTES } from '../configs/routes';
import { CONTEST_STATE, PLAYER_STATE } from '../logic/constants';
import { ContestRouter } from '../logic/routing/ContestRouter';
import { useContestData } from '../logic/contexts';
import { useAuth } from '../logic/hooks/useAuth';
import { useHeaderHeight } from '../logic/hooks/useHeaderHeight';
import { useParticipantCount } from '../logic/hooks/useParticipantCount';
import { useRefresh } from '../logic/hooks/utils';
import AnswerOption from '../ui/components/AnswerOption';
import Header from '../ui/components/AppHeader';
import Button from '../ui/components/Button';
import LoadingView from '../ui/components/LoadingView';
import Scorebug from '../ui/components/Scorebug';
import SpectatorBanner from '../ui/components/SpectatorBanner';
import Text from '../ui/components/Text';
import { SPACING, TYPOGRAPHY, useTheme, withAlpha } from '../ui/theme';
import { isAnswerOptionValue, normalizeQuestionOptions } from '../utils/questionOptions';

const GameScreen = () => {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const router = useRouter();
  const { spectating } = useLocalSearchParams<{ spectating?: string }>();
  const isSpectating = spectating === 'true';
  const { derivedUser } = useAuth();
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

  const { refreshing, onRefresh } = useRefresh([refresh]);

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
    heavyImpact();
    void submit({
      participantId: participant.id,
      contestId: contest.id,
      questionId: question.id,
      round: question.round,
      answer: selectedOption,
    });
  };

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

  const isAnswerLocked = playerState !== PLAYER_STATE.ANSWERING || !!answer || isSpectating;

  return (
    <ContestRouter
      contestId={contestId}
      playerState={playerState}
      loading={loading}
      validState={PLAYER_STATE.ANSWERING}
      contestState={contest?.state ?? null}
      validContestStates={[CONTEST_STATE.ROUND_IN_PROGRESS]}
      isSpectating={isSpectating}
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
            {isSpectating && (
              <View style={styles.bannerRow}>
                <SpectatorBanner onLeave={() => router.replace(ROUTES.CONTESTS)} />
              </View>
            )}
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

            {!isSpectating && (
              <View style={styles.submitRow}>
                <Button
                  label="Submit"
                  onPress={handleSubmit}
                  disabled={isAnswerLocked || !selectedOption}
                />
              </View>
            )}
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
    bannerRow: {
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
