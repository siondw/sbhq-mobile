import {
  Poppins_400Regular,
  Poppins_500Medium,
  Poppins_600SemiBold,
  Poppins_700Bold,
} from '@expo-google-fonts/poppins';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { DefaultTheme, ThemeProvider as NavigationThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import * as Notifications from 'expo-notifications';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo } from 'react';
import 'react-native-reanimated';

import { THEME_CONFIG } from '../src/configs/constants';
import { NotificationProvider } from '../src/logic/contexts';
import { AuthProvider } from '../src/logic/hooks/AuthProvider';
import { useNotificationObserver } from '../src/logic/hooks/useNotificationObserver';
import CustomSplashScreen from '../src/screens/SplashScreen';
import {
  ThemeProvider as CustomThemeProvider,
  DARK_CARBON_TEAL_PALETTES,
  DEFAULT_THEME,
  isDarkHex,
  themeFromPlaygroundPalette,
} from '../src/ui/theme';

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from 'expo-router';

export const unstable_settings = {
  // Default to the app entry stack route.
  initialRouteName: 'index',
};

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: false,
    shouldShowList: false,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

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

  const selectedTheme = useMemo(() => {
    const paletteMatch = DARK_CARBON_TEAL_PALETTES.find(
      (item) => item.key === THEME_CONFIG.SELECTED_PALETTE,
    );
    if (!paletteMatch) {
      return DEFAULT_THEME;
    }
    return themeFromPlaygroundPalette(paletteMatch.palette);
  }, []);

  if (!loaded) {
    return (
      <CustomThemeProvider theme={selectedTheme}>
        <CustomSplashScreen />
      </CustomThemeProvider>
    );
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
      <NotificationProvider>
        <CustomThemeProvider theme={selectedTheme}>
          <NavigationThemeProvider value={DefaultTheme}>
            <StatusBar style={statusBarStyle} />
            <AppNavigator />
          </NavigationThemeProvider>
        </CustomThemeProvider>
      </NotificationProvider>
    </AuthProvider>
  );
}

/** Inner component that can safely use hooks requiring AuthProvider */
function AppNavigator() {
  useNotificationObserver();

  return (
    <Stack screenOptions={{ headerShown: false, gestureEnabled: false }}>
      <Stack.Screen name="index" />
      {__DEV__ ? <Stack.Screen name="playground" /> : null}
      <Stack.Screen name="contests/index" />
      <Stack.Screen name="(contest)" />
    </Stack>
  );
}
