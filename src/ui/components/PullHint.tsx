import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { ANIMATION_DELAY, ANIMATION_DURATION } from '../animations';
import { SPACING, TYPOGRAPHY, useTheme } from '../theme';
import Text from './Text';

interface PullHintProps {
  onDismiss: () => void;
}

const PullHint = ({ onDismiss }: PullHintProps) => {
  const { colors } = useTheme();
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(-10)).current;

  useEffect(() => {
    // Fade in + slide down
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: ANIMATION_DURATION.NORMAL,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: ANIMATION_DURATION.NORMAL,
        useNativeDriver: true,
      }),
    ]).start();

    // After delay, fade out + slide up, then dismiss
    const timeout = setTimeout(() => {
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 0,
          duration: ANIMATION_DURATION.NORMAL,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: -10,
          duration: ANIMATION_DURATION.NORMAL,
          useNativeDriver: true,
        }),
      ]).start(() => {
        onDismiss();
      });
    }, ANIMATION_DELAY.LONG);

    return () => clearTimeout(timeout);
  }, [opacity, translateY, onDismiss]);

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity,
          transform: [{ translateY }],
        },
      ]}
    >
      <View style={styles.content}>
        <Ionicons name="arrow-down" size={16} color={colors.muted} />
        <Text style={[styles.text, { color: colors.muted }]}>Pull to refresh</Text>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: SPACING.SM,
  },
  content: {
    alignItems: 'center',
    gap: 4,
  },
  text: {
    fontSize: TYPOGRAPHY.SMALL,
  },
});

export default PullHint;
