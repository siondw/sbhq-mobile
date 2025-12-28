import { Stack, useLocalSearchParams } from 'expo-router';
import React from 'react';

import { ContestStateProvider } from '../../src/logic/contexts';
import { useAuth } from '../../src/logic/hooks/useAuth';

const ContestLayout = () => {
  const { contestId } = useLocalSearchParams<{ contestId?: string }>();
  const { derivedUser } = useAuth();

  return (
    <ContestStateProvider contestId={contestId} userId={derivedUser?.id}>
      <Stack screenOptions={{ headerShown: false, gestureEnabled: false }} />
    </ContestStateProvider>
  );
};

export default ContestLayout;
