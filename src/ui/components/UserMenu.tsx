import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { memo, useCallback, useMemo, useState } from 'react';
import {
  Keyboard,
  Linking,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  TextInput,
  TouchableWithoutFeedback,
  View,
} from 'react-native';

import { ROUTES } from '../../configs/routes';
import { useNotifications } from '../../logic/contexts';
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
  const { deleteAccount, logout } = useAuth();
  const { isRegistered, requestPermissions, permissionStatus } = useNotifications();
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [deleteInput, setDeleteInput] = useState('');
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const modalVisible = visible || deleteModalVisible;
  const handleBackdropPress = useCallback(() => {
    lightImpact();
    onClose();
  }, [onClose]);

  const handleGoHome = useCallback(() => {
    lightImpact();
    onClose();
    router.push(ROUTES.CONTESTS);
  }, [onClose, router]);

  // Check if permission was denied (can't ask again means user explicitly denied)
  const wasDenied = permissionStatus?.canAskAgain === false && !permissionStatus?.granted;

  const handleNotifications = useCallback(async () => {
    lightImpact();

    if (isRegistered) {
      // Already enabled - open settings to disable
      if (Platform.OS === 'ios') {
        await Linking.openURL('app-settings:');
      } else {
        await Linking.openSettings();
      }
    } else if (wasDenied) {
      // User previously denied - open settings
      if (Platform.OS === 'ios') {
        await Linking.openURL('app-settings:');
      } else {
        await Linking.openSettings();
      }
    } else {
      // Request permissions
      await requestPermissions();
    }
  }, [isRegistered, wasDenied, requestPermissions]);

  const handleLogout = useCallback(() => {
    lightImpact();
    onClose();
    void logout().then(() => {
      router.replace(ROUTES.INDEX);
    });
  }, [logout, onClose, router]);

  const openDeleteModal = useCallback(() => {
    lightImpact();
    setDeleteInput('');
    setDeleteError(null);
    setDeleteModalVisible(true);
    onClose();
  }, [onClose]);

  const closeDeleteModal = useCallback(() => {
    Keyboard.dismiss();
    setDeleteModalVisible(false);
    setDeleteInput('');
    setDeleteError(null);
    setIsDeleting(false);
  }, []);

  const isDeleteEnabled = deleteInput.trim().toLowerCase() === 'delete';

  const handleDeleteConfirm = useCallback(() => {
    if (!isDeleteEnabled || isDeleting) {
      return;
    }

    setIsDeleting(true);
    setDeleteError(null);

    void deleteAccount().then((result) => {
      if (!result.ok) {
        setDeleteError(result.error ?? 'Unable to delete account.');
        setIsDeleting(false);
        return;
      }
      closeDeleteModal();
      router.replace(ROUTES.INDEX);
    });
  }, [closeDeleteModal, deleteAccount, isDeleteEnabled, isDeleting, router]);

  const handleModalRequestClose = useCallback(() => {
    if (deleteModalVisible) {
      closeDeleteModal();
      return;
    }
    onClose();
  }, [closeDeleteModal, deleteModalVisible, onClose]);

  return (
    <Modal
      visible={modalVisible}
      transparent
      animationType="fade"
      onRequestClose={handleModalRequestClose}
    >
      {visible && !deleteModalVisible ? (
        <Pressable style={styles.backdrop} onPress={handleBackdropPress}>
          <View style={styles.menuContainer}>
            <GlassyTexture colors={colors} showShine={false} style={styles.menu}>
              <Pressable
                style={({ pressed }) => [styles.menuItem, pressed && styles.menuItemPressed]}
                onPress={handleGoHome}
              >
                <Ionicons name="home-outline" size={20} color={colors.ink} />
                <Text weight="medium" style={styles.menuItemText}>
                  Return to Home
                </Text>
              </Pressable>

              <Pressable
                style={({ pressed }) => [styles.menuItem, pressed && styles.menuItemPressed]}
                onPress={() => void handleNotifications()}
              >
                <Ionicons
                  name={isRegistered ? 'notifications' : 'notifications-off-outline'}
                  size={20}
                  color={colors.ink}
                />
                <Text weight="medium" style={styles.menuItemText}>
                  Notifications
                </Text>
                <Text style={styles.menuItemStatus}>{isRegistered ? 'On' : 'Off'}</Text>
              </Pressable>

              <Pressable
                style={({ pressed }) => [
                  styles.menuItem,
                  styles.menuItemDanger,
                  pressed && styles.menuItemPressed,
                ]}
                onPress={handleLogout}
              >
                <Ionicons name="log-out-outline" size={20} color={colors.danger} />
                <Text weight="medium" style={[styles.menuItemText, styles.menuItemTextDanger]}>
                  Logout
                </Text>
              </Pressable>

              <Pressable
                style={({ pressed }) => [
                  styles.menuItem,
                  styles.menuItemDanger,
                  pressed && styles.menuItemPressed,
                ]}
                onPress={openDeleteModal}
              >
                <Ionicons name="trash-outline" size={20} color={colors.danger} />
                <Text weight="medium" style={[styles.menuItemText, styles.menuItemTextDanger]}>
                  Delete Account
                </Text>
              </Pressable>
            </GlassyTexture>
          </View>
        </Pressable>
      ) : null}
      {deleteModalVisible ? (
        <TouchableWithoutFeedback onPress={closeDeleteModal}>
          <View style={styles.deleteOverlay}>
            <TouchableWithoutFeedback>
              <View style={styles.deleteCard}>
                <View style={styles.deleteTitleRow}>
                  <Ionicons name="warning-outline" size={20} color={colors.danger} />
                  <Text weight="bold" style={styles.deleteTitle}>
                    Delete account
                  </Text>
                </View>
                <Text style={styles.deleteBody}>
                  Type "delete" to confirm. This permanently removes your account and profile data.
                </Text>
                <TextInput
                  value={deleteInput}
                  onChangeText={setDeleteInput}
                  placeholder="delete"
                  placeholderTextColor={withAlpha(colors.ink, 0.4)}
                  style={[styles.deleteInput, deleteError ? styles.deleteInputError : null]}
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!isDeleting}
                />
                {deleteError ? <Text style={styles.deleteError}>{deleteError}</Text> : null}
                <View style={styles.deleteActions}>
                  <Pressable
                    style={({ pressed }) => [
                      styles.deleteCancel,
                      pressed && styles.deleteCancelPressed,
                    ]}
                    onPress={closeDeleteModal}
                  >
                    <Text weight="medium" style={styles.deleteCancelText}>
                      Cancel
                    </Text>
                  </Pressable>
                  <Pressable
                    style={({ pressed }) => [
                      styles.deleteConfirm,
                      pressed && styles.deleteConfirmPressed,
                      (!isDeleteEnabled || isDeleting) && styles.deleteConfirmDisabled,
                    ]}
                    onPress={handleDeleteConfirm}
                    disabled={!isDeleteEnabled || isDeleting}
                  >
                    <Text weight="medium" style={styles.deleteConfirmText}>
                      {isDeleting ? 'Deleting...' : 'Delete'}
                    </Text>
                  </Pressable>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      ) : null}
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
  muted: string;
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
      borderRadius: 10,
    },
    menuItemPressed: {
      backgroundColor: withAlpha(colors.ink, 0.06),
    },
    menuItemDanger: {
      borderTopWidth: 1,
      borderTopColor: withAlpha(colors.ink, 0.1),
      marginTop: SPACING.XS,
    },
    menuItemText: {
      fontSize: TYPOGRAPHY.BODY,
      color: colors.ink,
      flex: 1,
    },
    menuItemStatus: {
      fontSize: TYPOGRAPHY.SMALL,
      color: colors.muted,
    },
    menuItemTextDanger: {
      color: colors.danger,
    },
    deleteOverlay: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: SPACING.LG,
      backgroundColor: withAlpha(colors.ink, 0.6),
    },
    deleteCard: {
      width: '100%',
      maxWidth: 380,
      backgroundColor: colors.surface,
      borderRadius: 16,
      padding: SPACING.LG,
      borderWidth: 1,
      borderColor: withAlpha(colors.ink, 0.1),
    },
    deleteTitleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: SPACING.XS,
      marginBottom: SPACING.SM,
    },
    deleteTitle: {
      fontSize: TYPOGRAPHY.SUBTITLE,
      color: colors.ink,
    },
    deleteBody: {
      fontSize: TYPOGRAPHY.BODY,
      color: colors.muted,
      lineHeight: TYPOGRAPHY.BODY + 6,
      marginBottom: SPACING.MD,
    },
    deleteInput: {
      borderWidth: 1,
      borderColor: withAlpha(colors.ink, 0.2),
      borderRadius: 10,
      minHeight: 48,
      paddingHorizontal: SPACING.MD,
      paddingVertical: SPACING.SM,
      fontSize: TYPOGRAPHY.BODY,
      color: colors.ink,
      backgroundColor: withAlpha(colors.background, 0.6),
    },
    deleteInputError: {
      borderColor: colors.danger,
    },
    deleteError: {
      color: colors.danger,
      fontSize: TYPOGRAPHY.SMALL,
      marginTop: SPACING.XS,
    },
    deleteActions: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      gap: SPACING.SM,
      marginTop: SPACING.MD,
    },
    deleteCancel: {
      paddingHorizontal: SPACING.MD,
      paddingVertical: SPACING.SM,
    },
    deleteCancelPressed: {
      opacity: 0.7,
    },
    deleteCancelText: {
      color: colors.ink,
      fontSize: TYPOGRAPHY.BODY,
    },
    deleteConfirm: {
      paddingHorizontal: SPACING.MD,
      paddingVertical: SPACING.SM,
      borderRadius: 8,
      backgroundColor: colors.danger,
    },
    deleteConfirmDisabled: {
      backgroundColor: withAlpha(colors.danger, 0.4),
    },
    deleteConfirmPressed: {
      opacity: 0.9,
    },
    deleteConfirmText: {
      color: colors.surface,
      fontSize: TYPOGRAPHY.BODY,
    },
  });
}

export default UserMenu;
