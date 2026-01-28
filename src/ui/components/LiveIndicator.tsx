import React from 'react';
import { Animated, StyleSheet, View } from 'react-native';

import { usePulseAnimation } from '../animations';
import { RADIUS, SPACING, TYPOGRAPHY, useTheme, withAlpha } from '../theme';
import Text from './Text';

interface LiveIndicatorProps {
  size?: 'small' | 'medium' | 'large';
  showLabel?: boolean;
  showContainer?: boolean;
  variant?: 'primary' | 'energy' | 'danger' | 'success';
}

const LiveIndicator = ({
  size = 'medium',
  showLabel = true,
  showContainer = false,
  variant = 'primary',
}: LiveIndicatorProps) => {
  const { colors } = useTheme();
  const { opacity } = usePulseAnimation(900);

  const dotSize = size === 'small' ? 5 : size === 'medium' ? 6 : 8;
  const fontSize =
    size === 'small'
      ? TYPOGRAPHY.SMALL - 2
      : size === 'medium'
        ? TYPOGRAPHY.SMALL - 1
        : TYPOGRAPHY.SMALL;
  const gap = size === 'small' ? SPACING.XS - 3 : size === 'medium' ? SPACING.XS - 2 : SPACING.XS;

  const color =
    variant === 'danger'
      ? colors.danger
      : variant === 'energy'
        ? colors.energy
        : variant === 'success'
          ? colors.success
          : colors.primary;

  const content = (
    <View style={[styles.content, { gap }]}>
      <Animated.View
        style={[
          styles.dot,
          {
            width: dotSize,
            height: dotSize,
            borderRadius: dotSize / 2,
            backgroundColor: color,
            opacity,
          },
        ]}
      />
      {showLabel && (
        <Text weight="bold" style={[styles.label, { color, fontSize }]}>
          LIVE
        </Text>
      )}
    </View>
  );

  if (showContainer) {
    return (
      <View
        style={[
          styles.container,
          {
            backgroundColor: withAlpha(color, 0.14),
            borderColor: withAlpha(color, 0.35),
          },
        ]}
      >
        {content}
      </View>
    );
  }

  return content;
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: SPACING.SM,
    borderRadius: RADIUS.SM,
    borderWidth: 1,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dot: {},
  label: {
    letterSpacing: 0.5,
  },
});

export default LiveIndicator;
