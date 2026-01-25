import { Ionicons } from '@expo/vector-icons';
import { usePathname, useRouter } from 'expo-router';
import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { DEMO_CONTEST_ID } from '../../configs/constants';
import { ROUTES, buildLobbyRoute } from '../../configs/routes';
import Text from '../../ui/components/Text';
import DemoOverlay from '../../ui/components/DemoOverlay';
import GlassyTexture from '../../ui/textures/GlassyTexture';
import { SPACING, TYPOGRAPHY, useTheme, withAlpha } from '../../ui/theme';
import { lightImpact } from '../../utils/haptics';

export interface DemoModeContextValue {
  isDemoActive: boolean;
  startDemo: () => void;
  exitDemo: () => void;
  setDemoTip: (tip: string | null) => void;
}

const DemoModeContext = createContext<DemoModeContextValue | undefined>(undefined);

export const useDemoMode = (): DemoModeContextValue => {
  const context = useContext(DemoModeContext);
  if (!context) {
    throw new Error('useDemoMode must be used within DemoModeProvider');
  }
  return context;
};

export const DemoModeProvider = ({ children }: { children: React.ReactNode }) => {
  const router = useRouter();
  const [isDemoActive, setIsDemoActive] = useState(false);
  const [demoTip, setDemoTip] = useState<string | null>(null);

  const startDemo = useCallback(() => {
    setIsDemoActive(true);
    router.replace(buildLobbyRoute(DEMO_CONTEST_ID));
  }, [router]);

  const exitDemo = useCallback(() => {
    setIsDemoActive(false);
    setDemoTip(null);
    router.replace(ROUTES.CONTESTS);
  }, [router]);

  const value = useMemo(
    () => ({
      isDemoActive,
      startDemo,
      exitDemo,
      setDemoTip,
    }),
    [isDemoActive, startDemo, exitDemo],
  );

  return (
    <DemoModeContext.Provider value={value}>
      {children}
      {isDemoActive && <DemoOverlay tip={demoTip} />}
      {isDemoActive && <ExitDemoButton onPress={exitDemo} />}
    </DemoModeContext.Provider>
  );
};

// Only show exit button on demo-related screens
const DEMO_SCREEN_PREFIXES = ['/lobby', '/game', '/submitted', '/correct', '/eliminated', '/winner'];

const ExitDemoButton = ({ onPress }: { onPress: () => void }) => {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const pathname = usePathname();
  const styles = useMemo(
    () => createExitButtonStyles(colors, insets.bottom),
    [colors, insets.bottom],
  );

  const handlePress = useCallback(() => {
    lightImpact();
    onPress();
  }, [onPress]);

  // Don't render on non-demo screens (login, contests list, etc.)
  const isOnDemoScreen = DEMO_SCREEN_PREFIXES.some((prefix) => pathname.startsWith(prefix));
  if (!isOnDemoScreen) {
    return null;
  }

  return (
    <View style={styles.container} pointerEvents="box-none">
      <GlassyTexture colors={colors} showShine={false} style={styles.buttonWrapper}>
        <Pressable
          style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
          onPress={handlePress}
        >
          <Ionicons name="close-circle" size={18} color={colors.muted} />
          <Text weight="medium" style={styles.text}>
            Exit Demo
          </Text>
        </Pressable>
      </GlassyTexture>
    </View>
  );
};

const createExitButtonStyles = (
  colors: { surface: string; muted: string; border: string; ink: string; primary: string },
  bottomInset: number,
) =>
  StyleSheet.create({
    container: {
      position: 'absolute',
      bottom: bottomInset + SPACING.LG,
      left: 0,
      right: 0,
      alignItems: 'center',
      zIndex: 9998,
    },
    buttonWrapper: {
      backgroundColor: withAlpha(colors.surface, 0.9),
      borderRadius: 100,
      borderWidth: 1,
      borderColor: withAlpha(colors.primary, 0.2),
      shadowColor: colors.ink,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 8,
      elevation: 6,
    },
    button: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: SPACING.SM,
      paddingVertical: SPACING.SM,
      paddingHorizontal: SPACING.MD,
    },
    buttonPressed: {
      opacity: 0.7,
    },
    text: {
      fontSize: TYPOGRAPHY.SMALL,
      color: colors.muted,
    },
  });
