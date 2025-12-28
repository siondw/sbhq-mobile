import MaskedView from '@react-native-masked-view/masked-view';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { useTheme } from '../theme';
import Text from './Text';

interface HeroCountdownProps {
  targetTime: number;
  onComplete?: () => void;
}

const HeroCountdown = ({ targetTime, onComplete }: HeroCountdownProps) => {
  const { colors } = useTheme();
  const [remainingMs, setRemainingMs] = useState(targetTime - Date.now());
  const scale = useSharedValue(1);

  useEffect(() => {
    const interval = setInterval(() => {
      const delta = targetTime - Date.now();
      setRemainingMs(delta);
      
      // Pulse animation on every second
      scale.value = withSequence(
        withTiming(1.05, { duration: 100 }),
        withTiming(1, { duration: 100 })
      );

      if (delta <= 0) {
        clearInterval(interval);
        if (onComplete) {
          onComplete();
        }
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [targetTime, onComplete, scale]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
    };
  });

  const seconds = Math.max(0, Math.floor(remainingMs / 1000));
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  
  const displayHours = hours.toString().padStart(2, '0');
  const displayMinutes = (minutes % 60).toString().padStart(2, '0');
  const displaySeconds = (seconds % 60).toString().padStart(2, '0');

  const display = hours > 0 
    ? `${displayHours}:${displayMinutes}:${displaySeconds}`
    : `${displayMinutes}:${displaySeconds}`;

  return (
    <Animated.View style={[styles.container, animatedStyle]}>
      <MaskedView
        maskElement={
          <View style={styles.maskContainer}>
            <Text weight="bold" style={styles.text}>
              {display}
            </Text>
          </View>
        }
      >
        <LinearGradient
          colors={[colors.energy, colors.primary] as const}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradient}
        >
          {/* Invisible text to maintain layout */}
          <Text weight="bold" style={[styles.text, { opacity: 0 }]}>
            {display}
          </Text>
        </LinearGradient>
      </MaskedView>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  maskContainer: {
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  gradient: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontSize: 84, // Massive font size
    letterSpacing: -2,
    fontVariant: ['tabular-nums'], // Monospace numbers to prevent jumping
    includeFontPadding: false,
    lineHeight: 100, // Increased to prevent clipping
    paddingVertical: 10, // Added breathing room
  },
});

export default HeroCountdown;
