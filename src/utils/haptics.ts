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
 * Multiple pulses: Heavy -> Medium -> Medium -> Heavy
 */
export const celebrationHaptic = () => {
  void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
  setTimeout(() => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }, 150);
  setTimeout(() => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }, 300);
  setTimeout(() => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
  }, 450);
};
