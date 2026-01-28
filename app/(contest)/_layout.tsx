import { Stack, useLocalSearchParams } from 'expo-router';
import React from 'react';

import { ContestStateProvider } from '../../src/logic/contexts';
import { useAuth } from '../../src/logic/hooks/useAuth';

const ContestLayout = () => {
  const { contestId, spectating } = useLocalSearchParams<{
    contestId?: string;
    spectating?: string;
  }>();
  const { derivedUser } = useAuth();
  const isSpectating = spectating === 'true';

  return (
    <ContestStateProvider contestId={contestId} userId={isSpectating ? undefined : derivedUser?.id}>
      <Stack screenOptions={{ headerShown: false, gestureEnabled: false }} />
    </ContestStateProvider>
  );
};

export default ContestLayout;
