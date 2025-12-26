import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { Animated, StyleSheet, View } from 'react-native';

import { useShineAnimation } from '../animations';
import { withAlpha } from '../theme';
import type { GlassyTextureProps } from './types';

const GlassyTexture = ({
  colors,
  shinePreset = 'SUBTLE',
  showShine = true,
  style,
  children,
}: GlassyTextureProps) => {
  const { translateX: shineTranslateX, config } = useShineAnimation({ preset: shinePreset });

  return (
    <View style={[styles.container, style]}>
      {children}
      <LinearGradient
        colors={[withAlpha(colors.ink, 0.08), 'rgba(0,0,0,0.04)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradientOverlay}
        pointerEvents="none"
      />
      {showShine && (
        <Animated.View
          style={[
            styles.shineContainer,
            {
              opacity: config.containerOpacity,
              transform: [{ translateX: shineTranslateX }, { rotate: '35deg' }],
            },
          ]}
          pointerEvents="none"
        >
          <LinearGradient
            colors={[
              'rgba(255, 255, 255, 0)',
              `rgba(255, 255, 255, ${config.maxOpacity * 0.5})`,
              `rgba(255, 255, 255, ${config.maxOpacity})`,
              `rgba(255, 255, 255, ${config.maxOpacity * 0.5})`,
              'rgba(255, 255, 255, 0)',
            ]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.shine}
          />
        </Animated.View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    overflow: 'hidden',
  },
  gradientOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1,
  },
  shineContainer: {
    position: 'absolute',
    top: -30,
    left: -80,
    width: 280,
    height: 120,
    borderRadius: 60,
    overflow: 'hidden',
    zIndex: 2,
  },
  shine: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
});

export default GlassyTexture;
