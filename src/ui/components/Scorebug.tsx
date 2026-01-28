import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';

import { GlassyTexture } from '../textures';
import { RADIUS, SPACING, TYPOGRAPHY, useTheme, withAlpha } from '../theme';
import LiveIndicator from './LiveIndicator';
import Text from './Text';

interface ScorebugProps {
  playerCount: number;
  statusLabel?: string;
  statusVariant?: 'quiet' | 'dot' | 'chip' | 'outline' | 'glow';
  statusAccentColor?: string;
}

const Scorebug = ({
  playerCount,
  statusLabel,
  statusVariant = 'quiet',
  statusAccentColor,
}: ScorebugProps) => {
  const { colors } = useTheme();
  const accentColor = statusAccentColor ?? colors.primary;
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (statusVariant !== 'glow') {
      pulse.setValue(1);
      return undefined;
    }

    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 0.4,
          duration: 900,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 1,
          duration: 900,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
      { resetBeforeIteration: true },
    );

    loop.start();
    return () => loop.stop();
  }, [pulse, statusVariant]);

  const statusTextColor =
    statusVariant === 'quiet' ? withAlpha(colors.ink, 0.6) : accentColor;
  const statusContainerStyle = [
    styles.statusWrap,
    statusVariant === 'chip' && {
      backgroundColor: withAlpha(accentColor, 0.16),
      borderWidth: 1,
      borderColor: withAlpha(accentColor, 0.4),
      paddingHorizontal: SPACING.XS,
      paddingVertical: 2,
      borderRadius: 999,
    },
    statusVariant === 'outline' && {
      borderWidth: 1,
      borderColor: withAlpha(accentColor, 0.5),
      paddingHorizontal: SPACING.XS,
      paddingVertical: 2,
      borderRadius: 999,
    },
    statusVariant === 'glow' && {
      backgroundColor: withAlpha(accentColor, 0.12),
      paddingHorizontal: SPACING.XS,
      paddingVertical: 2,
      borderRadius: RADIUS.SM,
    },
  ];
  const StatusContainer = statusVariant === 'glow' ? Animated.View : View;

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

      {statusLabel ? (
        <>
          <View style={styles.divider} />
          <StatusContainer
            style={[statusContainerStyle, statusVariant === 'glow' ? { opacity: pulse } : null]}
          >
            {statusVariant === 'dot' ? (
              <View style={[styles.statusDot, { backgroundColor: accentColor }]} />
            ) : null}
            <Text
              weight="medium"
              style={[
                styles.statusText,
                { color: statusTextColor },
                statusVariant === 'glow' && {
                  textShadowColor: withAlpha(accentColor, 0.75),
                  textShadowOffset: { width: 0, height: 0 },
                  textShadowRadius: 6,
                },
              ]}
            >
              {statusLabel}
            </Text>
          </StatusContainer>
        </>
      ) : null}
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
  statusWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusText: {
    fontSize: TYPOGRAPHY.SMALL - 1,
    letterSpacing: 0.3,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
});

export default Scorebug;
