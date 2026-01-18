import { Ionicons } from '@expo/vector-icons';
import React, { memo, useCallback, useMemo } from 'react';
import { Linking, Platform, Pressable, StyleSheet, View } from 'react-native';

import { useNotifications } from '../../logic/contexts';
import { lightImpact } from '../../utils/haptics';
import { RADIUS, SPACING, TYPOGRAPHY, useTheme, withAlpha } from '../theme';
import GlassyTexture from '../textures/GlassyTexture';
import Text from './Text';

interface NotificationBannerProps {
  variant: 'compact' | 'full';
  onDismiss?: () => void;
}

const NotificationBanner = memo(({ variant, onDismiss }: NotificationBannerProps) => {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors, variant), [colors, variant]);
  const { isRegistered, requestPermissions, permissionStatus } = useNotifications();

  // Check if permission was denied (can't ask again means user explicitly denied)
  const wasDenied = permissionStatus?.canAskAgain === false && !permissionStatus?.granted;

  const handleEnable = useCallback(async () => {
    lightImpact();

    if (wasDenied) {
      // User previously denied - open settings
      if (Platform.OS === 'ios') {
        await Linking.openURL('app-settings:');
      } else {
        await Linking.openSettings();
      }
    } else {
      // Request permissions normally
      await requestPermissions();
    }
  }, [wasDenied, requestPermissions]);

  const handleDismiss = useCallback(() => {
    lightImpact();
    onDismiss?.();
  }, [onDismiss]);

  // Don't render if notifications are already enabled
  if (isRegistered) {
    return null;
  }

  if (variant === 'compact') {
    return (
      <GlassyTexture colors={colors} showShine={false} style={styles.compactContainer}>
        <View style={styles.compactContent}>
          <View style={styles.compactLeft}>
            <Ionicons name="notifications-outline" size={18} color={colors.energy} />
            <Text weight="medium" style={styles.compactText}>
              Enable notifications
            </Text>
          </View>
          <View style={styles.compactActions}>
            <Pressable
              style={({ pressed }) => [styles.compactButton, pressed && styles.buttonPressed]}
              onPress={() => void handleEnable()}
            >
              <Text weight="bold" style={styles.compactButtonText}>
                {wasDenied ? 'Settings' : 'Enable'}
              </Text>
            </Pressable>
            {onDismiss && (
              <Pressable
                style={({ pressed }) => [styles.dismissButton, pressed && styles.buttonPressed]}
                onPress={handleDismiss}
              >
                <Ionicons name="close" size={18} color={colors.muted} />
              </Pressable>
            )}
          </View>
        </View>
      </GlassyTexture>
    );
  }

  // Full variant
  return (
    <GlassyTexture colors={colors} showShine={false} style={styles.fullContainer}>
      <View style={styles.fullContent}>
        <View style={styles.fullHeader}>
          <View style={styles.iconWrapper}>
            <Ionicons name="notifications" size={24} color={colors.energy} />
          </View>
          <View style={styles.textContent}>
            <Text weight="bold" style={styles.fullTitle}>
              Stay in the game
            </Text>
            <Text style={styles.fullDescription}>
              Get notified when contests start and new rounds begin.
            </Text>
          </View>
          {onDismiss && (
            <Pressable
              style={({ pressed }) => [styles.fullDismissButton, pressed && styles.buttonPressed]}
              onPress={handleDismiss}
            >
              <Ionicons name="close" size={20} color={colors.muted} />
            </Pressable>
          )}
        </View>
        <Pressable
          style={({ pressed }) => [styles.fullButton, pressed && styles.fullButtonPressed]}
          onPress={() => void handleEnable()}
        >
          <Ionicons
            name={wasDenied ? 'settings-outline' : 'notifications-outline'}
            size={18}
            color={colors.surface}
          />
          <Text weight="bold" style={styles.fullButtonText}>
            {wasDenied ? 'Open Settings' : 'Enable Notifications'}
          </Text>
        </Pressable>
      </View>
    </GlassyTexture>
  );
});

NotificationBanner.displayName = 'NotificationBanner';

function createStyles(
  colors: {
    surface: string;
    ink: string;
    muted: string;
    energy: string;
    primary: string;
    background: string;
    border: string;
  },
  variant: 'compact' | 'full',
) {
  return StyleSheet.create({
    // Compact variant styles
    compactContainer: {
      backgroundColor: withAlpha(colors.surface, 0.6),
      borderRadius: RADIUS.LG,
      borderWidth: 1,
      borderColor: withAlpha(colors.energy, 0.3),
      marginTop: SPACING.MD,
    },
    compactContent: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: SPACING.SM,
      paddingHorizontal: SPACING.MD,
    },
    compactLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: SPACING.SM,
    },
    compactText: {
      fontSize: TYPOGRAPHY.SMALL,
      color: colors.ink,
    },
    compactActions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: SPACING.XS,
    },
    compactButton: {
      backgroundColor: colors.energy,
      paddingVertical: 6,
      paddingHorizontal: SPACING.SM,
      borderRadius: RADIUS.SM,
    },
    compactButtonText: {
      fontSize: TYPOGRAPHY.SMALL,
      color: colors.surface,
    },
    dismissButton: {
      padding: SPACING.XS,
    },
    buttonPressed: {
      opacity: 0.7,
    },

    // Full variant styles
    fullContainer: {
      backgroundColor: withAlpha(colors.surface, 0.8),
      borderRadius: RADIUS.LG,
      borderWidth: 1,
      borderColor: withAlpha(colors.energy, 0.3),
    },
    fullContent: {
      padding: SPACING.MD,
      gap: SPACING.MD,
    },
    fullHeader: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: SPACING.SM,
    },
    iconWrapper: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: withAlpha(colors.energy, 0.15),
      alignItems: 'center',
      justifyContent: 'center',
    },
    textContent: {
      flex: 1,
      gap: 2,
    },
    fullTitle: {
      fontSize: TYPOGRAPHY.BODY,
      color: colors.ink,
    },
    fullDescription: {
      fontSize: TYPOGRAPHY.SMALL,
      color: colors.muted,
      lineHeight: TYPOGRAPHY.SMALL + 4,
    },
    fullDismissButton: {
      padding: SPACING.XS,
      marginTop: -SPACING.XS,
      marginRight: -SPACING.XS,
    },
    fullButton: {
      backgroundColor: colors.energy,
      borderRadius: RADIUS.MD,
      paddingVertical: SPACING.SM,
      paddingHorizontal: SPACING.MD,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: SPACING.XS,
    },
    fullButtonPressed: {
      opacity: 0.9,
    },
    fullButtonText: {
      fontSize: TYPOGRAPHY.BODY,
      color: colors.surface,
    },
  });
}

export default NotificationBanner;
