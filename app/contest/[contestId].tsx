import React from 'react';
import { useLocalSearchParams } from 'expo-router';
import GameScreen from '../../src/screens/GameScreen';

const ContestRoute = () => {
  const { contestId } = useLocalSearchParams<{ contestId: string }>();

  return <GameScreen contestId={contestId} />;
};

export default ContestRoute;
