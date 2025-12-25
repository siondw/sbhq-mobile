/**
 * Animation timing constants for consistent animation durations across the app.
 * All values are in milliseconds.
 */
export const ANIMATION_DURATIONS = {
  FAST: 200,
  NORMAL: 300,
  SLOW: 500,
  GLINT_DEFAULT: 2000,
  GLINT_SLOW: 5000,
} as const;

/**
 * Animation delay constants for consistent timing patterns.
 * All values are in milliseconds.
 */
export const ANIMATION_DELAYS = {
  SHORT: 500,
  MEDIUM: 1000,
  LONG: 3000,
} as const;

/**
 * Opacity constants for animation effects.
 */
export const ANIMATION_OPACITY = {
  SUBTLE: 0.3,
  MEDIUM: 0.5,
  STRONG: 0.8,
} as const;
