import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Text from './Text';
import { COLORS, RADIUS, SPACING, TYPOGRAPHY } from './theme';

interface AnswerOptionProps {
  label: string;
  selected?: boolean;
  disabled?: boolean;
  onPress: () => void;
}

const AnswerOption = ({ label, selected, disabled, onPress }: AnswerOptionProps) => {
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
      <View style={styles.dotWrapper}>
        <View style={[styles.dot, selected && styles.dotSelected]} />
      </View>
      <Text weight="medium" style={styles.label}>
        {label}
      </Text>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  base: {
    width: '100%',
    paddingVertical: SPACING.SM + 2,
    paddingHorizontal: SPACING.SM,
    borderRadius: RADIUS.MD,
    borderWidth: 1,
    borderColor: COLORS.BORDER,
    backgroundColor: COLORS.SURFACE,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.SM,
    shadowColor: COLORS.PRIMARY_DARK,
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 6 },
  },
  pressed: {
    opacity: 0.9,
  },
  selected: {
    borderColor: COLORS.PRIMARY_DARK,
    backgroundColor: COLORS.ACCENT,
  },
  disabled: {
    opacity: 0.6,
  },
  dotWrapper: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.BORDER,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.SM,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: 'transparent',
  },
  dotSelected: {
    backgroundColor: COLORS.PRIMARY_DARK,
  },
  label: {
    fontSize: TYPOGRAPHY.BODY,
  },
});

export default AnswerOption;
