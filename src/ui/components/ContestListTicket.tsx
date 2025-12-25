import React, { useMemo } from 'react';
import { Animated, StyleSheet, View } from 'react-native';

import { usePulseAnimation } from '../animations';
import { RADIUS, SPACING, TYPOGRAPHY, useTheme, withAlpha } from '../theme';
import { GlassyTexture } from '../textures';
import Button from './Button';
import Text from './Text';
import TicketCard from './TicketCard';

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

  // Pulse animation for live indicator dot
  const { opacity: dotOpacity, scale: dotScale } = usePulseAnimation(900);

  return (
    <TicketCard
      style={[styles.card, dimmed && styles.dimmed]}
      backgroundColor={cutoutBackgroundColor ?? colors.background}
    >
      <View style={styles.cardHeader}>
        <Text weight="bold" style={styles.cardTitle}>
          {title}
        </Text>
        {live ? (
          <View style={styles.liveIndicator}>
            <Animated.View
              style={[
                styles.liveDot,
                {
                  opacity: dotOpacity,
                  transform: [{ scale: dotScale }],
                },
              ]}
            />
            <Text weight="medium" style={styles.liveText}>
              LIVE
            </Text>
          </View>
        ) : null}
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
    </TicketCard>
  );
};

function createStyles(colors: { muted: string; danger: string }) {
  return StyleSheet.create({
    card: {
      gap: SPACING.XS,
    },
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
    liveIndicator: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingVertical: 4,
      paddingHorizontal: SPACING.SM,
      borderRadius: RADIUS.SM,
      backgroundColor: withAlpha(colors.danger, 0.14),
      borderWidth: 1,
      borderColor: withAlpha(colors.danger, 0.35),
    },
    liveDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: colors.danger,
    },
    liveText: {
      fontSize: TYPOGRAPHY.SMALL,
      color: colors.danger,
      letterSpacing: 0.5,
      fontWeight: '600',
    },
  });
}

export default ContestListTicket;
