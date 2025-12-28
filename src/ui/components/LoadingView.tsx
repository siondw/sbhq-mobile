import LottieView from 'lottie-react-native';
import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

import footballAnimation from '../../../assets/gifs/football.json';
import { FOOTBALL_DARK_RED_KEYPATHS, FOOTBALL_RED_KEYPATHS } from '../animations/constants';
import { SPACING, useTheme } from '../theme';
import { darken } from '../theme/utils';

const LoadingView = () => {
  const { colors } = useTheme();

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
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LottieView
        source={footballAnimation}
        autoPlay
        loop
        style={styles.lottie}
        colorFilters={colorFilters}
      />
      {/* Intentionally left blank: no text label shown during loading */}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  lottie: {
    width: 80,
    height: 80,
  },
  text: {
    fontSize: 14,
    marginTop: SPACING.SM,
  },
});

export default LoadingView;
