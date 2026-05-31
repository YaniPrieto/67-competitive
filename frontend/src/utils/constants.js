/**
 * Game Constants
 */

export const ELO_TIER = {
  BRONZE: { name: 'Bronze', minElo: 0, maxElo: 1199 },
  SILVER: { name: 'Silver', minElo: 1200, maxElo: 1399 },
  GOLD: { name: 'Gold', minElo: 1400, maxElo: 1599 },
  PLATINUM: { name: 'Platinum', minElo: 1600, maxElo: 1799 },
  DIAMOND: { name: 'Diamond', minElo: 1800, maxElo: Infinity }
};

export const GAME_CONFIG = {
  MATCH_DURATION: 60000, // 60 seconds in ms
  COUNTDOWN_DURATION: 3, // 3 seconds
  BASE_POINTS: 10,
  MAX_COMBO_MULTIPLIER: 5,
  MOTION_THRESHOLD: 0.05,
  CYCLE_COOLDOWN: 200, // ms
  SMOOTHING_WINDOW: 5, // frames
  MIN_HAND_CONFIDENCE: 0.7,
  MIN_TRACKING_CONFIDENCE: 0.5,
  MAX_HANDS: 2
};

export const ELO_CONFIG = {
  K_FACTOR: 32,
  DEFAULT_ELO: 1000,
  ELO_WINDOW: 50 // For matchmaking
};

export const FEEDBACK_MESSAGES = {
  VALID_GESTURE: '✓ Perfect!',
  BOTH_HANDS_MOVING: '✗ Hands moving together',
  PALMS_NOT_UP: '✗ Palms facing down',
  NO_MOTION: '✗ Keep moving!',
  INVALID_LANDMARKS: '✗ Hand not detected',
  HAND_MISSING: '✗ Show both hands'
};

export const getTierByElo = (elo) => {
  for (const tier of Object.values(ELO_TIER)) {
    if (elo >= tier.minElo && elo <= tier.maxElo) {
      return tier.name;
    }
  }
  return 'Unknown';
};

export const formatTime = (seconds) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

export const calculateComboMultiplier = (combo) => {
  // 1-2: 1.0x, 3-5: 1.5x, 6-10: 2.0x, 11-20: 3.0x, 21+: 5.0x
  if (combo <= 2) return 1.0;
  if (combo <= 5) return 1.5;
  if (combo <= 10) return 2.0;
  if (combo <= 20) return 3.0;
  return 5.0;
};

export const calculateScore = (basePoints, combo) => {
  const multiplier = calculateComboMultiplier(combo);
  return Math.round(basePoints * multiplier);
};
