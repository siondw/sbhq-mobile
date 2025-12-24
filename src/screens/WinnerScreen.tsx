import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';

import { ROUTES } from '../configs/routes';
import { useAuth } from '../logic/hooks/useAuth';
import { useHeaderHeight } from '../logic/hooks/useHeaderHeight';
import Button from '../ui/primitives/Button';
import Card from '../ui/primitives/Card';
import Text from '../ui/primitives/Text';
import { COLORS, SPACING, TYPOGRAPHY } from '../ui/theme';
import Header from '../ui/Header';

const WinnerScreen = () => {
  const router = useRouter();
  const { derivedUser } = useAuth();
  const headerHeight = useHeaderHeight();

  return (
    <View style={styles.container}>
      <Header user={derivedUser} />
      <View style={[styles.content, { paddingTop: headerHeight + SPACING.MD }]}>
        <Card>
          <Text weight="bold" style={styles.title}>
            You won!
          </Text>
          <Text style={styles.body}>Congratulations on being the last player standing.</Text>
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
});

export default WinnerScreen;
