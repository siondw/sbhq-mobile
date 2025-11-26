import React from 'react';
import { useAuth } from '../src/logic/auth/useAuth';
import ContestListScreen from '../src/screens/ContestListScreen';
import LoginScreen from '../src/screens/LoginScreen';

const Index = () => {
  const { session } = useAuth();

  if (session) {
    return <ContestListScreen />;
  }

  return <LoginScreen />;
};

export default Index;
