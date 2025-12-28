import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Ripple } from '../animations';
import { withAlpha } from '../theme/utils';

interface SonarBackgroundProps {
  colors: {
    energy: string;
    background: string;
    primary: string;
    ink: string;
  };
  duration?: number;
}

const SonarTexture = ({ colors, duration = 5000 }: SonarBackgroundProps) => {
  return (
    <View style={styles.container} pointerEvents="none">
      {/* Rapid inner pulses */}
      <Ripple delay={0} duration={duration} color={withAlpha(colors.energy, 0.3)} endScale={6} />
      <Ripple delay={duration * 0.2} duration={duration} color={withAlpha(colors.energy, 0.2)} endScale={6} />
      <Ripple delay={duration * 0.4} duration={duration} color={withAlpha(colors.energy, 0.15)} endScale={6} />
      <Ripple delay={duration * 0.6} duration={duration} color={withAlpha(colors.energy, 0.1)} endScale={6} />
      <Ripple delay={duration * 0.8} duration={duration} color={withAlpha(colors.energy, 0.05)} endScale={6} />
      
      {/* Slower outer waves */}
      <Ripple delay={duration * 0.3} duration={duration * 2} color={withAlpha(colors.primary, 0.1)} endScale={6} />
      <Ripple delay={duration * 0.7} duration={duration * 2} color={withAlpha(colors.primary, 0.05)} endScale={6} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default SonarTexture;
