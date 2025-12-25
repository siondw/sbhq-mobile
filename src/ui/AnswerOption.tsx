import React, { useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Text from './Text';
import { RADIUS, SPACING, TYPOGRAPHY } from './theme';
import { useTheme } from './themeContext';

interface AnswerOptionProps {
  label: string;
  selected?: boolean;
  disabled?: boolean;
  onPress: () => void;
}

const AnswerOption = ({ label, selected, disabled, onPress }: AnswerOptionProps) => {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <Pressable
      style={({ pressed }) => [
        styles.base,
        selected && styles.selected,
        pressed && !disabled && styles.pressed,
        disabled && styles.disabled,
      ]}
      onPress={onPress}
      disabled={disabled}
    >
      <View style={[styles.dotWrapper, selected && styles.dotWrapperSelected]}>
        <View style={[styles.dot, selected && styles.dotSelected]} />
      </View>
      <Text weight="medium" style={styles.label}>
        {label}
      </Text>
    </Pressable>
  );
};

function createStyles(colors: { surface: string; border: string; ink: string; energy: string }) {
  return StyleSheet.create({
    base: {
      width: '100%',
      paddingVertical: SPACING.SM + 2,
      paddingHorizontal: SPACING.SM,
      borderRadius: RADIUS.MD,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: SPACING.SM,
      shadowColor: colors.ink,
      shadowOpacity: 0.05,
      shadowRadius: 6,
      shadowOffset: { width: 0, height: 4 },
      elevation: 1,
    },
    pressed: {
      opacity: 0.9,
    },
    selected: {
      borderColor: colors.energy,
    },
    disabled: {
      opacity: 0.6,
    },
    dotWrapper: {
      width: 24,
      height: 24,
      borderRadius: 12,
      borderWidth: 2,
      borderColor: colors.border,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: SPACING.SM,
    },
    dotWrapperSelected: {
      borderColor: colors.energy,
    },
    dot: {
      width: 12,
      height: 12,
      borderRadius: 6,
      backgroundColor: 'transparent',
    },
    dotSelected: {
      backgroundColor: colors.energy,
    },
    label: {
      fontSize: TYPOGRAPHY.BODY,
    },
  });
}

export default AnswerOption;
