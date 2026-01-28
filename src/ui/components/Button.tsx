import React, { useMemo, type ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { RADIUS, SPACING, textOnHex, TYPOGRAPHY, useTheme } from '../theme';

interface ButtonProps {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'success' | 'dark' | 'danger';
  iconRight?: ReactNode;
  iconLeft?: ReactNode;
  labelColor?: string;
}

const Button = ({
  label,
  onPress,
  disabled,
  variant = 'primary',
  iconRight,
  iconLeft,
  labelColor,
}: ButtonProps) => {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const isPrimary = variant === 'primary';
  const isSuccess = variant === 'success';
  const isSecondary = variant === 'secondary';
  const isDark = variant === 'dark';
  const isDanger = variant === 'danger';

  const bgColor = useMemo(
    () =>
      isPrimary
        ? colors.primary
        : isSuccess
          ? colors.success
          : isDanger
            ? colors.danger
          : isDark
            ? '#000000'
            : isSecondary
              ? '#FFFFFF'
              : colors.surface,
    [
      isPrimary,
      isSuccess,
      isDanger,
      isDark,
      isSecondary,
      colors.primary,
      colors.success,
      colors.danger,
      colors.surface,
    ],
  );
  const computedLabelColor = useMemo(
    () => (isDark || isDanger ? '#FFFFFF' : textOnHex(bgColor)),
    [isDark, isDanger, bgColor],
  );

  return (
    <Pressable
      style={({ pressed }) => [
        styles.base,
        isPrimary
          ? styles.primary
          : isSuccess
            ? styles.success
            : isDanger
              ? styles.danger
            : isDark
              ? styles.dark
              : styles.secondary,
        disabled && (isPrimary || isDark || isDanger) && styles.disabled,
        pressed && !disabled && styles.pressed,
      ]}
      onPress={onPress}
      disabled={disabled}
    >
      <View style={styles.labelRow}>
        {iconLeft ? <View style={styles.iconLeft}>{iconLeft}</View> : null}
        <Text
          style={[
            styles.label,
            { color: labelColor ?? computedLabelColor },
            disabled && isSuccess && styles.successLabelDisabled,
          ]}
        >
          {label}
        </Text>
        {iconRight ? <View style={styles.iconRight}>{iconRight}</View> : null}
      </View>
    </Pressable>
  );
};

function createStyles(colors: {
  primary: string;
  surface: string;
  border: string;
  ink: string;
  success: string;
  danger: string;
}) {
  return StyleSheet.create({
    base: {
      width: '100%',
      paddingVertical: SPACING.SM + 2,
      borderRadius: RADIUS.MD,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: 'transparent',
      overflow: 'hidden',
    },
    primary: {
      backgroundColor: colors.primary,
      shadowColor: colors.ink,
      shadowOpacity: 0.08,
      shadowOffset: { width: 0, height: 4 },
      shadowRadius: 6,
      elevation: 1,
    },
    secondary: {
      backgroundColor: '#FFFFFF',
      borderColor: colors.border,
      shadowColor: colors.ink,
      shadowOpacity: 0.06,
      shadowOffset: { width: 0, height: 2 },
      shadowRadius: 4,
      elevation: 1,
    },
    dark: {
      backgroundColor: '#000000',
      shadowColor: '#000000',
      shadowOpacity: 0.2,
      shadowOffset: { width: 0, height: 4 },
      shadowRadius: 6,
      elevation: 2,
    },
    danger: {
      backgroundColor: colors.danger,
      shadowColor: colors.danger,
      shadowOpacity: 0.12,
      shadowOffset: { width: 0, height: 4 },
      shadowRadius: 6,
      elevation: 1,
    },
    success: {
      backgroundColor: colors.success,
      shadowColor: colors.success,
      shadowOpacity: 0.08,
      shadowOffset: { width: 0, height: 4 },
      shadowRadius: 6,
      elevation: 1,
    },
    pressed: {
      opacity: 0.9,
    },
    disabled: {
      backgroundColor: '#D1D5DB',
      borderColor: '#D1D5DB',
    },
    label: {
      fontSize: TYPOGRAPHY.BODY,
      fontFamily: TYPOGRAPHY.FONT_FAMILY_SEMIBOLD,
    },
    labelRow: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    iconLeft: {
      marginRight: SPACING.XS,
    },
    iconRight: {
      marginLeft: SPACING.XS,
    },
    successLabelDisabled: {
      opacity: 0.8,
    },
  });
}

export default Button;
