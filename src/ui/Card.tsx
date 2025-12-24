import React from 'react';
import { StyleSheet, View, type ViewProps } from 'react-native';
import { RADIUS, SPACING } from './theme';

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
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    shadowColor: '#000000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
    marginBottom: SPACING.SM,
  },
});

export default Card;
