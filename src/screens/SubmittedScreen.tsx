import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect } from 'react';
import { ActivityIndicator, Image, StyleSheet, View } from 'react-native';
import { useAuth } from '../logic/auth/useAuth';
import { PLAYER_STATE } from '../logic/constants';
import { useContestState } from '../logic/contest/useContestState';
import { useHeaderHeight } from '../logic/layout/useHeaderHeight';
import Header from '../ui/Header';
import Button from '../ui/primitives/Button';
import Card from '../ui/primitives/Card';
import Text from '../ui/primitives/Text';
import { COLORS, SPACING, TYPOGRAPHY } from '../ui/theme';
import ballGif from '../../assets/gifs/ball.gif';

const SubmittedScreen = () => {
  const { contestId } = useLocalSearchParams<{ contestId?: string }>();
  const router = useRouter();
  const { derivedUser } = useAuth();
  const headerHeight = useHeaderHeight();
  const { loading, error, playerState, refresh } = useContestState(contestId, derivedUser?.id);

  useEffect(() => {
    if (!contestId || loading) return;
    console.warn('SubmittedScreen state', { playerState, contestId });

    if (playerState === PLAYER_STATE.ANSWERING) {
      router.replace(`/contest/${contestId}`);
    } else if (playerState === PLAYER_STATE.CORRECT_WAITING_NEXT) {
      router.replace('/correct');
    } else if (playerState === PLAYER_STATE.ELIMINATED) {
      router.replace('/eliminated');
    } else if (playerState === PLAYER_STATE.WINNER) {
      router.replace('/winner');
    } else if (playerState === PLAYER_STATE.LOBBY) {
      router.replace({ pathname: '/lobby', params: { contestId } });
    }
  }, [playerState, router, contestId, loading]);

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
            Submitted
          </Text>
          <Text style={styles.body}>You are locked in. Waiting for the result...</Text>
          <Image source={ballGif} style={styles.submittedGif} />
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
  submittedGif: {
    width: 250,
    height: 250,
    alignSelf: 'center',
    marginTop: SPACING.MD,
  },
  spacer: {
    height: SPACING.SM,
  },
});

export default SubmittedScreen;
