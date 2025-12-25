import React, { useMemo } from 'react';
import { StyleSheet, View, type ViewProps } from 'react-native';

import { RADIUS, SPACING, useTheme } from '../theme';

const Card = ({ style, children, ...rest }: ViewProps) => {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors.surface), [colors.surface]);

  return (
    <View style={[styles.card, style]} {...rest}>
      {children}
    </View>
  );
};

function createStyles(surface: string) {
  return StyleSheet.create({
    card: {
      width: '100%',
      padding: SPACING.LG,
      borderRadius: RADIUS.LG,
      backgroundColor: surface,
      shadowColor: '#000000',
      shadowOpacity: 0.05,
      shadowRadius: 6,
      shadowOffset: { width: 0, height: 2 },
      elevation: 1,
      marginBottom: SPACING.SM,
    },
  });
}

export default Card;
