import {
  Poppins_400Regular,
  Poppins_500Medium,
  Poppins_600SemiBold,
  Poppins_700Bold,
} from '@expo-google-fonts/poppins';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { DefaultTheme, ThemeProvider as NavigationThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo } from 'react';
import 'react-native-reanimated';

import { THEME_CONFIG } from '../src/configs/constants';
import { AuthProvider } from '../src/logic/hooks/AuthProvider';
import {
  ThemeProvider as CustomThemeProvider,
  DARK_CARBON_TEAL_PALETTES,
  DEFAULT_THEME,
  isDarkHex,
  themeFromPlaygroundPalette,
} from '../src/ui/theme';

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary
} from 'expo-router';

export const unstable_settings = {
  // Default to the app entry stack route.
  initialRouteName: 'index',
};

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold,
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    ...FontAwesome.font,
  });

  // Expo Router uses Error Boundaries to catch errors in the navigation tree.
  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return <RootLayoutNav />;
}

function RootLayoutNav() {
  const selectedTheme = useMemo(() => {
    const paletteMatch = DARK_CARBON_TEAL_PALETTES.find(
      (item) => item.key === THEME_CONFIG.SELECTED_PALETTE,
    );
    if (!paletteMatch) {
      return DEFAULT_THEME;
    }
    return themeFromPlaygroundPalette(paletteMatch.palette);
  }, []);

  const statusBarStyle = useMemo(() => {
    return isDarkHex(selectedTheme.colors.background) ? 'light' : 'dark';
  }, [selectedTheme]);

  return (
    <AuthProvider>
      <CustomThemeProvider theme={selectedTheme}>
        <NavigationThemeProvider value={DefaultTheme}>
          <StatusBar style={statusBarStyle} />
          <Stack screenOptions={{ headerShown: false, gestureEnabled: false }}>
            <Stack.Screen name="index" />
            {__DEV__ ? <Stack.Screen name="playground" /> : null}
            <Stack.Screen name="contests/index" />
            <Stack.Screen name="contest/[contestId]" />
            <Stack.Screen name="lobby/index" />
            <Stack.Screen name="submitted/index" />
            <Stack.Screen name="correct/index" />
            <Stack.Screen name="eliminated/index" />
            <Stack.Screen name="winner/index" />
          </Stack>
        </NavigationThemeProvider>
      </CustomThemeProvider>
    </AuthProvider>
  );
}
