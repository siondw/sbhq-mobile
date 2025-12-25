import type { ViewStyle } from 'react-native';

export type GlassyTextureProps = {
  colors: {
    energy: string;
    warm: string;
    ink: string;
  };
  shinePreset?: 'SUBTLE' | 'NORMAL' | 'DRAMATIC';
  style?: ViewStyle;
  children?: React.ReactNode;
};
