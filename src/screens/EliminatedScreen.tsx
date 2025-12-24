import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';

import { ROUTES } from '../configs/routes';
import { useAuth } from '../logic/hooks/useAuth';
import { useHeaderHeight } from '../logic/hooks/useHeaderHeight';
import Button from '../ui/Button';
import Card from '../ui/Card';
import Text from '../ui/Text';
import { COLORS, SPACING, TYPOGRAPHY } from '../ui/theme';
import Header from '../ui/AppHeader';

const EliminatedScreen = () => {
  const router = useRouter();
  const { derivedUser } = useAuth();
  const headerHeight = useHeaderHeight();

  return (
    <View style={styles.container}>
      <Header user={derivedUser} />
      <View style={[styles.content, { paddingTop: headerHeight + SPACING.MD }]}>
        <Card style={styles.card}>
          <Text weight="bold" style={styles.title}>
            Eliminated
          </Text>
          <Text style={styles.body}>You’re out for this contest. Better luck next time.</Text>
          <View style={styles.footer}>
            <Button label="Back to Contests" onPress={() => router.replace(ROUTES.INDEX)} />
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
