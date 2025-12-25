import type { Animated } from 'react-native';
import type { SELECTION_PRESET, SHINE_PRESET } from './constants';

export type ShinePreset = keyof typeof SHINE_PRESET;
export type SelectionPreset = keyof typeof SELECTION_PRESET;

export interface UseShineAnimationOptions {
  preset?: ShinePreset;
  delay?: number;
  duration?: number;
  maxOpacity?: number;
  containerOpacity?: number;
  startX?: number;
  endX?: number;
  loop?: boolean;
}

export interface ShineAnimationResult {
  translateX: Animated.AnimatedInterpolation<number> | Animated.Value;
  opacity?: Animated.Value;
  trigger?: () => void;
  config: {
    maxOpacity: number;
    containerOpacity: number;
  };
}

export interface SelectionAnimationResult {
  scale: Animated.Value;
  opacity: Animated.Value;
  buttonScale: Animated.Value;
}

export interface UseSelectionAnimationOptions {
  preset?: SelectionPreset;
  tension?: number;
  friction?: number;
  deselectionDuration?: number;
}
