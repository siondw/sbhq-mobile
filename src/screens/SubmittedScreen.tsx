import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useMemo } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { ROUTES } from '../configs/routes';
import { CONTEST_STATE, PLAYER_STATE } from '../logic/constants';
import { useAnswerDistribution } from '../logic/hooks/useAnswerDistribution';
import { useAuth } from '../logic/hooks/useAuth';
import { useContestState } from '../logic/hooks/useContestState';
import { useHeaderHeight } from '../logic/hooks/useHeaderHeight';
import { useParticipantCount } from '../logic/hooks/useParticipantCount';
import AnswerDistributionChart from '../ui/components/AnswerDistributionChart';
import Header from '../ui/components/AppHeader';
import Button from '../ui/components/Button';
import Scorebug from '../ui/components/Scorebug';
import Text from '../ui/components/Text';
import { GlassyTexture } from '../ui/textures';
import { RADIUS, SPACING, TYPOGRAPHY, useTheme, withAlpha } from '../ui/theme';
import { normalizeQuestionOptions } from '../utils/questionOptions';

const SubmittedScreen = () => {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { contestId } = useLocalSearchParams<{ contestId?: string }>();
  const router = useRouter();
  const { derivedUser } = useAuth();
  const headerHeight = useHeaderHeight();
  const { loading, error, playerState, refresh, question, answer, contest } = useContestState(
    contestId,
    derivedUser?.id,
  );

  const { count: participantCount } = useParticipantCount(contestId);

  const roundToFetch =
    contest?.state === CONTEST_STATE.ROUND_CLOSED && contest.current_round !== null
      ? contest.current_round
      : undefined;

  const { distribution } = useAnswerDistribution(contestId, roundToFetch);

  useEffect(() => {}, [contest?.state, distribution.length]);

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

  const options = useMemo(() => normalizeQuestionOptions(question?.options), [question?.options]);

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
        <View style={styles.scorebugSection}>
          <Scorebug playerCount={participantCount} />
        </View>
        <View style={styles.statusSection}>
          <Text weight="bold" style={styles.title}>
            Answer Locked In
          </Text>
          <Text style={styles.subtitle}>Waiting for the round to end...</Text>
        </View>

        <GlassyTexture colors={colors} showShine={false} style={styles.questionCard}>
          <View style={styles.questionSection}>
            <Text weight="medium" style={[styles.questionLabel, { color: colors.muted }]}>
              Question
            </Text>
            <Text weight="bold" style={[styles.questionText, { color: colors.ink }]}>
              {question?.question ?? 'Waiting for the next update'}
            </Text>
          </View>

          <View style={[styles.divider, { backgroundColor: withAlpha(colors.ink, 0.1) }]} />

          <View style={styles.optionsGrid}>
            {options.map((option, index) => {
              const isSelected = option.key === answer?.answer;
              return (
                <React.Fragment key={option.key}>
                  {index > 0 && (
                    <View
                      style={[
                        styles.verticalDivider,
                        { backgroundColor: withAlpha(colors.ink, 0.1) },
                      ]}
                    />
                  )}
                  <View
                    style={[
                      styles.optionItem,
                      isSelected && {
                        backgroundColor: withAlpha(colors.primary, 0.1),
                      },
                    ]}
                  >
                    <Text
                      weight="bold"
                      style={[
                        styles.optionKey,
                        { color: isSelected ? colors.primary : colors.muted },
                      ]}
                    >
                      {option.key}
                    </Text>
                    <Text
                      weight="medium"
                      style={[
                        styles.optionLabel,
                        { color: isSelected ? colors.ink : colors.muted },
                      ]}
                    >
                      {option.label}
                    </Text>
                  </View>
                </React.Fragment>
              );
            })}
          </View>
        </GlassyTexture>

        {contest?.state === CONTEST_STATE.ROUND_CLOSED && distribution.length > 0 && (
          <View style={styles.chartSection}>
            <AnswerDistributionChart
              distribution={distribution.map((d) => ({
                option: d.answer,
                label: options.find((o) => o.key === d.answer)?.label ?? d.answer,
                count: d.count,
              }))}
              correctAnswer={null}
              userAnswer={answer?.answer ?? null}
            />
          </View>
        )}
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
    },
    center: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      padding: SPACING.LG,
    },
    scorebugSection: {
      marginBottom: SPACING.XL * 3,
    },
    statusSection: {
      alignItems: 'center',
      marginBottom: SPACING.MD,
    },
    title: {
      fontSize: TYPOGRAPHY.TITLE,
      color: colors.ink,
      marginBottom: SPACING.XS,
    },
    subtitle: {
      fontSize: TYPOGRAPHY.BODY,
      color: colors.muted,
      textAlign: 'center',
    },
    questionCard: {
      borderRadius: RADIUS.LG,
      overflow: 'hidden',
    },
    questionSection: {
      padding: SPACING.MD,
      gap: SPACING.XS,
    },
    questionLabel: {
      fontSize: TYPOGRAPHY.SMALL,
      textTransform: 'uppercase',
      letterSpacing: 1,
    },
    questionText: {
      fontSize: TYPOGRAPHY.BODY,
      lineHeight: 20,
    },
    divider: {
      height: 1,
    },
    optionsGrid: {
      flexDirection: 'row',
    },
    verticalDivider: {
      width: 1,
    },
    optionItem: {
      flex: 1,
      padding: SPACING.SM,
      alignItems: 'center',
      gap: SPACING.XS,
    },
    optionKey: {
      fontSize: TYPOGRAPHY.SUBTITLE,
    },
    optionLabel: {
      fontSize: TYPOGRAPHY.SMALL - 1,
      textAlign: 'center',
    },
    chartSection: {
      marginTop: SPACING.MD,
    },
    spacer: {
      height: SPACING.SM,
    },
  });

export default SubmittedScreen;
