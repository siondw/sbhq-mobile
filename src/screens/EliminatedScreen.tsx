import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import Text from '../ui/primitives/Text';
import Card from '../ui/primitives/Card';
import Button from '../ui/primitives/Button';
import { COLORS, SPACING, TYPOGRAPHY, HEADER_HEIGHT } from '../ui/theme';
import Header from '../ui/Header';

const EliminatedScreen = () => {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Header />
      <View style={styles.content}>
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
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND,
    paddingTop: HEADER_HEIGHT + SPACING.MD,
  },
  content: {
    flex: 1,
    paddingHorizontal: SPACING.MD,
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
