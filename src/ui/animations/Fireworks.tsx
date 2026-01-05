import React, { useEffect, useMemo } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';

import { RADIUS, type ThemeColors } from '../theme';

type FireworkParticle = {
  angle: number;
  distance: number;
  size: number;
  color: string;
  opacityScale: number;
};

type FireworkBurst = {
  id: string;
  origin: { x: number; y: number };
  delay: number;
  particles: FireworkParticle[];
  ringColor: string;
};

const buildFireworkParticles = (
  count: number,
  palette: string[],
  distanceRange: [number, number],
  sizeRange: [number, number],
  opacityRange: [number, number],
): FireworkParticle[] => {
  return Array.from({ length: count }, () => {
    const angle = Math.random() * Math.PI * 2;
    const distance =
      distanceRange[0] + Math.random() * (distanceRange[1] - distanceRange[0]);
    const size = sizeRange[0] + Math.random() * (sizeRange[1] - sizeRange[0]);
    const opacityScale =
      opacityRange[0] + Math.random() * (opacityRange[1] - opacityRange[0]);
    const color = palette[Math.floor(Math.random() * palette.length)] ?? palette[0];
    return { angle, distance, size, color, opacityScale };
  });
};

const Fireworks = ({ colors }: { colors: ThemeColors }) => {
  const palette = useMemo(
    () => [colors.energy, colors.warm, colors.primary, colors.success],
    [colors.energy, colors.primary, colors.success, colors.warm],
  );

  const bursts = useMemo<FireworkBurst[]>(() => {
    const buildBurst = (
      id: string,
      origin: { x: number; y: number },
      delay: number,
      ringColor: string,
      coreCount: number,
      sparkCount: number,
    ): FireworkBurst => ({
      id,
      origin,
      delay,
      ringColor,
      particles: [
        ...buildFireworkParticles(coreCount, palette, [28, 60], [4, 7], [0.7, 1]),
        ...buildFireworkParticles(sparkCount, palette, [52, 96], [2, 4], [0.35, 0.7]),
      ],
    });

    return [
      buildBurst('left', { x: -110, y: -60 }, 0, palette[0] ?? '#ffffff', 12, 8),
      buildBurst('right', { x: 120, y: -70 }, 160, palette[1] ?? '#ffffff', 12, 8),
      buildBurst('top', { x: 10, y: -130 }, 320, palette[2] ?? '#ffffff', 12, 8),
      buildBurst('bottom', { x: -80, y: 110 }, 480, palette[3] ?? '#ffffff', 12, 8),
      buildBurst('top-left', { x: -120, y: -130 }, 640, palette[1] ?? '#ffffff', 10, 7),
      buildBurst('top-right', { x: 120, y: -120 }, 820, palette[0] ?? '#ffffff', 10, 7),
    ];
  }, [palette]);

  const burstAnimations = useMemo(
    () => bursts.map(() => new Animated.Value(0)),
    [bursts],
  );

  useEffect(() => {
    burstAnimations.forEach((anim) => anim.setValue(0));
    const loops = burstAnimations.map((anim, index) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(bursts[index]?.delay ?? 0),
          Animated.timing(anim, {
            toValue: 1,
            duration: 1200,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(anim, {
            toValue: 0,
            duration: 0,
            useNativeDriver: true,
          }),
          Animated.delay(900),
        ]),
      ),
    );

    loops.forEach((loop) => loop.start());
    return () => loops.forEach((loop) => loop.stop());
  }, [bursts, burstAnimations]);

  return (
    <View pointerEvents="none" style={styles.fireworksLayer}>
      {bursts.map((burst, burstIndex) => {
        const progress = burstAnimations[burstIndex];
        const opacity = progress.interpolate({
          inputRange: [0, 0.2, 0.8, 1],
          outputRange: [0, 1, 0.8, 0],
        });
        const scale = progress.interpolate({
          inputRange: [0, 0.6, 1],
          outputRange: [0.4, 1, 0.7],
        });
        const ringScale = progress.interpolate({
          inputRange: [0, 0.6, 1],
          outputRange: [0.2, 1, 1.25],
        });
        const ringOpacity = progress.interpolate({
          inputRange: [0, 0.2, 0.7, 1],
          outputRange: [0, 0.8, 0.35, 0],
        });

        return (
          <View
            key={burst.id}
            style={[
              styles.fireworkBurst,
              {
                transform: [{ translateX: burst.origin.x }, { translateY: burst.origin.y }],
              },
            ]}
          >
            <Animated.View
              style={[
                styles.fireworkRing,
                {
                  borderColor: burst.ringColor,
                  opacity: ringOpacity,
                  transform: [{ scale: ringScale }],
                },
              ]}
            />
            <Animated.View
              style={[
                styles.fireworkFlash,
                {
                  backgroundColor: burst.ringColor,
                  opacity: ringOpacity,
                  transform: [{ scale: ringScale }],
                },
              ]}
            />
            {burst.particles.map((particle, particleIndex) => {
              const translateX = progress.interpolate({
                inputRange: [0, 1],
                outputRange: [0, Math.cos(particle.angle) * particle.distance],
              });
              const translateY = progress.interpolate({
                inputRange: [0, 1],
                outputRange: [0, Math.sin(particle.angle) * particle.distance],
              });

              return (
                <Animated.View
                  key={`${burst.id}-${particleIndex}`}
                  style={[
                    styles.fireworkParticle,
                    {
                      width: particle.size,
                      height: particle.size,
                      backgroundColor: particle.color,
                      opacity: Animated.multiply(opacity, particle.opacityScale),
                      transform: [{ translateX }, { translateY }, { scale }],
                    },
                  ]}
                />
              );
            })}
          </View>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  fireworksLayer: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'visible',
  },
  fireworkBurst: {
    position: 'absolute',
    left: '50%',
    top: '50%',
    width: 0,
    height: 0,
  },
  fireworkRing: {
    position: 'absolute',
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1.4,
  },
  fireworkFlash: {
    position: 'absolute',
    width: 14,
    height: 14,
    borderRadius: 7,
  },
  fireworkParticle: {
    position: 'absolute',
    borderRadius: RADIUS.SM,
  },
});

export default Fireworks;
