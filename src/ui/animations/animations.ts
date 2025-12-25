import { useEffect, useRef } from 'react';
import { Animated } from 'react-native';
import { SELECTION_PRESET, SHINE_PRESET } from './constants';
import type {
    SelectionAnimationResult,
    ShineAnimationResult,
    UseSelectionAnimationOptions,
    UseShineAnimationOptions,
} from './types';

export const useShineAnimation = (options: UseShineAnimationOptions = {}): ShineAnimationResult => {
  const {
    preset = 'SUBTLE',
    delay: customDelay,
    duration: customDuration,
    maxOpacity: customMaxOpacity,
    containerOpacity: customContainerOpacity,
    startX = -200,
    endX = 600,
    loop = false,
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

export const useSelectionAnimation = (
  selected: boolean,
  options: UseSelectionAnimationOptions = {},
): SelectionAnimationResult => {
  const {
    preset = 'NORMAL',
    tension: customTension,
    friction: customFriction,
    deselectionDuration: customDeselectionDuration,
  } = options;

  const presetConfig = SELECTION_PRESET[preset];

  const tension = customTension ?? presetConfig.tension;
  const friction = customFriction ?? presetConfig.friction;
  const deselectionDuration = customDeselectionDuration ?? presetConfig.deselectionDuration;

  const scaleAnim = useRef(new Animated.Value(0)).current;
  const buttonScaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (selected) {
      // Reset to 0 first to ensure fresh animation every time
      scaleAnim.setValue(0);
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        tension,
        friction,
      }).start();

      // Button scale animation (fixed 1.05)
      Animated.spring(buttonScaleAnim, {
        toValue: 1.05,
        useNativeDriver: true,
        tension: 60,
        friction: 7,
      }).start();
    } else {
      Animated.timing(scaleAnim, {
        toValue: 0,
        duration: deselectionDuration,
        useNativeDriver: true,
      }).start();

      // Button scale deselection
      Animated.spring(buttonScaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        tension: 60,
        friction: 7,
      }).start();
    }
  }, [selected, scaleAnim, buttonScaleAnim, tension, friction, deselectionDuration]);

  return {
    scale: scaleAnim,
    opacity: scaleAnim,
    buttonScale: buttonScaleAnim,
  };
};
