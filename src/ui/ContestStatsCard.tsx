import React from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import { StyleSheet, View } from 'react-native';
import DollarSignIcon from '../../assets/icons/DollarSignIcon.svg';
import LeaderboardIcon from '../../assets/icons/leaderboard.svg';
import PersonIcon from '../../assets/icons/person.svg';
import Text from './Text';
import { COLORS, RADIUS, SPACING, TYPOGRAPHY } from './theme';

type ContestStatsCardProps = {
  numberOfRemainingPlayers: number;
  roundNumber: number;
  style?: StyleProp<ViewStyle>;
};

const ICON_SIZE = 18;

const ContestStatsCard = ({
  numberOfRemainingPlayers,
  roundNumber,
  style,
}: ContestStatsCardProps) => {
  const chanceOfWinning =
    numberOfRemainingPlayers > 0 ? ((1 / numberOfRemainingPlayers) * 100).toFixed(2) : '0.00';

  return (
    <View style={[styles.statsSummary, style]}>
      <View style={styles.statItem}>
        <PersonIcon width={ICON_SIZE} height={ICON_SIZE} />
        <Text style={styles.text}>{numberOfRemainingPlayers} players remaining</Text>
      </View>
      <View style={styles.statItem}>
        <LeaderboardIcon width={ICON_SIZE} height={ICON_SIZE} />
        <Text style={styles.text}>Round {roundNumber}</Text>
      </View>
      <View style={styles.statItem}>
        <DollarSignIcon width={ICON_SIZE} height={ICON_SIZE} />
        <Text style={styles.text}>{chanceOfWinning}% Chance of Winning</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  statsSummary: {
    width: '100%',
    borderRadius: RADIUS.MD,
    borderWidth: 1,
    borderColor: COLORS.BORDER,
    backgroundColor: COLORS.SURFACE,
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
    color: COLORS.TEXT,
  },
});

export default ContestStatsCard;
