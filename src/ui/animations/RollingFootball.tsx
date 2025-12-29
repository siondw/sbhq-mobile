import LottieView from 'lottie-react-native';
import React, { useEffect, useMemo } from 'react';
import { Dimensions, StyleSheet, View, type ViewStyle } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withRepeat,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';

import { darken, useTheme } from '../theme';
import { FOOTBALL_DARK_RED_KEYPATHS, FOOTBALL_RED_KEYPATHS, ROLLING_FOOTBALL } from './constants';

const SCREEN_WIDTH = Dimensions.get('window').width;

// Ellipse dimensions for "cam" effect (floor compensation)
const A = ROLLING_FOOTBALL.BALL_SIZE / 2;
const B = ROLLING_FOOTBALL.BALL_SIZE * 0.32;

// --- Inner Component: Single Ball Instance ---

interface FootballInstanceProps {
  translateX: SharedValue<number>;
  rotate: SharedValue<number>;
  offsetX?: number;
  offsetY?: number;
  scale?: number;
  opacity?: number;
}

const FootballInstance = ({
  translateX,
  rotate,
  offsetX = 0,
  offsetY = 0,
  scale = 1,
  opacity = 1,
}: FootballInstanceProps) => {
  const { colors } = useTheme();

  // Compensate vertical position so the ball rolls "on" the floor
  const translateY = useDerivedValue(() => {
    const rad = (rotate.value * Math.PI) / 180;
    const halfHeight = Math.sqrt(Math.pow(A * Math.sin(rad), 2) + Math.pow(B * Math.cos(rad), 2));
    return -(halfHeight - B) * 0.75 + offsetY;
  });

  const animatedStyle = useAnimatedStyle(() => ({
    opacity,
    transform: [
      { translateX: translateX.value + offsetX },
      { translateY: translateY.value },
      { rotate: `${rotate.value}deg` },
      { scale },
    ],
  }));

  const colorFilters = useMemo(() => {
    const primaryFilters = FOOTBALL_RED_KEYPATHS.map((keypath) => ({
      keypath,
      color: colors.primary,
    }));
    const darkFilters = FOOTBALL_DARK_RED_KEYPATHS.map((keypath) => ({
      keypath,
      color: darken(colors.primary, 0.4),
    }));
    return [...primaryFilters, ...darkFilters];
  }, [colors.primary]);

  return (
    <Animated.View style={[styles.ballWrapper, animatedStyle]}>
      <LottieView
        // eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-unsafe-assignment
        source={require('../../../assets/gifs/football_clean.json')}
        progress={5 / 162}
        style={styles.lottie}
        colorFilters={colorFilters}
      />
    </Animated.View>
  );
};

// --- Parent Component: The Track ---

interface RollingFootballProps {
  style?: ViewStyle;
}

const RollingFootball = ({ style }: RollingFootballProps) => {
  const startX = useMemo(() => -ROLLING_FOOTBALL.BALL_SIZE, []);
  const endX = useMemo(() => startX + SCREEN_WIDTH, [startX]);

  const translateX = useSharedValue(startX);
  const rotate = useSharedValue(0);

  useEffect(() => {
    translateX.value = startX;
    rotate.value = 0;

    const fullRotations = 8;

    // Continuous smooth rotation
    rotate.value = withRepeat(
      withTiming(360 * fullRotations, {
        duration: ROLLING_FOOTBALL.DURATION,
        easing: Easing.linear,
      }),
      -1,
      false,
    );

    // Continuous smooth translation
    translateX.value = withRepeat(
      withTiming(endX, {
        duration: ROLLING_FOOTBALL.DURATION,
        easing: Easing.linear,
      }),
      -1,
      false,
    );

    return () => {
      cancelAnimation(translateX);
      cancelAnimation(rotate);
    };
  }, [translateX, rotate, startX, endX]);

  return (
    <View style={[styles.container, style]} pointerEvents="none">
      {/* Primary Ball */}
      <FootballInstance translateX={translateX} rotate={rotate} />

      {/* Secondary Ball (Ahead) - loops back to become the Primary visually */}
      <FootballInstance
        translateX={translateX}
        rotate={rotate}
        offsetX={SCREEN_WIDTH}
        offsetY={-2} // Tiny vertical jitter
        scale={0.96} // Tiny scale difference
        opacity={0.85} // Slightly ghosted
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: ROLLING_FOOTBALL.BALL_SIZE,
    zIndex: 0,
  },
  ballWrapper: {
    position: 'absolute', // Important for multiple balls to coexist
    left: 0,
    bottom: 0,
    width: ROLLING_FOOTBALL.BALL_SIZE,
    height: ROLLING_FOOTBALL.BALL_SIZE,
  },
  lottie: {
    width: '100%',
    height: '100%',
  },
});

export default RollingFootball;
