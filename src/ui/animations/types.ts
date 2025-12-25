import { Animated } from 'react-native';
import { SHINE_PRESET } from './constants';

export type ShinePreset = keyof typeof SHINE_PRESET;

export interface UseShineAnimationOptions {
  preset?: ShinePreset;
  delay?: number;
  duration?: number;
  maxOpacity?: number;
  containerOpacity?: number;
  startX?: number;
  endX?: number;
}

export interface ShineAnimationResult {
  translateX: Animated.AnimatedInterpolation<number>;
  config: {
    maxOpacity: number;
    containerOpacity: number;
  };
}
