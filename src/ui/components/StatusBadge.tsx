import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';

import { SPACING, TYPOGRAPHY, useTheme, withAlpha } from '../theme';
import Text from './Text';

interface StatusBadgeProps {
  label: string;
  icon?: keyof typeof Ionicons.glyphMap;
  color?: string;
  style?: ViewStyle;
}

const StatusBadge = ({
  label,
  icon = 'checkmark-circle',
  color,
  style,
}: StatusBadgeProps) => {
  const { colors } = useTheme();
  const activeColor = color || colors.primary;

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: withAlpha(activeColor, 0.1) },
        style,
      ]}
    >
      <Ionicons name={icon} size={20} color={activeColor} />
      <Text weight="bold" style={[styles.text, { color: activeColor }]}>
        {label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.SM,
    paddingVertical: SPACING.SM,
    paddingHorizontal: SPACING.LG,
    borderRadius: 100,
  },
  text: {
    fontSize: TYPOGRAPHY.BODY,
  },
});

export default StatusBadge;
