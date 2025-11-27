export const COLORS = {
  BACKGROUND: '#ECD5BB',   // champagne, keep
  PRIMARY: '#567C6A',      // softer pine green
  PRIMARY_DARK: '#354A57', // muted blue-gray
  GRADIENT_START: '#5F8C78', // sage/teal-ish, closer to PRIMARY
  GRADIENT_END: '#354A57',   // ties into PRIMARY_DARK
  SURFACE: '#FFFFFF',
  TEXT: '#1F2933',         // slightly softer than pure near-black
  MUTED: '#6B7280',        // more neutral gray
  BORDER: '#E5D6C5',       // warmer border to match BACKGROUND
  ACCENT: '#E08A5C',       // warm terracotta accent, complements champagne
  ELIMINATED_START: '#9F2430', // softer, still “error”
  ELIMINATED_END: '#354A57',   // re-use PRIMARY_DARK for consistency
  OVERLAY: 'rgba(0,0,0,0.03)',
};


export const SPACING: { [key: string]: number } = {
  XS: 8,
  SM: 12,
  MD: 16,
  LG: 20,
  XL: 24,
  XXL: 32,
};

export const RADIUS: { [key: string]: number } = {
  SM: 8,
  MD: 12,
  LG: 16,
};

export const HEADER_HEIGHT = 64;

export const TYPOGRAPHY = {
  TITLE: 24,
  SUBTITLE: 18,
  BODY: 16,
  SMALL: 14,
  FONT_FAMILY_REGULAR: 'Poppins_400Regular',
  FONT_FAMILY_MEDIUM: 'Poppins_500Medium',
  FONT_FAMILY_SEMIBOLD: 'Poppins_600SemiBold',
  FONT_FAMILY_BOLD: 'Poppins_700Bold',
};
