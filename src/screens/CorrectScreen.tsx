import React, { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAuth } from '../logic/auth/useAuth';
import { useContestState } from '../logic/contest/useContestState';
import { PLAYER_STATE } from '../logic/constants';
import { useHeaderHeight } from '../logic/layout/useHeaderHeight';
import Text from '../ui/primitives/Text';
import Button from '../ui/primitives/Button';
import Card from '../ui/primitives/Card';
import { COLORS, SPACING, TYPOGRAPHY } from '../ui/theme';
import Header from '../ui/Header';

const CorrectScreen = () => {
  const { contestId } = useLocalSearchParams<{ contestId?: string }>();
  const router = useRouter();
  const { derivedUser } = useAuth();
  const headerHeight = useHeaderHeight();
  const { loading, error, playerState, refresh } = useContestState(contestId, derivedUser?.id);

  useEffect(() => {
    if (!contestId) return;
    if (playerState === PLAYER_STATE.ANSWERING) {
      router.replace(`/contest/${contestId}`);
    } else if (playerState === PLAYER_STATE.SUBMITTED_WAITING) {
      router.replace('/submitted');
    } else if (playerState === PLAYER_STATE.ELIMINATED) {
      router.replace('/eliminated');
    } else if (playerState === PLAYER_STATE.WINNER) {
      router.replace('/winner');
    } else if (playerState === PLAYER_STATE.LOBBY) {
      router.replace({ pathname: '/lobby', params: { contestId } });
    }
  }, [playerState, router, contestId]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text weight="bold">Error</Text>
        <Text>{error}</Text>
        <View style={styles.spacer} />
        <Button label="Retry" onPress={() => void refresh()} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header />
      <View style={[styles.content, { paddingTop: headerHeight + SPACING.MD }]}>
        <Card>
          <Text weight="bold" style={styles.title}>
            Correct!
          </Text>
          <Text style={styles.body}>Nice work. Waiting for the next round.</Text>
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
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.LG,
  },
  title: {
    fontSize: TYPOGRAPHY.TITLE,
    marginBottom: SPACING.XS,
  },
  body: {
    fontSize: TYPOGRAPHY.BODY,
  },
  spacer: {
    height: SPACING.SM,
  },
});

export default CorrectScreen;
