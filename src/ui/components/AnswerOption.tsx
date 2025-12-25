import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { Animated, Pressable, StyleSheet, View } from 'react-native';

import { useSelectionAnimation } from '../animations';
import { RADIUS, SPACING, useTheme, withAlpha } from '../theme';
import Text from './Text';

interface AnswerOptionProps {
  label: string;
  iconText?: string;
  selected?: boolean;
  disabled?: boolean;
  onPress: () => void;
}

const AnswerOption = ({ label, selected, disabled, onPress }: AnswerOptionProps) => {
  const { colors } = useTheme();
  const { scale, opacity, buttonScale } = useSelectionAnimation(selected ?? false);

  return (
    <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
      <Pressable
        onPress={disabled ? undefined : onPress}
        style={({ pressed }) => [
          styles.moveRow,
        {
          backgroundColor: withAlpha(colors.surface, 0.4),
          borderColor: withAlpha(colors.ink, 0.1),
        },
        selected && [styles.moveRowSelected, { borderColor: withAlpha(colors.energy, 0.42) }],
        disabled && styles.disabled,
        pressed && !disabled && styles.pressed,
      ]}
    >
      {selected && (
        <Animated.View
          style={[
            styles.selectionPulse,
            {
              backgroundColor: withAlpha(colors.energy, 0.2),
              transform: [{ scale }],
              opacity,
            },
          ]}
        />
      )}

      <LinearGradient
        colors={
          selected
            ? ([colors.energy, colors.ink] as const)
            : ([withAlpha(colors.ink, 0.18), withAlpha(colors.ink, 0.06)] as const)
        }
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={styles.moveStripe}
      />

      <View style={styles.moveCopy}>
        <Text weight="medium" style={[styles.moveLabel, { color: colors.ink }]}>
          {label}
        </Text>
      </View>

      <View
        style={[
          styles.radioOuter,
          { borderColor: withAlpha(colors.ink, 0.2) },
          selected && [styles.radioOuterSelected, { borderColor: withAlpha(colors.ink, 0.45) }],
        ]}
      >
        <View
          style={[
            styles.radioInner,
            selected && [styles.radioInnerSelected, { backgroundColor: colors.ink }],
          ]}
        />
      </View>
    </Pressable>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  moveRow: {
    width: '100%',
    borderRadius: RADIUS.LG,
    borderWidth: 1,
    paddingVertical: SPACING.SM + 2,
    paddingHorizontal: SPACING.MD,
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
    marginBottom: SPACING.SM,
  },
  selectionPulse: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    width: 400,
    height: 400,
    marginLeft: -200,
    marginTop: -200,
    borderRadius: 200,
  },
  moveRowSelected: {
    borderWidth: 1,
  },
  moveStripe: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 10,
  },
  moveCopy: {
    flex: 1,
    paddingHorizontal: SPACING.SM,
    paddingLeft: SPACING.MD,
  },
  moveLabel: {},
  radioOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioOuterSelected: {},
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: 'transparent',
  },
  radioInnerSelected: {},
  pressed: {
    opacity: 0.9,
  },
  disabled: {
    opacity: 0.6,
  },
});

export default AnswerOption;
