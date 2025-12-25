/**
 * Animation timing constants
 */
export const ANIMATION_DURATION = {
  FAST: 300,
  NORMAL: 500,
  SLOW: 1000,
  SHINE: 2000,
  SHINE_DELAY: 3000,
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
