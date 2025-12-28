import LottieView from 'lottie-react-native';
import React from 'react';
import { StyleSheet, View } from 'react-native';

import footballAnimation from '../../assets/gifs/football.json';
import { useTheme } from '../ui/theme';

const SplashScreen = () => {
  const { colors } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LottieView source={footballAnimation} autoPlay loop style={styles.lottie} />
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
    width: 100,
    height: 100,
  },
});

export default SplashScreen;
