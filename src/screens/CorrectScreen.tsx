import React, { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { ROUTES } from '../configs/routes';
import { useAuth } from '../logic/hooks/useAuth';
import { useContestState } from '../logic/hooks/useContestState';
import { useHeaderHeight } from '../logic/hooks/useHeaderHeight';
import { useParticipantCount } from '../logic/hooks/useParticipantCount';
import { PLAYER_STATE } from '../logic/constants';
import Button from '../ui/primitives/Button';
import Card from '../ui/primitives/Card';
import Text from '../ui/primitives/Text';
import { COLORS, SPACING, TYPOGRAPHY } from '../ui/theme';
import GameStatsSummary from '../ui/GameStatsSummary';
import Header from '../ui/Header';

const CorrectScreen = () => {
  const { contestId } = useLocalSearchParams<{ contestId?: string }>();
  const router = useRouter();
  const { derivedUser } = useAuth();
  const headerHeight = useHeaderHeight();
  const { loading, error, playerState, refresh, contest } = useContestState(
    contestId,
    derivedUser?.id,
  );
  const { count: remainingPlayers } = useParticipantCount(contestId);

  useEffect(() => {
    if (!contestId) return;
    if (playerState === PLAYER_STATE.ANSWERING) {
      router.replace(`/contest/${contestId}`);
    } else if (playerState === PLAYER_STATE.SUBMITTED_WAITING) {
      router.replace(ROUTES.SUBMITTED);
    } else if (playerState === PLAYER_STATE.ELIMINATED) {
      router.replace(ROUTES.ELIMINATED);
    } else if (playerState === PLAYER_STATE.WINNER) {
      router.replace(ROUTES.WINNER);
    } else if (playerState === PLAYER_STATE.LOBBY) {
      router.replace({ pathname: ROUTES.LOBBY, params: { contestId } });
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
      <Header user={derivedUser} />
      <View style={[styles.content, { paddingTop: headerHeight + SPACING.MD }]}>
        <Card>
          <Text weight="bold" style={styles.title}>
            Correct!
          </Text>
          <Text style={styles.body}>Nice work. Waiting for the next round.</Text>
        </Card>
        <View style={styles.summary}>
          <GameStatsSummary
            numberOfRemainingPlayers={remainingPlayers}
            roundNumber={contest?.current_round ?? 1}
          />
        </View>
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
  summary: {
    marginTop: SPACING.MD,
  },
  spacer: {
    height: SPACING.SM,
  },
});

export default CorrectScreen;
