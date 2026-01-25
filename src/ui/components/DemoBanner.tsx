import { Ionicons } from '@expo/vector-icons';
import React, { memo, useCallback, useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { lightImpact } from '../../utils/haptics';
import { RADIUS, SPACING, TYPOGRAPHY, useTheme, withAlpha } from '../theme';
import GlassyTexture from '../textures/GlassyTexture';
import Text from './Text';

interface DemoBannerProps {
  onStartDemo: () => void;
  onDismiss: () => void;
}

const DemoBanner = memo(({ onStartDemo, onDismiss }: DemoBannerProps) => {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const handleStartDemo = useCallback(() => {
    lightImpact();
    onStartDemo();
  }, [onStartDemo]);

  const handleDismiss = useCallback(() => {
    lightImpact();
    onDismiss();
  }, [onDismiss]);

  return (
    <GlassyTexture colors={colors} showShine={false} style={styles.container}>
      <View style={styles.content}>
        <View style={styles.left}>
          <Ionicons name="play-circle-outline" size={18} color={colors.primary} />
          <Text weight="medium" style={styles.text}>
            New here? See how it works
          </Text>
        </View>
        <View style={styles.actions}>
          <Pressable
            style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
            onPress={handleStartDemo}
          >
            <Text weight="bold" style={styles.buttonText}>
              Try Demo
            </Text>
          </Pressable>
          <Pressable
            style={({ pressed }) => [styles.dismissButton, pressed && styles.buttonPressed]}
            onPress={handleDismiss}
          >
            <Ionicons name="close" size={18} color={colors.muted} />
          </Pressable>
        </View>
      </View>
    </GlassyTexture>
  );
});

DemoBanner.displayName = 'DemoBanner';

function createStyles(colors: {
  surface: string;
  ink: string;
  muted: string;
  primary: string;
  border: string;
}) {
  return StyleSheet.create({
    container: {
      backgroundColor: withAlpha(colors.surface, 0.6),
      borderRadius: RADIUS.LG,
      borderWidth: 1,
      borderColor: withAlpha(colors.primary, 0.2),
    },
    content: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: SPACING.SM,
      paddingHorizontal: SPACING.MD,
    },
    left: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: SPACING.SM,
      flex: 1,
    },
    text: {
      fontSize: TYPOGRAPHY.SMALL,
      color: colors.ink,
    },
    actions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: SPACING.XS,
    },
    button: {
      backgroundColor: colors.primary,
      paddingVertical: 6,
      paddingHorizontal: SPACING.SM,
      borderRadius: RADIUS.SM,
    },
    buttonText: {
      fontSize: TYPOGRAPHY.SMALL,
      color: colors.surface,
    },
    dismissButton: {
      padding: SPACING.XS,
    },
    buttonPressed: {
      opacity: 0.7,
    },
  });
}

export default DemoBanner;
