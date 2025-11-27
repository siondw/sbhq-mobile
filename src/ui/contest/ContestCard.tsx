import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import type { ContestRow } from '../../db/types';
import Card from '../primitives/Card';
import Text from '../primitives/Text';
import Button from '../primitives/Button';
import { COLORS, RADIUS, SPACING, TYPOGRAPHY } from '../theme';

interface ContestCardProps {
  contest: ContestRow;
  onPress: () => void;
}

const formatStartTime = (timestamp: string) =>
  new Date(timestamp).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });

const ContestCard = ({ contest, onPress }: ContestCardProps) => {
  const startTime = formatStartTime(contest.start_time);

  const status = useMemo(() => {
    if (contest.finished) {
      return {
        label: 'Completed',
        pillStyle: styles.pillMuted,
        pillTextStyle: styles.pillMutedText,
        cta: 'View results',
      };
    }

    if (contest.lobby_open) {
      return {
        label: 'Lobby open',
        pillStyle: styles.pillPrimary,
        pillTextStyle: undefined,
        cta: 'Enter lobby',
      };
    }

    if (contest.submission_open) {
      return {
        label: 'In progress',
        pillStyle: styles.pillAccent,
        pillTextStyle: undefined,
        cta: 'Rejoin contest',
      };
    }

    return {
      label: 'Starting soon',
      pillStyle: styles.pillMuted,
      pillTextStyle: styles.pillMutedText,
      cta: 'Join contest',
    };
  }, [contest.finished, contest.lobby_open, contest.submission_open]);

  return (
    <Card style={styles.card}>
      <Text weight="bold" style={styles.title}>
        {contest.name}
      </Text>

      <Text style={styles.startLabel}>Start time</Text>
      <Text weight="medium" style={styles.startValue}>
        {startTime}
      </Text>

      <View style={styles.statusRow}>
        <View style={[styles.pill, status.pillStyle]}>
          <Text weight="medium" style={[styles.pillText, status.pillTextStyle]}>
            {status.label}
          </Text>
        </View>
        {contest.price ? (
          <Text weight="bold" style={styles.price}>
            ${contest.price}
          </Text>
        ) : null}
      </View>

      <View style={styles.buttonWrapper}>
        <Button label={status.cta} onPress={onPress} />
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    paddingHorizontal: SPACING.LG,
    paddingVertical: SPACING.LG,
    borderRadius: RADIUS.LG,
  },
  title: {
    fontSize: TYPOGRAPHY.SUBTITLE + 2,
    color: '#675A4A',
    marginBottom: SPACING.SM,
  },
  startLabel: {
    fontSize: TYPOGRAPHY.SMALL,
    color: COLORS.MUTED,
    marginBottom: 4,
  },
  startValue: {
    fontSize: TYPOGRAPHY.BODY + 1,
    color: COLORS.TEXT,
    marginBottom: SPACING.SM,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: SPACING.XS,
  },
  pill: {
    paddingHorizontal: SPACING.MD,
    paddingVertical: SPACING.XS,
    borderRadius: RADIUS.MD,
    backgroundColor: '#E7F0E8',
  },
  pillPrimary: {
    backgroundColor: 'rgba(86, 124, 106, 0.14)',
  },
  pillAccent: {
    backgroundColor: 'rgba(224, 138, 92, 0.16)',
  },
  pillMuted: {
    backgroundColor: '#ECE4D9',
  },
  pillText: {
    color: COLORS.PRIMARY_DARK,
    fontSize: TYPOGRAPHY.SMALL,
  },
  pillMutedText: {
    color: '#5B5146',
  },
  price: {
    color: COLORS.PRIMARY_DARK,
    fontSize: TYPOGRAPHY.BODY,
  },
  buttonWrapper: {
    marginTop: SPACING.MD,
  },
});

export default ContestCard;
