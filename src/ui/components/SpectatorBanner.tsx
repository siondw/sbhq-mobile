import { Ionicons } from '@expo/vector-icons';
import React, { memo, useCallback, useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { lightImpact } from '../../utils/haptics';
import { RADIUS, SPACING, TYPOGRAPHY, useTheme, withAlpha } from '../theme';
import GlassyTexture from '../textures/GlassyTexture';
import Text from './Text';

interface SpectatorBannerProps {
  onLeave: () => void;
}

const SpectatorBanner = memo(({ onLeave }: SpectatorBannerProps) => {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const handleLeave = useCallback(() => {
    lightImpact();
    onLeave();
  }, [onLeave]);

  return (
    <GlassyTexture colors={colors} showShine={false} style={styles.container}>
      <View style={styles.content}>
        <Pressable
          style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
          onPress={handleLeave}
        >
          <Text weight="bold" style={styles.buttonText}>
            Leave
          </Text>
        </Pressable>
        <View style={styles.right}>
          <Text weight="medium" style={styles.text}>
            Spectating
          </Text>
          <Ionicons name="eye" size={18} color={colors.warm} />
        </View>
      </View>
    </GlassyTexture>
  );
});

SpectatorBanner.displayName = 'SpectatorBanner';

function createStyles(colors: {
  surface: string;
  ink: string;
  warm: string;
  border: string;
}) {
  return StyleSheet.create({
    container: {
      backgroundColor: withAlpha(colors.surface, 0.6),
      borderRadius: RADIUS.LG,
      borderWidth: 1,
      borderColor: withAlpha(colors.warm, 0.25),
    },
    content: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: SPACING.SM,
      paddingHorizontal: SPACING.MD,
    },
    right: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: SPACING.SM,
      flex: 1,
      justifyContent: 'flex-end',
    },
    text: {
      fontSize: TYPOGRAPHY.SMALL,
      color: colors.ink,
    },
    button: {
      backgroundColor: colors.warm,
      paddingVertical: 6,
      paddingHorizontal: SPACING.SM,
      borderRadius: RADIUS.SM,
    },
    buttonText: {
      fontSize: TYPOGRAPHY.SMALL,
      color: colors.surface,
    },
    buttonPressed: {
      opacity: 0.7,
    },
  });
}

export default SpectatorBanner;
