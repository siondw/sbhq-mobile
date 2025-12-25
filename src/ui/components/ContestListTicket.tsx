import { LinearGradient } from 'expo-linear-gradient';
import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

import { GlassyTexture } from '../textures';
import { RADIUS, SPACING, TYPOGRAPHY, useTheme, withAlpha } from '../theme';
import Button from './Button';
import LiveIndicator from './LiveIndicator';
import Text from './Text';

type ContestListTicketProps = {
  title: string;
  startLabel: string;
  priceLabel: string;
  roundLabel?: string | null;
  live?: boolean;
  dimmed?: boolean;
  cutoutBackgroundColor?: string;
  buttonLabel: string;
  buttonVariant?: 'primary' | 'secondary' | 'success';
  buttonDisabled?: boolean;
  buttonIconRight?: React.ReactNode;
  onPress: () => void;
};

const ContestListTicket = ({
  title,
  startLabel,
  priceLabel,
  roundLabel,
  live,
  dimmed,
  cutoutBackgroundColor,
  buttonLabel,
  buttonVariant = 'primary',
  buttonDisabled,
  buttonIconRight,
  onPress,
}: ContestListTicketProps) => {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={[styles.ticketWrap, styles.card, dimmed && styles.dimmed]}>
      <LinearGradient
        colors={['rgba(255,255,255,0.08)', 'rgba(255,255,255,0)', 'rgba(255,255,255,0)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />

      <LinearGradient
        colors={
          [
            withAlpha(colors.energy, 0.1),
            withAlpha(colors.ink, 0.03),
            'rgba(255,255,255,0)',
          ] as const
        }
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.tint}
        pointerEvents="none"
      />

      <View style={styles.texture} pointerEvents="none">
        {Array.from({ length: 10 }, (_, idx) => (
          <View
            key={idx}
            style={[
              styles.textureLine,
              { top: idx * 18, backgroundColor: withAlpha(colors.ink, 0.05) },
            ]}
          />
        ))}
      </View>

      <View
        style={[
          styles.cutoutLeft,
          { backgroundColor: cutoutBackgroundColor ?? colors.background },
        ]}
        pointerEvents="none"
      />
      <View
        style={[
          styles.cutoutRight,
          { backgroundColor: cutoutBackgroundColor ?? colors.background },
        ]}
        pointerEvents="none"
      />
      <View style={styles.perforation} pointerEvents="none" />

      <View style={styles.content}>
        <View style={styles.cardHeader}>
          <Text weight="bold" style={styles.cardTitle}>
            {title}
          </Text>
          {live ? <LiveIndicator size="large" /> : null}
        </View>

        <Text style={styles.meta}>Start: {startLabel}</Text>
        <Text style={styles.meta}>Entry: {priceLabel}</Text>
        {roundLabel ? <Text style={styles.meta}>Round: {roundLabel}</Text> : null}

        <View style={styles.cardFooter}>
          <GlassyTexture
            colors={{ energy: colors.energy, warm: colors.warm, ink: colors.ink }}
            shinePreset="SUBTLE"
            style={styles.buttonWrapper}
          >
            <Button
              label={buttonLabel}
              variant={buttonVariant === 'secondary' ? 'secondary' : buttonVariant}
              iconRight={buttonIconRight}
              onPress={onPress}
              disabled={buttonDisabled}
            />
          </GlassyTexture>
        </View>
      </View>
    </View>
  );
};

function createStyles(colors: { muted: string; danger: string; surface: string; border: string; ink: string; background: string }) {
  return StyleSheet.create({
    ticketWrap: {
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
      gap: SPACING.XS,
    },
    card: {},
    dimmed: {
      opacity: 0.6,
    },
    cardTitle: {
      fontSize: TYPOGRAPHY.SUBTITLE,
    },
    cardHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: SPACING.SM,
    },
    meta: {
      fontSize: TYPOGRAPHY.BODY,
      color: colors.muted,
    },
    cardFooter: {
      marginTop: SPACING.SM,
    },
    buttonWrapper: {
      borderRadius: RADIUS.MD,
    },
  });
}

export default ContestListTicket;
