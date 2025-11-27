import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useState } from 'react';
import { StyleSheet } from 'react-native';
import { COLORS, RADIUS, SPACING } from '../theme';
import Text from './Text';

interface CountdownProps {
  /** Target time in milliseconds since epoch */
  targetTime: number;
  onComplete?: () => void;
}

const Countdown = ({ targetTime, onComplete }: CountdownProps) => {
  const [remainingMs, setRemainingMs] = useState(targetTime - Date.now());

  useEffect(() => {
    const interval = setInterval(() => {
      const delta = targetTime - Date.now();
      setRemainingMs(delta);
      if (delta <= 0) {
        clearInterval(interval);
        if (onComplete) {
          onComplete();
        }
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [targetTime, onComplete]);

  const seconds = Math.max(0, Math.floor(remainingMs / 1000));
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  const display = `${minutes.toString().padStart(2, '0')}:${remainingSeconds
    .toString()
    .padStart(2, '0')}`;

  return (
    <LinearGradient
      colors={[COLORS.GRADIENT_START, COLORS.GRADIENT_END]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      <Text weight="bold" style={styles.text}>
        {display}
      </Text>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: SPACING.LG,
    paddingVertical: SPACING.MD,
    borderRadius: RADIUS.LG,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontSize: 64,
    color: '#FFFFFF',
    letterSpacing: 4,
  },
});

export default Countdown;
