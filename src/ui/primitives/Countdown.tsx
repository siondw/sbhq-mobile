import React, { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import Text from './Text';
import { COLORS, RADIUS, SPACING } from '../theme';

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
    <View style={styles.container}>
      <Text weight="bold" style={styles.text}>
        {display}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: SPACING.LG,
    paddingVertical: SPACING.MD,
    borderRadius: RADIUS.LG,
    backgroundColor: COLORS.PRIMARY,
    shadowColor: COLORS.PRIMARY_DARK,
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontSize: 48,
    color: '#FFFFFF',
    letterSpacing: 4,
  },
});

export default Countdown;
