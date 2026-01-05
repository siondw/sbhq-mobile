import * as Haptics from 'expo-haptics';
import { Vibration } from 'react-native';

/**
 * Light selection haptic - use for answer option selection
 */
export const selectionHaptic = () => {
  void Haptics.selectionAsync();
};

/**
 * Light impact - use for countdown ticks, join contest button
 */
export const lightImpact = () => {
  void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
};

/**
 * Heavy impact - use for submit button
 */
export const heavyImpact = () => {
  void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
};

/**
 * Elimination haptic - long 3-second vibration for dramatic "you're out" feel
 */
export const eliminationHaptic = () => {
  Vibration.vibrate(3000);
};

/**
 * Success notification haptic - use for correct answer reveal
 */
export const successHaptic = () => {
  void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
};

/**
 * Celebration haptic pattern - use for winner screen
 * Staggered burst: Success -> Light -> Medium -> Light -> Heavy
 */
export const celebrationHaptic = () => {
  void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  setTimeout(() => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, 140);
  setTimeout(() => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }, 280);
  setTimeout(() => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, 430);
  setTimeout(() => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
  }, 620);
};

type CelebrationLoopOptions = {
  initialDelayMs?: number;
  intervalMs?: number;
  pulseDelaysMs?: number[];
  pulseStyles?: Haptics.ImpactFeedbackStyle[];
  pulseStyle?: 'light' | 'medium' | 'heavy';
};

/**
 * Loop short celebration pulses to match fireworks cadence.
 * Returns a cleanup function to stop the loop.
 */
export const startCelebrationHapticLoop = (options: CelebrationLoopOptions = {}) => {
  const intervalMs = options.intervalMs ?? 2200;
  const pulseDelaysMs = options.pulseDelaysMs ?? [0, 160, 320, 520];
  const basePulseStyle = options.pulseStyle
    ? options.pulseStyle === 'heavy'
      ? Haptics.ImpactFeedbackStyle.Heavy
      : options.pulseStyle === 'medium'
        ? Haptics.ImpactFeedbackStyle.Medium
        : Haptics.ImpactFeedbackStyle.Light
    : null;
  const pulseStyles =
    options.pulseStyles ??
    (basePulseStyle
      ? Array.from({ length: pulseDelaysMs.length }, () => basePulseStyle)
      : [
          Haptics.ImpactFeedbackStyle.Light,
          Haptics.ImpactFeedbackStyle.Light,
          Haptics.ImpactFeedbackStyle.Medium,
          Haptics.ImpactFeedbackStyle.Light,
        ]);
  const initialDelayMs = options.initialDelayMs ?? 0;

  const activeTimeouts = new Set<ReturnType<typeof setTimeout>>();
  let intervalId: ReturnType<typeof setInterval> | null = null;
  let startTimeout: ReturnType<typeof setTimeout> | null = null;

  const schedulePulse = (delayMs: number, style: Haptics.ImpactFeedbackStyle) => {
    const timeoutId = setTimeout(() => {
      void Haptics.impactAsync(style);
      activeTimeouts.delete(timeoutId);
    }, delayMs);
    activeTimeouts.add(timeoutId);
  };

  const fireBurst = () => {
    pulseDelaysMs.forEach((delayMs, index) => {
      const style = pulseStyles[index] ?? Haptics.ImpactFeedbackStyle.Light;
      schedulePulse(delayMs, style);
    });
  };

  const startLoop = () => {
    fireBurst();
    intervalId = setInterval(fireBurst, intervalMs);
  };

  if (initialDelayMs > 0) {
    startTimeout = setTimeout(startLoop, initialDelayMs);
  } else {
    startLoop();
  }

  return () => {
    if (startTimeout) {
      clearTimeout(startTimeout);
    }
    if (intervalId) {
      clearInterval(intervalId);
    }
    activeTimeouts.forEach((timeoutId) => clearTimeout(timeoutId));
    activeTimeouts.clear();
  };
};
