import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import Text from '../ui/primitives/Text';
import Card from '../ui/primitives/Card';
import Button from '../ui/primitives/Button';
import { COLORS, SPACING, TYPOGRAPHY } from '../ui/theme';
import Header from '../ui/Header';

const EliminatedScreen = () => {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Header />
      <Card style={styles.card}>
        <Text weight="bold" style={styles.title}>
          Eliminated
        </Text>
        <Text style={styles.body}>You’re out for this contest. Better luck next time.</Text>
        <View style={styles.footer}>
          <Button label="Back to Contests" onPress={() => router.replace('/')} />
        </View>
      </Card>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: SPACING.MD,
    backgroundColor: COLORS.BACKGROUND,
    justifyContent: 'center',
  },
  title: {
    fontSize: TYPOGRAPHY.TITLE,
    marginBottom: SPACING.XS,
  },
  body: {
    fontSize: TYPOGRAPHY.BODY,
  },
  footer: {
    marginTop: SPACING.SM,
  },
  card: {
    borderLeftWidth: 4,
    borderLeftColor: COLORS.ELIMINATED_START,
  },
});

export default EliminatedScreen;
