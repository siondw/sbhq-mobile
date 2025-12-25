import React, { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { ROUTES } from '../configs/routes';
import { useAuth } from '../logic/hooks/useAuth';
import { useContestState } from '../logic/hooks/useContestState';
import { useHeaderHeight } from '../logic/hooks/useHeaderHeight';
import { useParticipantCount } from '../logic/hooks/useParticipantCount';
import { PLAYER_STATE } from '../logic/constants';
import Button from '../ui/Button';
import Card from '../ui/Card';
import Text from '../ui/Text';
import { COLORS, SPACING, TYPOGRAPHY } from '../ui/theme';
import ContestStatsCard from '../ui/ContestStatsCard';
import Header from '../ui/AppHeader';

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
    if (!contestId || loading || playerState === PLAYER_STATE.UNKNOWN) return;
    if (playerState === PLAYER_STATE.ANSWERING) {
      router.replace(`/contest/${contestId}`);
    } else if (playerState === PLAYER_STATE.SUBMITTED_WAITING) {
      router.replace({ pathname: ROUTES.SUBMITTED, params: { contestId } });
    } else if (playerState === PLAYER_STATE.ELIMINATED) {
      router.replace({ pathname: ROUTES.ELIMINATED, params: { contestId } });
    } else if (playerState === PLAYER_STATE.WINNER) {
      router.replace({ pathname: ROUTES.WINNER, params: { contestId } });
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
            Correct!
          </Text>
          <Text style={styles.body}>Nice work. Waiting for the next round.</Text>
        </Card>
        <View style={styles.summary}>
          <ContestStatsCard
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
