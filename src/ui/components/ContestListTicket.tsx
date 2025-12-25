import { LinearGradient } from 'expo-linear-gradient';
import React, { useMemo } from 'react';
import { Animated, StyleSheet, View } from 'react-native';

import { usePulseAnimation, useShineAnimation } from '../animations';
import { RADIUS, SPACING, TYPOGRAPHY, useTheme, withAlpha } from '../theme';
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
  onPress,
}: ContestListTicketProps) => {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  // Pulse animation for live indicator dot
  const { opacity: dotOpacity, scale: dotScale } = usePulseAnimation(900);

  const { translateX: shineTranslateX, config } = useShineAnimation({ preset: 'SUBTLE' });

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
        <View style={styles.buttonWrapper}>
          <Button
            label={buttonLabel}
            variant={buttonVariant === 'secondary' ? 'secondary' : buttonVariant}
            onPress={onPress}
            disabled={buttonDisabled}
          />
          <LinearGradient
            colors={[
              withAlpha(colors.energy, 0.25),
              withAlpha(colors.warm, 0.15),
              withAlpha(colors.ink, 0.1),
              'rgba(0,0,0,0.08)',
            ]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.gradientOverlay}
            pointerEvents="none"
          />
          <Animated.View
            style={[
              styles.shineContainer,
              {
                opacity: config.containerOpacity,
                transform: [{ translateX: shineTranslateX }, { rotate: '35deg' }],
              },
            ]}
            pointerEvents="none"
          >
            <LinearGradient
              colors={[
                'rgba(255, 255, 255, 0)',
                `rgba(255, 255, 255, ${config.maxOpacity * 0.5})`,
                `rgba(255, 255, 255, ${config.maxOpacity})`,
                `rgba(255, 255, 255, ${config.maxOpacity * 0.5})`,
                'rgba(255, 255, 255, 0)',
              ]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.shine}
            />
          </Animated.View>
        </View>
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
      position: 'relative',
      overflow: 'hidden',
      borderRadius: RADIUS.MD,
    },
    gradientOverlay: {
      ...StyleSheet.absoluteFillObject,
      zIndex: 1,
    },
    shineContainer: {
      position: 'absolute',
      top: -30,
      left: -80,
      width: 280,
      height: 120,
      borderRadius: 60,
      overflow: 'hidden',
      zIndex: 2,
    },
    shine: {
      flex: 1,
      width: '100%',
      height: '100%',
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
