import LottieView from 'lottie-react-native';
import React from 'react';
import { StyleSheet, View } from 'react-native';

import footballAnimation from '../../../assets/gifs/football.json';
import { SPACING, useTheme } from '../theme';

const LoadingView = () => {
  const { colors } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LottieView source={footballAnimation} autoPlay loop style={styles.lottie} />
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
