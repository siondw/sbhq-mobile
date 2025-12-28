import React, { useEffect } from 'react';
import { StyleSheet, ViewStyle } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

interface RippleProps {
  delay?: number;
  duration?: number;
  color: string;
  startScale?: number;
  endScale?: number;
  style?: ViewStyle;
}

export const Ripple = ({
  delay = 0,
  duration = 4000,
  color,
  startScale = 0,
  endScale = 4,
  style,
}: RippleProps) => {
  const scale = useSharedValue(startScale);
  const opacity = useSharedValue(0.8);

  useEffect(() => {
    scale.value = withRepeat(
      withDelay(
        delay,
        withTiming(endScale, {
          duration,
          easing: Easing.out(Easing.ease),
        })
      ),
      -1,
      false,
    );

    opacity.value = withRepeat(
      withDelay(
        delay,
        withTiming(0, {
          duration,
          easing: Easing.out(Easing.ease),
        })
      ),
      -1,
      false,
    );
  }, [duration, delay, startScale, endScale, scale, opacity]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
      opacity: opacity.value,
    };
  });

  return (
    <Animated.View
      style={[
        styles.ring,
        { borderColor: color },
        style,
        animatedStyle,
      ]}
    />
  );
};

const styles = StyleSheet.create({
  ring: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 1,
  },
});
