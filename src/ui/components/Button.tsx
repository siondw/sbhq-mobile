import React, { useMemo, type ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { RADIUS, SPACING, textOnHex, TYPOGRAPHY, useTheme } from '../theme';

interface ButtonProps {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'success';
  iconRight?: ReactNode;
  iconLeft?: ReactNode;
}

const Button = ({
  label,
  onPress,
  disabled,
  variant = 'primary',
  iconRight,
  iconLeft,
}: ButtonProps) => {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const isPrimary = variant === 'primary';
  const isSuccess = variant === 'success';
  const isSecondary = variant === 'secondary';

  const bgColor = isPrimary ? colors.primary : isSuccess ? colors.success : colors.surface;
  const labelColor = isSecondary ? colors.primary : textOnHex(bgColor);

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
      <View style={styles.labelRow}>
        {iconLeft ? <View style={styles.iconLeft}>{iconLeft}</View> : null}
        <Text
          style={[
            styles.label,
            { color: labelColor },
            !isPrimary && !isSuccess && styles.secondaryLabel,
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

function createStyles(colors: { primary: string; surface: string; border: string; ink: string; success: string }) {
  return StyleSheet.create({
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
      backgroundColor: colors.primary,
      shadowColor: colors.ink,
      shadowOpacity: 0.08,
      shadowOffset: { width: 0, height: 4 },
      shadowRadius: 6,
      elevation: 1,
    },
    secondary: {
      backgroundColor: colors.surface,
      borderColor: colors.primary,
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
    secondaryLabel: {
      color: colors.primary,
    },
    successLabelDisabled: {
      opacity: 0.8,
    },
  });
}

export default Button;
