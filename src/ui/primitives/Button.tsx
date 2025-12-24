import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { COLORS, RADIUS, SPACING, TYPOGRAPHY } from '../theme';

interface ButtonProps {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'success';
}

const Button = ({ label, onPress, disabled, variant = 'primary' }: ButtonProps) => {
  const isPrimary = variant === 'primary';
  const isSuccess = variant === 'success';

  return (
    <Pressable
      style={({ pressed }) => [
        styles.base,
        isPrimary ? styles.primary : isSuccess ? styles.success : styles.secondary,
        disabled && isPrimary && styles.disabled,
        pressed && !disabled && styles.pressed,
      ]}
      onPress={onPress}
      disabled={disabled}
    >
      <Text
        style={[
          styles.label,
          !isPrimary && !isSuccess && styles.secondaryLabel,
          disabled && isSuccess && styles.successLabelDisabled,
        ]}
      >
        {isSuccess ? '✓ ' : ''}
        {label}
      </Text>
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
  success: {
    backgroundColor: COLORS.PRIMARY,
    shadowColor: COLORS.PRIMARY,
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
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
  successLabelDisabled: {
    opacity: 0.8,
  },
});

export default Button;
