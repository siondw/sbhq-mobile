import React, { useMemo } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import { StyleSheet, View } from 'react-native';

import { Ionicons } from '@expo/vector-icons';
import { RADIUS, SPACING, TYPOGRAPHY, useTheme } from '../theme';
import Text from './Text';

type ContestStatsCardProps = {
  numberOfRemainingPlayers: number;
  roundNumber: number;
  style?: StyleProp<ViewStyle>;
  variant?: 'success' | 'eliminated';
};

const ICON_SIZE = 18;

const ContestStatsCard = ({
  numberOfRemainingPlayers,
  roundNumber,
  style,
  variant = 'success',
}: ContestStatsCardProps) => {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const chanceOfWinning =
    numberOfRemainingPlayers > 0 ? ((1 / numberOfRemainingPlayers) * 100).toFixed(2) : '0.00';

  const isEliminated = variant === 'eliminated';
  const iconColor = isEliminated ? colors.danger : colors.success;

  return (
    <View style={[styles.statsSummary, style]}>
      <View style={styles.statItem}>
        <Ionicons name="people" size={ICON_SIZE} color={iconColor} />
        <Text style={styles.text}>{numberOfRemainingPlayers} players remaining</Text>
      </View>
      <View style={styles.statItem}>
        <Ionicons name="stats-chart" size={ICON_SIZE} color={iconColor} />
        <Text style={styles.text}>
          {isEliminated ? `Eliminated in Round ${roundNumber}` : `Round ${roundNumber}`}
        </Text>
      </View>
      {isEliminated && (
        <View style={styles.statItem}>
          <Ionicons name="close-circle" size={ICON_SIZE} color={colors.danger} />
          <Text style={styles.text}>0% Chance of Winning</Text>
        </View>
      )}
      {!isEliminated && (
        <View style={styles.statItem}>
          <Ionicons name="logo-usd" size={ICON_SIZE} color={colors.energy} />
          <Text style={styles.text}>{chanceOfWinning}% Chance of Winning</Text>
        </View>
      )}
    </View>
  );
};

function createStyles(colors: {
  border: string;
  surface: string;
  text: string;
  danger: string;
  success: string;
}) {
  return StyleSheet.create({
    statsSummary: {
      width: '100%',
      borderRadius: RADIUS.MD,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
      padding: SPACING.MD,
      gap: SPACING.SM,
    },
    statItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: SPACING.SM,
    },
    text: {
      fontSize: TYPOGRAPHY.BODY,
      color: colors.text,
    },
  });
}

export default ContestStatsCard;
