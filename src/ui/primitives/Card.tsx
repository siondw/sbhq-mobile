import React from 'react';
import { View, StyleSheet, type ViewProps } from 'react-native';
import { RADIUS, SPACING } from '../theme';

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
    padding: SPACING.LG,
    borderRadius: RADIUS.LG,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000000',
    shadowOpacity: 0.1,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
    marginBottom: SPACING.SM,
  },
});

export default Card;
