import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { memo, useCallback, useMemo } from 'react';
import { Modal, Platform, Pressable, StyleSheet, View } from 'react-native';

import { ROUTES } from '../../configs/routes';
import { useAuth } from '../../logic/hooks/useAuth';
import { lightImpact } from '../../utils/haptics';
import { SPACING, TYPOGRAPHY, useTheme, withAlpha } from '../theme';
import GlassyTexture from '../textures/GlassyTexture';
import Text from './Text';

interface UserMenuProps {
  visible: boolean;
  onClose: () => void;
}

const UserMenu = memo(({ visible, onClose }: UserMenuProps) => {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const router = useRouter();
  const { logout } = useAuth();
  const handleBackdropPress = useCallback(() => {
    lightImpact();
    onClose();
  }, [onClose]);

  const handleGoHome = useCallback(() => {
    lightImpact();
    onClose();
    router.push(ROUTES.CONTESTS);
  }, [onClose, router]);

  const handleLogout = useCallback(() => {
    lightImpact();
    onClose();
    void logout().then(() => {
      router.replace(ROUTES.INDEX);
    });
  }, [logout, onClose, router]);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={handleBackdropPress}>
        <View style={styles.menuContainer}>
          <GlassyTexture colors={colors} showShine={false} style={styles.menu}>
            {/* Return to Home */}
            <Pressable style={styles.menuItem} onPress={handleGoHome}>
              <Ionicons name="home-outline" size={20} color={colors.ink} />
              <Text weight="medium" style={styles.menuItemText}>
                Return to Home
              </Text>
            </Pressable>

            {/* Logout */}
            <Pressable style={[styles.menuItem, styles.menuItemDanger]} onPress={handleLogout}>
              <Ionicons name="log-out-outline" size={20} color={colors.danger} />
              <Text weight="medium" style={[styles.menuItemText, styles.menuItemTextDanger]}>
                Logout
              </Text>
            </Pressable>
          </GlassyTexture>
        </View>
      </Pressable>
    </Modal>
  );
});

UserMenu.displayName = 'UserMenu';

function createStyles(colors: {
  surface: string;
  ink: string;
  danger: string;
  primary: string;
  background: string;
}) {
  return StyleSheet.create({
    backdrop: {
      flex: 1,
      backgroundColor: withAlpha(colors.ink, 0.3),
      justifyContent: 'flex-start',
      alignItems: 'flex-end',
      paddingTop: Platform.OS === 'ios' ? 100 : 80, // Position below header
      paddingRight: SPACING.MD,
    },
    menuContainer: {
      minWidth: 220,
    },
    menu: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      paddingVertical: SPACING.XS,
      shadowColor: colors.ink,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 12,
      elevation: 8,
      borderWidth: 1,
      borderColor: withAlpha(colors.ink, 0.1),
    },
    menuItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: SPACING.SM,
      paddingVertical: SPACING.SM,
      paddingHorizontal: SPACING.MD,
    },
    menuItemDanger: {
      borderTopWidth: 1,
      borderTopColor: withAlpha(colors.ink, 0.1),
      marginTop: SPACING.XS,
    },
    menuItemText: {
      fontSize: TYPOGRAPHY.BODY,
      color: colors.ink,
    },
    menuItemTextDanger: {
      color: colors.danger,
    },
  });
}

export default UserMenu;
