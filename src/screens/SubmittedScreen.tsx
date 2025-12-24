import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect } from 'react';
import { ActivityIndicator, Image, StyleSheet, View } from 'react-native';

import { ROUTES } from '../configs/routes';
import { useAuth } from '../logic/hooks/useAuth';
import { PLAYER_STATE } from '../logic/constants';
import { useContestState } from '../logic/hooks/useContestState';
import { useHeaderHeight } from '../logic/hooks/useHeaderHeight';
import Button from '../ui/Button';
import Card from '../ui/Card';
import Text from '../ui/Text';
import { COLORS, SPACING, TYPOGRAPHY } from '../ui/theme';
import Header from '../ui/AppHeader';
import ballGif from '../../assets/gifs/ball.gif';

const SubmittedScreen = () => {
  const { contestId } = useLocalSearchParams<{ contestId?: string }>();
  const router = useRouter();
  const { derivedUser } = useAuth();
  const headerHeight = useHeaderHeight();
  const { loading, error, playerState, refresh } = useContestState(contestId, derivedUser?.id);

  useEffect(() => {
    if (!contestId || loading) return;

    if (playerState === PLAYER_STATE.ANSWERING) {
      router.replace(`/contest/${contestId}`);
    } else if (playerState === PLAYER_STATE.CORRECT_WAITING_NEXT) {
      router.replace(ROUTES.CORRECT);
    } else if (playerState === PLAYER_STATE.ELIMINATED) {
      router.replace(ROUTES.ELIMINATED);
    } else if (playerState === PLAYER_STATE.WINNER) {
      router.replace(ROUTES.WINNER);
    } else if (playerState === PLAYER_STATE.LOBBY) {
      router.replace({ pathname: ROUTES.LOBBY, params: { contestId } });
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
      <Header user={derivedUser} />
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
