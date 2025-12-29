/**
 * Animation timing constants (in milliseconds)
 */
export const ANIMATION_DURATION = {
  FAST: 300,
  NORMAL: 500,
  SLOW: 1000,
  SHINE: 2000,
  SHINE_DELAY: 3000,
  REFRESH_MIN: 600,
} as const;

/**
 * Animation delay constants (in milliseconds)
 */
export const ANIMATION_DELAY = {
  SHORT: 500,
  MEDIUM: 1000,
  LONG: 3000,
} as const;

/**
 * Animation opacity values
 */
export const ANIMATION_OPACITY = {
  SUBTLE: 0.3,
  MEDIUM: 0.5,
  STRONG: 0.8,
} as const;

/**
 * Shine animation presets
 */
export const SHINE_PRESET = {
  SUBTLE: {
    delay: 3000,
    duration: 2000,
    maxOpacity: 0.3,
    containerOpacity: 0.8,
  },
  NORMAL: {
    delay: 2000,
    duration: 1500,
    maxOpacity: 0.5,
    containerOpacity: 0.9,
  },
  DRAMATIC: {
    delay: 1000,
    duration: 1000,
    maxOpacity: 0.8,
    containerOpacity: 1,
  },
} as const;

/**
 * Selection animation presets
 */
export const SELECTION_PRESET = {
  FAST: {
    tension: 70,
    friction: 8,
    deselectionDuration: 150,
  },
  NORMAL: {
    tension: 50,
    friction: 7,
    deselectionDuration: 200,
  },
  SLOW: {
    tension: 30,
    friction: 6,
    deselectionDuration: 300,
  },
} as const;

export const FOOTBALL_RED_KEYPATHS = [
  'rugby ball.speed 20.03.Shape 1.Stroke 1',
  'rugby ball.speed 20.02.Shape 1.Stroke 1',
  'rugby ball.speed 20.01.Shape 1.Stroke 1',
  'rugby ball.speed 19.01.Shape 1.Stroke 1',
  'rugby ball.speed 17.01.Shape 1.Stroke 1',
  'rugby ball.speed 15.01.Shape 1.Stroke 1',
  'rugby ball.speed 14.03.Shape 1.Stroke 1',
  'rugby ball.speed 14.02.Shape 1.Stroke 1',
  'rugby ball.speed 14.01.Shape 1.Stroke 1',
  'rugby ball.speed 13.01.Shape 1.Stroke 1',
  'rugby ball.speed 12.02.Shape 1.Stroke 1',
  'rugby ball.speed 12.01.Shape 1.Stroke 1',
  'rugby ball.speed 11.02.Shape 1.Stroke 1',
  'rugby ball.speed 11.01.Shape 1.Stroke 1',
  'rugby ball.speed 06.03.Shape 1.Stroke 1',
  'rugby ball.speed 06.02.Shape 1.Stroke 1',
  'rugby ball.speed 06.01.Shape 1.Stroke 1',
  'rugby ball.speed 10.01.Shape 1.Stroke 1',
  'rugby ball.speed 09.01.Shape 1.Stroke 1',
  'rugby ball.speed 08.01.Shape 1.Stroke 1',
  'rugby ball.speed 07.01.Shape 1.Stroke 1',
  'rugby ball.speed 04.01.Shape 1.Stroke 1',
  'rugby ball.speed 03.03.Shape 1.Stroke 1',
  'rugby ball.speed 03.02.Shape 1.Stroke 1',
  'rugby ball.speed 03.01.Shape 1.Stroke 1',
  'rugby ball.speed 02.01.Shape 1.Stroke 1',
  'rugby ball.speed 05.02.Shape 1.Stroke 1',
  'rugby ball.speed 05.01.Shape 1.Stroke 1',
  'rugby ball.speed 01.02.Shape 1.Stroke 1',
  'rugby ball.speed 01.01.Shape 1.Stroke 1',
  'rugby ball.10.Group 1.Stroke 1',
  'rugby ball.10.Group 2.Stroke 1',
  'rugby ball.09.Group 1.Stroke 1',
  'rugby ball.09.Group 2.Stroke 1',
  'rugby ball.08.Group 1.Stroke 1',
  'rugby ball.08.Group 2.Stroke 1',
  'rugby ball.07.Group 1.Stroke 1',
  'rugby ball.07.Group 2.Stroke 1',
  'rugby ball.06.Group 1.Stroke 1',
  'rugby ball.06.Group 2.Stroke 1',
  'rugby ball.05.Group 1.Stroke 1',
  'rugby ball.05.Group 2.Stroke 1',
  'rugby ball.04.Group 1.Stroke 1',
  'rugby ball.04.Group 2.Stroke 1',
  'rugby ball.03.Group 1.Stroke 1',
  'rugby ball.03.Group 2.Stroke 1',
  'rugby ball.02.Group 1.Stroke 1',
  'rugby ball.02.Group 2.Stroke 1',
  'rugby ball.01.Group 1.Stroke 1',
  'rugby ball.01.Group 2.Stroke 1',
  'rugby ball.baseline matte 2.Group 1.Fill 1',
  'rugby ball.rugby uv map 02 matte 2.Group 1.Fill 1',
  'rugby ball.baseline matte.Group 1.Fill 1',
  'rugby ball.rugby uv map 02 matte.Group 1.Fill 1',
  'rugby ball.rugby ball.Group 1.Fill 1',
];

export const FOOTBALL_DARK_RED_KEYPATHS = [
  'rugby ball.rugby ball shadow.Group 1.Fill 1',
  'rugby ball.baseline.line.Stroke 1',
];
