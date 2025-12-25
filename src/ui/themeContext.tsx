import React, { createContext, useContext, useMemo } from 'react';

import type { PlaygroundPalette } from './playgroundPalettes';
import { COLORS } from './theme';

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

function isDarkHex(hex: string): boolean {
  const normalized = hex.replace('#', '');
  if (normalized.length !== 6) return false;
  const r = parseInt(normalized.slice(0, 2), 16) / 255;
  const g = parseInt(normalized.slice(2, 4), 16) / 255;
  const b = parseInt(normalized.slice(4, 6), 16) / 255;
  const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  return luminance < 0.45;
}

function withAlpha(hex: string, alpha: number): string {
  const normalized = hex.replace('#', '');
  if (normalized.length !== 6) return `rgba(0,0,0,${alpha})`;
  const r = parseInt(normalized.slice(0, 2), 16);
  const g = parseInt(normalized.slice(2, 4), 16);
  const b = parseInt(normalized.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

export function textOnHex(hex: string): '#FFFFFF' | '#0B0F14' {
  return isDarkHex(hex) ? '#FFFFFF' : '#0B0F14';
}

export const DEFAULT_THEME: Theme = {
  colors: {
    background: COLORS.BACKGROUND,
    surface: COLORS.SURFACE,
    text: COLORS.TEXT,
    muted: COLORS.MUTED,
    border: COLORS.BORDER,
    primary: COLORS.PRIMARY,
    ink: COLORS.PRIMARY_DARK,
    energy: COLORS.GRADIENT_START,
    warm: COLORS.ACCENT,
    success: COLORS.PRIMARY,
    danger: COLORS.ELIMINATED_START,
    overlay: COLORS.OVERLAY,
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

