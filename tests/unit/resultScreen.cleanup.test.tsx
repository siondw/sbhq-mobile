import React from 'react';
import { render } from '@testing-library/react-native';
import { Animated } from 'react-native';

import CorrectScreen from '../../src/screens/CorrectScreen';
import EliminatedScreen from '../../src/screens/EliminatedScreen';

jest.mock('../../src/logic/contexts', () => ({
  useContestData: () => ({ loading: true }),
}));
jest.mock('../../src/logic/hooks/useAuth', () => ({
  useAuth: () => ({ derivedUser: null }),
}));
jest.mock('../../src/logic/hooks/useHeaderHeight', () => ({ useHeaderHeight: () => 0 }));
jest.mock('../../src/logic/hooks/useParticipantCount', () => ({
  useParticipantCount: () => ({ count: 0 }),
}));
jest.mock('../../src/logic/hooks/useAnswerDistribution', () => ({
  useAnswerDistribution: () => ({ distribution: [] }),
}));
jest.mock('../../src/logic/hooks/useEliminationQuestion', () => ({
  useEliminationQuestion: () => ({ question: null }),
}));
jest.mock('../../src/logic/hooks/utils', () => ({
  useRefresh: () => ({ refreshing: false, onRefresh: jest.fn() }),
}));
jest.mock('../../src/logic/routing/ContestRouter', () => ({ ContestRouter: () => null }));
jest.mock('../../src/ui/animations', () => ({
  useShineAnimation: () => ({ translateX: 0, opacity: 0 }),
}));
jest.mock('../../src/utils/haptics', () => ({
  successHaptic: jest.fn(),
  eliminationHaptic: jest.fn(),
}));
jest.mock('../../src/ui/components/AppHeader', () => () => null);
jest.mock('../../src/ui/components/LoadingView', () => () => null);
jest.mock('../../src/ui/components/AnswerDistributionChart', () => () => null);
jest.mock('../../src/ui/components/ContestStatsCard', () => () => null);

describe.each([
  ['CorrectScreen', CorrectScreen],
  ['EliminatedScreen', EliminatedScreen],
])('%s animation lifecycle', (_name, Screen) => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => {
    jest.restoreAllMocks();
    jest.useRealTimers();
  });

  test('cancels the delayed chart and stops active animations when leaving early', () => {
    const animations: Animated.CompositeAnimation[] = [];
    const createAnimation = (): Animated.CompositeAnimation => {
      const animation = { start: jest.fn(), stop: jest.fn(), reset: jest.fn() };
      animations.push(animation);
      return animation;
    };
    jest.spyOn(Animated, 'parallel').mockImplementation(createAnimation);
    jest.spyOn(Animated, 'sequence').mockImplementation(createAnimation);
    jest.spyOn(Animated, 'spring').mockImplementation(createAnimation);
    jest.spyOn(Animated, 'timing').mockImplementation(createAnimation);
    jest.spyOn(Animated, 'delay').mockImplementation(createAnimation);

    const screen = render(<Screen />);
    const startedAnimations = animations.filter(
      (animation) => jest.mocked(animation.start).mock.calls.length > 0,
    );
    expect(startedAnimations.length).toBeGreaterThan(0);
    expect(jest.getTimerCount()).toBe(1);

    screen.unmount();

    expect(jest.getTimerCount()).toBe(0);
    startedAnimations.forEach((animation) => expect(animation.stop).toHaveBeenCalledTimes(1));
  });
});
