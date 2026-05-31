/**
 * Backend Gesture Detection Constants
 */

module.exports = {
  // Hand landmarks indices
  HAND_LANDMARKS: {
    WRIST: 0,
    THUMB_CMC: 1,
    THUMB_MCP: 2,
    THUMB_IP: 3,
    THUMB_TIP: 4,
    INDEX_MCP: 5,
    INDEX_PIP: 6,
    INDEX_DIP: 7,
    INDEX_TIP: 8,
    MIDDLE_MCP: 9,
    MIDDLE_PIP: 10,
    MIDDLE_DIP: 11,
    MIDDLE_TIP: 12,
    RING_MCP: 13,
    RING_PIP: 14,
    RING_DIP: 15,
    RING_TIP: 16,
    PINKY_MCP: 17,
    PINKY_PIP: 18,
    PINKY_DIP: 19,
    PINKY_TIP: 20
  },

  // Game constants
  GAME_CONFIG: {
    MATCH_DURATION: 60, // seconds
    MIN_HAND_CONFIDENCE: 0.7,
    MIN_TRACKING_CONFIDENCE: 0.5,
    MOTION_THRESHOLD: 0.05,
    CYCLE_COOLDOWN_MS: 200,
    SMOOTHING_WINDOW: 5,
    BASE_POINTS: 10
  },

  // ELO config
  ELO_CONFIG: {
    K_FACTOR: 32,
    DEFAULT_ELO: 1000,
    MATCHMAKING_WINDOW: 50
  },

  // Validation reasons
  VALIDATION_REASONS: {
    VALID_CYCLE: 'valid_cycle',
    PALM_NOT_FACING_UP: 'palm_not_facing_up',
    BOTH_HANDS_SAME_DIRECTION: 'both_hands_same_direction',
    MISSING_HAND: 'missing_hand',
    INVALID_LANDMARKS: 'invalid_landmarks',
    INSUFFICIENT_MOTION: 'insufficient_motion',
    CYCLE_INCOMPLETE: 'cycle_incomplete',
    HANDS_NOT_DETECTED: 'hands_not_detected'
  },

  // Gesture state transitions
  GESTURE_STATES: {
    IDLE: 'idle',
    LEFT_UP: 'left_up',
    RIGHT_DOWN: 'right_down',
    VALID_HALF_CYCLE: 'valid_half_cycle',
    COMPLETE_CYCLE: 'complete_cycle'
  },

  // Tier thresholds
  TIERS: {
    BRONZE: { min: 0, max: 1199 },
    SILVER: { min: 1200, max: 1399 },
    GOLD: { min: 1400, max: 1599 },
    PLATINUM: { min: 1600, max: 1799 },
    DIAMOND: { min: 1800, max: Infinity }
  }
};

const getTier = (elo) => {
  const { TIERS } = module.exports;
  for (const [tier, range] of Object.entries(TIERS)) {
    if (elo >= range.min && elo <= range.max) {
      return tier;
    }
  }
  return 'UNKNOWN';
};

module.exports.getTier = getTier;
