import React, { memo, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import TrophyIcon from '../../assets/icons/trophy.svg';
import { APP_NAME } from '../configs/constants';
import type { DerivedUser } from '../logic/hooks/AuthProvider';
import Text from './Text';
import { HEADER_CONTENT_HEIGHT, SPACING, TYPOGRAPHY } from './theme';
import { useTheme } from './themeContext';

interface HeaderProps {
  user?: DerivedUser | null;
}

const Header = memo(({ user }: HeaderProps) => {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']} pointerEvents="box-none">
      <View style={styles.container} pointerEvents="box-none">
        <View style={styles.brandRow}>
          <TrophyIcon width={14} height={14} />
          <Text weight="medium" style={styles.brand}>
            {APP_NAME}
          </Text>
        </View>
        <Text weight="medium" style={styles.user}>
          {user?.username || user?.email || 'Guest'}
        </Text>
      </View>
    </SafeAreaView>
  );
});

Header.displayName = 'Header';

function createStyles(colors: { surface: string; ink: string }) {
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
    user: {
      fontSize: TYPOGRAPHY.SMALL,
      color: colors.ink,
    },
  });
}

export default Header;
