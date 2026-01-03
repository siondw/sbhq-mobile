import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { RADIUS, SPACING, TYPOGRAPHY, useTheme, withAlpha } from '../theme';
import GlassyTexture from '../textures/GlassyTexture';
import Text from './Text';

interface DemoOverlayProps {
  tip: string | null;
}

const DISPLAY_DURATION_MS = 3000;

const DemoOverlay = ({ tip }: DemoOverlayProps) => {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(colors, insets.top), [colors, insets.top]);
  const [visibleTip, setVisibleTip] = useState<string | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const hideTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!tip) {
      setIsVisible(false);
      setVisibleTip(null);
      return;
    }

    setVisibleTip(tip);
    setIsVisible(true);

    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
    }

    hideTimeoutRef.current = setTimeout(() => {
      setIsVisible(false);
    }, DISPLAY_DURATION_MS);

    return () => {
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current);
      }
    };
  }, [tip]);

  if (!isVisible || !visibleTip) {
    return null;
  }

  return (
    <View style={styles.container} pointerEvents="none">
      <View style={styles.backdrop} />
      <GlassyTexture colors={colors} showShine={false} style={styles.tipContainer}>
        <View style={styles.tipContent}>
          <View style={styles.demoBadge}>
            <Ionicons name="play-circle" size={14} color={colors.surface} />
            <Text style={styles.badgeText}>DEMO</Text>
          </View>
          <Text style={styles.tipText}>{visibleTip}</Text>
        </View>
      </GlassyTexture>
    </View>
  );
};

const createStyles = (
  colors: { surface: string; ink: string; primary: string },
  topInset: number,
) =>
  StyleSheet.create({
    container: {
      ...StyleSheet.absoluteFillObject,
      justifyContent: 'flex-start',
      alignItems: 'center',
      paddingHorizontal: SPACING.MD,
      paddingTop: topInset + SPACING.XL,
      zIndex: 9999,
    },
    backdrop: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: withAlpha(colors.ink, 0.18),
    },
    tipContainer: {
      width: '100%',
      maxWidth: 420,
      paddingVertical: SPACING.MD,
      paddingHorizontal: SPACING.MD,
      borderRadius: RADIUS.LG,
      backgroundColor: withAlpha(colors.surface, 0.95),
      borderWidth: 1,
      borderColor: withAlpha(colors.primary, 0.3),
      shadowColor: colors.ink,
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.15,
      shadowRadius: 8,
      elevation: 10,
    },
    tipContent: {
      gap: SPACING.XS,
    },
    demoBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      backgroundColor: colors.primary,
      paddingHorizontal: SPACING.SM,
      paddingVertical: 2,
      borderRadius: RADIUS.SM,
      alignSelf: 'flex-start',
    },
    badgeText: {
      fontSize: 10,
      fontFamily: TYPOGRAPHY.FONT_FAMILY_BOLD,
      color: colors.surface,
      letterSpacing: 0.5,
    },
    tipText: {
      fontSize: TYPOGRAPHY.SMALL,
      fontFamily: TYPOGRAPHY.FONT_FAMILY_MEDIUM,
      color: colors.ink,
      lineHeight: 18,
    },
  });

export default DemoOverlay;
