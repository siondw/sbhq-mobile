import React from 'react';
import { View, StyleSheet } from 'react-native';
import Text from './primitives/Text';
import { useAuth } from '../logic/auth/useAuth';
import { COLORS, SPACING, TYPOGRAPHY } from './theme';
import { FontAwesome } from '@expo/vector-icons';

const Header = () => {
  const { derivedUser } = useAuth();

  return (
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
  );
};

const styles = StyleSheet.create({
  container: {
    height: 56,
    width: '100%',
    backgroundColor: 'rgba(255,255,255,0.9)',
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.MD,
    paddingBottom: SPACING.XS,
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
