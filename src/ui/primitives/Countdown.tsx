import React, { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import Text from './Text';
import { COLORS, RADIUS, SPACING, TYPOGRAPHY } from '../theme';

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
    paddingHorizontal: SPACING.SM + 2,
    paddingVertical: SPACING.XS,
    borderRadius: RADIUS.MD,
    backgroundColor: COLORS.ACCENT,
  },
  text: {
    fontSize: TYPOGRAPHY.SUBTITLE,
    color: COLORS.PRIMARY_DARK,
  },
});

export default Countdown;
