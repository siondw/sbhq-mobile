import React, { useEffect, useMemo, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';

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
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!live) return;
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 900, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 900, useNativeDriver: true }),
      ]),
    );
    anim.start();
    return () => anim.stop();
  }, [live, pulse]);

  const dotOpacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.55, 1] });
  const dotScale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.35] });

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
        <Button
          label={buttonLabel}
          variant={buttonVariant === 'secondary' ? 'secondary' : buttonVariant}
          onPress={onPress}
          disabled={buttonDisabled}
        />
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
