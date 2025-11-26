import React from 'react';
import { View, StyleSheet } from 'react-native';
import Text from './primitives/Text';
import { useAuth } from '../logic/auth/useAuth';
import { COLORS, SPACING, TYPOGRAPHY } from './theme';
import { FontAwesome } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

const Header = () => {
  const { derivedUser } = useAuth();

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.container}>
        <View style={styles.brandRow}>
          <FontAwesome name="trophy" size={14} color={COLORS.PRIMARY_DARK} />
          <Text weight="medium" style={styles.brand}>
            Superbowl HQ
          </Text>
        </View>
        <Text weight="medium" style={styles.user}>
          {derivedUser?.username || derivedUser?.email || 'Guest'}
        </Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(255,255,255,0.9)',
    zIndex: 1000,
  },
  container: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.MD,
    paddingBottom: SPACING.XS,
    minHeight: 56,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  brand: {
    fontSize: TYPOGRAPHY.SMALL,
    color: COLORS.PRIMARY_DARK,
  },
  user: {
    fontSize: TYPOGRAPHY.SMALL,
    color: COLORS.PRIMARY_DARK,
  },
});

export default Header;
