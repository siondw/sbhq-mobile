import React, { createContext, useContext, useMemo } from 'react';

import type { PlaygroundPalette } from './palettes';
import { DEFAULT_PALETTE } from './palettes';
import { textOnHex, withAlpha } from './utils';

export type ThemeColors = {
  background: string;
  surface: string;
  text: string;
  muted: string;
  border: string;
  primary: string;
  ink: string;
  energy: string;
  warm: string;
  success: string;
  danger: string;
  overlay: string;
};

export type Theme = {
  colors: ThemeColors;
};

export const DEFAULT_THEME: Theme = {
  colors: {
    background: DEFAULT_PALETTE.bg,
    surface: DEFAULT_PALETTE.surface,
    text: DEFAULT_PALETTE.ink,
    muted: withAlpha(DEFAULT_PALETTE.ink, 0.68),
    border: withAlpha(DEFAULT_PALETTE.ink, 0.14),
    primary: DEFAULT_PALETTE.primary,
    ink: DEFAULT_PALETTE.ink,
    energy: DEFAULT_PALETTE.energy,
    warm: DEFAULT_PALETTE.warm,
    success: DEFAULT_PALETTE.success,
    danger: DEFAULT_PALETTE.danger,
    overlay: withAlpha('#000000', 0.05),
  },
};

const ThemeContext = createContext<Theme>(DEFAULT_THEME);

export const ThemeProvider = ({
  theme,
  children,
}: {
  theme: Theme;
  children: React.ReactNode;
}) => {
  return <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>;
};

export function useTheme(): Theme {
  return useContext(ThemeContext);
}

export function themeFromPlaygroundPalette(palette: PlaygroundPalette): Theme {
  const border = withAlpha(palette.ink, 0.14);
  const muted = withAlpha(palette.ink, 0.68);
  const overlay = withAlpha('#000000', 0.05);
  return {
    colors: {
      background: palette.bg,
      surface: palette.surface,
      text: palette.ink,
      muted,
      border,
      primary: palette.primary,
      ink: palette.ink,
      energy: palette.energy,
      warm: palette.warm,
      success: palette.success,
      danger: palette.danger,
      overlay,
    },
  };
}

export function useTextOn(hex: string): '#FFFFFF' | '#0B0F14' {
  return useMemo(() => textOnHex(hex), [hex]);
}
