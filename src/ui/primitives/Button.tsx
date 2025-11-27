import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { COLORS, RADIUS, SPACING, TYPOGRAPHY } from '../theme';

interface ButtonProps {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  variant?: 'primary' | 'secondary';
}

const Button = ({ label, onPress, disabled, variant = 'primary' }: ButtonProps) => {
  const isPrimary = variant === 'primary';
  return (
    <Pressable
      style={({ pressed }) => [
        styles.base,
        isPrimary ? styles.primary : styles.secondary,
        disabled && styles.disabled,
        pressed && !disabled && styles.pressed,
      ]}
      onPress={onPress}
      disabled={disabled}
    >
      <Text style={[styles.label, !isPrimary && styles.secondaryLabel]}>{label}</Text>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  base: {
    width: '100%',
    paddingVertical: SPACING.SM + 2,
    borderRadius: RADIUS.MD,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  primary: {
    backgroundColor: COLORS.PRIMARY,
    shadowColor: COLORS.PRIMARY_DARK,
    shadowOpacity: 0.25,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 14,
  },
  secondary: {
    backgroundColor: COLORS.SURFACE,
    borderColor: COLORS.PRIMARY,
  },
  pressed: {
    opacity: 0.9,
  },
  disabled: {
    backgroundColor: '#D1D5DB',
    borderColor: '#D1D5DB',
  },
  label: {
    color: '#fff',
    fontSize: TYPOGRAPHY.BODY,
    fontFamily: TYPOGRAPHY.FONT_FAMILY_SEMIBOLD,
  },
  secondaryLabel: {
    color: COLORS.PRIMARY,
  },
});

export default Button;
