import { useEffect, useRef } from 'react';
import { Animated } from 'react-native';
import { SHINE_PRESET } from './constants';
import type { ShineAnimationResult, UseShineAnimationOptions } from './types';

// Example: useShineAnimation({ preset: 'subtle' })
export const useShineAnimation = (options: UseShineAnimationOptions = {}): ShineAnimationResult => {
  const {
    preset = 'SUBTLE',
    delay: customDelay,
    duration: customDuration,
    maxOpacity: customMaxOpacity,
    containerOpacity: customContainerOpacity,
    startX = -200,
    endX = 600,
  } = options;

  const presetConfig = SHINE_PRESET[preset];

  const delay = customDelay ?? presetConfig.delay;
  const duration = customDuration ?? presetConfig.duration;
  const maxOpacity = customMaxOpacity ?? presetConfig.maxOpacity;
  const containerOpacity = customContainerOpacity ?? presetConfig.containerOpacity;

  const shine = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const shineAnim = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(shine, {
          toValue: 1,
          duration,
          useNativeDriver: true,
        }),
        Animated.timing(shine, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        }),
      ]),
    );
    shineAnim.start();
    return () => shineAnim.stop();
  }, [shine, delay, duration]);

  const translateX = shine.interpolate({
    inputRange: [0, 1],
    outputRange: [startX, endX],
  });

  return {
    translateX,
    config: {
      maxOpacity,
      containerOpacity,
    },
  };
};

export const usePulseAnimation = (duration: number = 900) => {
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration, useNativeDriver: true }),
      ]),
    );
    anim.start();
    return () => anim.stop();
  }, [pulse, duration]);

  const opacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.55, 1] });
  const scale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.35] });

  return { opacity, scale };
};
