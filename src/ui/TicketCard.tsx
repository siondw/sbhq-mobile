import { LinearGradient } from 'expo-linear-gradient';
import React, { useMemo } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { RADIUS, SPACING } from './theme';
import { useTheme } from './themeContext';

type TicketCardProps = {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  backgroundColor?: string;
};

const TicketCard = ({ children, style, backgroundColor }: TicketCardProps) => {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={[styles.wrap, style]}>
      <LinearGradient
        colors={['rgba(255,255,255,0.08)', 'rgba(255,255,255,0)', 'rgba(255,255,255,0)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />

      <LinearGradient
        colors={[withAlpha(colors.energy, 0.1), withAlpha(colors.ink, 0.03), 'rgba(255,255,255,0)'] as const}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.tint}
        pointerEvents="none"
      />

      <View style={styles.texture} pointerEvents="none">
        {Array.from({ length: 10 }, (_, idx) => (
          <View
            // eslint-disable-next-line react/no-array-index-key
            key={idx}
            style={[styles.textureLine, { top: idx * 18, backgroundColor: withAlpha(colors.ink, 0.05) }]}
          />
        ))}
      </View>

      <View style={[styles.cutoutLeft, { backgroundColor: backgroundColor ?? colors.background }]} pointerEvents="none" />
      <View style={[styles.cutoutRight, { backgroundColor: backgroundColor ?? colors.background }]} pointerEvents="none" />
      <View style={styles.perforation} pointerEvents="none" />

      <View style={styles.content}>{children}</View>
    </View>
  );
};

function withAlpha(hex: string, alpha: number): string {
  const normalized = hex.replace('#', '');
  if (normalized.length !== 6) return `rgba(0,0,0,${alpha})`;
  const r = parseInt(normalized.slice(0, 2), 16);
  const g = parseInt(normalized.slice(2, 4), 16);
  const b = parseInt(normalized.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

function createStyles(colors: { surface: string; border: string; ink: string }) {
  return StyleSheet.create({
    wrap: {
      width: '100%',
      borderRadius: RADIUS.LG,
      backgroundColor: colors.surface,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: colors.border,
    },
    tint: {
      ...StyleSheet.absoluteFillObject,
    },
    texture: {
      ...StyleSheet.absoluteFillObject,
      opacity: 0.12,
    },
    textureLine: {
      position: 'absolute',
      left: -40,
      right: -40,
      height: 10,
      transform: [{ rotate: '-16deg' }],
    },
    cutoutLeft: {
      position: 'absolute',
      left: -10,
      top: 74,
      width: 20,
      height: 20,
      borderRadius: 10,
    },
    cutoutRight: {
      position: 'absolute',
      right: -10,
      top: 74,
      width: 20,
      height: 20,
      borderRadius: 10,
    },
    perforation: {
      position: 'absolute',
      left: 14,
      right: 14,
      top: 84,
      borderTopWidth: 1,
      borderTopColor: withAlpha(colors.ink, 0.16),
      borderStyle: 'dashed',
    },
    content: {
      padding: SPACING.LG,
    },
  });
}

export default TicketCard;
