import React from 'react';
import { StyleSheet, View } from 'react-native';

import { GlassyTexture } from '../textures';
import { RADIUS, SPACING, TYPOGRAPHY, useTheme, withAlpha } from '../theme';
import LiveIndicator from './LiveIndicator';
import Text from './Text';

interface ScorebugProps {
  playerCount: number;
}

const Scorebug = ({ playerCount }: ScorebugProps) => {
  const { colors } = useTheme();

  const containerStyle = {
    ...styles.container,
    backgroundColor: withAlpha(colors.surface, 0.6),
  };

  return (
    <GlassyTexture colors={colors} style={containerStyle}>
      <LiveIndicator />

      <View style={styles.divider} />

      <View style={styles.playersSection}>
        <Text weight="medium" style={[styles.playerCount, { color: colors.ink }]}>
          {playerCount}
        </Text>
        <Text weight="medium" style={[styles.playerLabel, { color: colors.muted }]}>
          remaining
        </Text>
      </View>
    </GlassyTexture>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.XS,
    paddingHorizontal: SPACING.SM,
    borderRadius: RADIUS.MD,
    gap: SPACING.SM,
    alignSelf: 'center',
  },
  divider: {
    width: 1,
    height: 12,
    backgroundColor: '#00000015',
  },
  playersSection: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  playerCount: {
    fontSize: TYPOGRAPHY.BODY,
  },
  playerLabel: {
    fontSize: TYPOGRAPHY.SMALL - 1,
  },
});

export default Scorebug;
