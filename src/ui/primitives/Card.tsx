import React from 'react';
import { View, StyleSheet, type ViewProps } from 'react-native';
import { COLORS, RADIUS, SPACING } from '../theme';

const Card = ({ style, children, ...rest }: ViewProps) => {
  return (
    <View style={[styles.card, style]} {...rest}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    width: '100%',
    padding: SPACING.MD,
    borderRadius: RADIUS.LG,
    backgroundColor: COLORS.SURFACE,
    shadowColor: COLORS.PRIMARY_DARK,
    shadowOpacity: 0.16,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 6,
    marginBottom: SPACING.MD,
  },
});

export default Card;
