import React, { memo, useCallback, useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Ionicons } from '@expo/vector-icons';
import { APP_NAME } from '../../configs/constants';
import type { DerivedUser } from '../../logic/hooks/AuthProvider';
import { lightImpact } from '../../utils/haptics';
import { HEADER_CONTENT_HEIGHT, SPACING, TYPOGRAPHY, useTheme } from '../theme';
import Text from './Text';
import UserMenu from './UserMenu';

interface HeaderProps {
  user?: DerivedUser | null;
}

const Header = memo(({ user }: HeaderProps) => {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [menuVisible, setMenuVisible] = useState(false);

  const toggleMenu = useCallback(() => {
    lightImpact();
    setMenuVisible((prev) => !prev);
  }, []);

  const closeMenu = useCallback(() => {
    setMenuVisible(false);
  }, []);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.container}>
        <View style={styles.brandRow}>
          <Ionicons name="trophy" size={14} color={colors.energy} />
          <Text weight="medium" style={styles.brand}>
            {APP_NAME}
          </Text>
        </View>
        <Pressable style={styles.userButton} onPress={toggleMenu}>
          <Text weight="medium" style={styles.user}>
            {user?.username || user?.email || 'Guest'}
          </Text>
          <Ionicons name="chevron-down" size={14} color={colors.ink} />
        </Pressable>
      </View>

      <UserMenu visible={menuVisible} onClose={closeMenu} />
    </SafeAreaView>
  );
});

Header.displayName = 'Header';

function createStyles(colors: { surface: string; ink: string; energy: string }) {
  return StyleSheet.create({
    safeArea: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      backgroundColor: colors.surface,
      zIndex: 1000,
    },
    container: {
      width: '100%',
      flexDirection: 'row',
      alignItems: 'flex-end',
      justifyContent: 'space-between',
      paddingHorizontal: SPACING.MD,
      paddingBottom: SPACING.XS,
      minHeight: HEADER_CONTENT_HEIGHT,
      backgroundColor: 'transparent',
    },
    brandRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    brand: {
      fontSize: TYPOGRAPHY.SMALL,
      color: colors.ink,
    },
    userButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    user: {
      fontSize: TYPOGRAPHY.SMALL,
      color: colors.ink,
    },
  });
}

export default Header;
