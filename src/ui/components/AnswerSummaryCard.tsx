import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

import { SPACING, TYPOGRAPHY, useTheme } from '../theme';
import Card from './Card';
import Text from './Text';

type AnswerSummaryCardProps = {
  header?: string;
  roundLabel?: string;
  question: string;
  selectedAnswer: string;
  correctAnswer?: string | null;
};

const AnswerSummaryCard = ({
  header,
  roundLabel,
  question,
  selectedAnswer,
  correctAnswer,
}: AnswerSummaryCardProps) => {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <Card style={styles.card}>
      {header ? (
        <Text weight="bold" style={styles.header}>
          {header}
        </Text>
      ) : null}
      {roundLabel ? (
        <Text weight="medium" style={styles.roundLabel}>
          {roundLabel}
        </Text>
      ) : null}
      <View style={styles.row}>
        <Text weight="medium" style={styles.label}>
          Question
        </Text>
        <Text style={styles.value}>{question}</Text>
      </View>
      <View style={styles.divider} />
      <View style={styles.row}>
        <Text weight="medium" style={styles.label}>
          Your Answer
        </Text>
        <Text style={styles.value}>{selectedAnswer}</Text>
      </View>
      {typeof correctAnswer !== 'undefined' ? (
        <>
          <View style={styles.divider} />
          <View style={styles.row}>
            <Text weight="medium" style={styles.label}>
              Correct Answer
            </Text>
            <Text style={styles.value}>{correctAnswer ?? 'Pending'}</Text>
          </View>
        </>
      ) : null}
    </Card>
  );
};

function createStyles(colors: { muted: string; border: string }) {
  return StyleSheet.create({
    card: {
      gap: SPACING.XS,
    },
    header: {
      fontSize: TYPOGRAPHY.SUBTITLE,
    },
    roundLabel: {
      fontSize: TYPOGRAPHY.SMALL,
      color: colors.muted,
      textTransform: 'uppercase',
      letterSpacing: 0.4,
    },
    row: {
      gap: SPACING.XS,
    },
    label: {
      fontSize: TYPOGRAPHY.SMALL,
      color: colors.muted,
      textTransform: 'uppercase',
      letterSpacing: 0.4,
    },
    value: {
      fontSize: TYPOGRAPHY.BODY,
    },
    divider: {
      height: 1,
      backgroundColor: colors.border,
      marginVertical: SPACING.XS,
    },
  });
}

export default AnswerSummaryCard;
