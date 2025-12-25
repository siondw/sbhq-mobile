import React from 'react';
import { StyleSheet, View } from 'react-native';
import Card from './Card';
import Text from './Text';
import { COLORS, SPACING, TYPOGRAPHY } from './theme';

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

const styles = StyleSheet.create({
  card: {
    gap: SPACING.XS,
  },
  header: {
    fontSize: TYPOGRAPHY.SUBTITLE,
  },
  roundLabel: {
    fontSize: TYPOGRAPHY.SMALL,
    color: COLORS.MUTED,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  row: {
    gap: SPACING.XS,
  },
  label: {
    fontSize: TYPOGRAPHY.SMALL,
    color: COLORS.MUTED,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  value: {
    fontSize: TYPOGRAPHY.BODY,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.BORDER,
    marginVertical: SPACING.XS,
  },
});

export default AnswerSummaryCard;
