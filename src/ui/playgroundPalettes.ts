export type PlaygroundPalette = {
  bg: string;
  surface: string;
  ink: string; // primary text / “ink”
  primary: string; // CTA
  energy: string; // timer/selection
  warm: string; // reward
  success: string;
  danger: string;
};

export const DARK_CARBON_TEAL_PALETTES: { key: string; name: string; palette: PlaygroundPalette }[] = [
  {
    key: 'carbon-teal-classic',
    name: 'Carbon + Teal (Classic)',
    palette: {
      bg: '#0B0F14',
      surface: '#121826',
      ink: '#F1F5F9',
      primary: '#0F766E',
      energy: '#25D6D9',
      warm: '#FF8A4C',
      success: '#10B981',
      danger: '#F43F5E',
    },
  },
  {
    key: 'carbon-yellow-pro',
    name: 'Carbon + Yellow (Primary)',
    palette: {
      bg: '#0B0F14',
      surface: '#141B2A',
      ink: '#F8FAFC',
      primary: '#FFB703',
      energy: '#FFD24A',
      warm: '#FF8A00',
      success: '#22C55E',
      danger: '#FF2E4D',
    },
  },
  {
    key: 'carbon-gold-teal',
    name: 'Carbon + Gold (Primary) + Teal Energy',
    palette: {
      bg: '#070A12',
      surface: '#0F172A',
      ink: '#EAF2FF',
      primary: '#FFD166',
      energy: '#FFE29A',
      warm: '#FF7A00',
      success: '#33D17A',
      danger: '#FB7185',
    },
  },
  {
    key: 'carbon-ice-teal',
    name: 'Carbon + Ice Teal',
    palette: {
      bg: '#0A1018',
      surface: '#121C2B',
      ink: '#F1F5F9',
      primary: '#0F766E',
      energy: '#67E8F9',
      warm: '#FDBA74',
      success: '#34D399',
      danger: '#E11D48',
    },
  },
  {
    key: 'carbon-mint-teal',
    name: 'Carbon + Mint Teal',
    palette: {
      bg: '#091016',
      surface: '#101A26',
      ink: '#F8FAFC',
      primary: '#059669',
      energy: '#2EE6A6',
      warm: '#FFB020',
      success: '#2FD47C',
      danger: '#FF3D5A',
    },
  },
  {
    key: 'carbon-neon-teal',
    name: 'Carbon + Neon Teal',
    palette: {
      bg: '#070B10',
      surface: '#0F1522',
      ink: '#F1F5F9',
      primary: '#00A86B',
      energy: '#00E5FF',
      warm: '#FF8A00',
      success: '#00E676',
      danger: '#FF1744',
    },
  },
  {
    key: 'carbon-steel-teal',
    name: 'Carbon + Steel Teal',
    palette: {
      bg: '#0B0F14',
      surface: '#151C25',
      ink: '#E2E8F0',
      primary: '#334155',
      energy: '#38BDF8',
      warm: '#FB923C',
      success: '#22C55E',
      danger: '#F43F5E',
    },
  },
  {
    key: 'carbon-coral-teal',
    name: 'Carbon + Coral Teal',
    palette: {
      bg: '#0B0F14',
      surface: '#121826',
      ink: '#F8FAFC',
      primary: '#0F766E',
      energy: '#25D6D9',
      warm: '#FF4D6D',
      success: '#10B981',
      danger: '#EF233C',
    },
  },
  {
    key: 'carbon-violet-teal',
    name: 'Carbon + Violet Teal',
    palette: {
      bg: '#090A14',
      surface: '#14102A',
      ink: '#F4EEFF',
      primary: '#14B8A6',
      energy: '#22D3EE',
      warm: '#F59E0B',
      success: '#34D399',
      danger: '#FB7185',
    },
  },
  {
    key: 'carbon-emerald-teal',
    name: 'Carbon + Emerald Teal',
    palette: {
      bg: '#061A14',
      surface: '#0B2A22',
      ink: '#E6FFF6',
      primary: '#047857',
      energy: '#00F5D4',
      warm: '#FFB800',
      success: '#22C55E',
      danger: '#FF2E4D',
    },
  },
];

export const PLAYGROUND_PALETTES = DARK_CARBON_TEAL_PALETTES;

export function withAlpha(hex: string, alpha: number): string {
  const normalized = hex.replace('#', '');
  if (normalized.length !== 6) return `rgba(0,0,0,${alpha})`;
  const r = parseInt(normalized.slice(0, 2), 16);
  const g = parseInt(normalized.slice(2, 4), 16);
  const b = parseInt(normalized.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

export function isDarkHex(hex: string): boolean {
  const normalized = hex.replace('#', '');
  if (normalized.length !== 6) return false;
  const r = parseInt(normalized.slice(0, 2), 16) / 255;
  const g = parseInt(normalized.slice(2, 4), 16) / 255;
  const b = parseInt(normalized.slice(4, 6), 16) / 255;
  const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  return luminance < 0.45;
}

export function textOnHex(hex: string): '#FFFFFF' | '#0B0F14' {
  return isDarkHex(hex) ? '#FFFFFF' : '#0B0F14';
}
