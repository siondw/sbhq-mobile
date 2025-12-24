import React from 'react';
import { Text as RNText, StyleSheet, type TextProps as RNTextProps } from 'react-native';
import { TYPOGRAPHY, COLORS } from './theme';

export interface TextProps extends RNTextProps {
  weight?: 'regular' | 'medium' | 'bold';
}

const Text = ({ style, weight = 'regular', children, ...rest }: TextProps) => {
  const weightStyle =
    weight === 'bold' ? styles.bold : weight === 'medium' ? styles.medium : styles.regular;

  return (
    <RNText style={[styles.base, weightStyle, style]} {...rest}>
      {children}
    </RNText>
  );
};

const styles = StyleSheet.create({
  base: {
    color: COLORS.TEXT,
    fontFamily: TYPOGRAPHY.FONT_FAMILY_REGULAR,
  },
  regular: {
    fontFamily: TYPOGRAPHY.FONT_FAMILY_REGULAR,
  },
  medium: {
    fontFamily: TYPOGRAPHY.FONT_FAMILY_MEDIUM,
  },
  bold: {
    fontFamily: TYPOGRAPHY.FONT_FAMILY_SEMIBOLD,
  },
});

export default Text;
