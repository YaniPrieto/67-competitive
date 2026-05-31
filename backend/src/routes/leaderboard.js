const express = require('express');
const Player = require('../models/Player');

const router = express.Router();

// Get global leaderboard
router.get('/', async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 50, 100);
    const offset = parseInt(req.query.offset) || 0;

    const leaderboard = await Player.getLeaderboard(limit, offset);
    
    // Add rank
    const ranked = leaderboard.map((player, index) => ({
      ...player,
      rank: offset + index + 1
    }));

    res.json(ranked);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get seasonal leaderboard (top 100 by ELO)
router.get('/seasonal/top', async (req, res) => {
  try {
    const top = await Player.getLeaderboard(100, 0);
    
    const ranked = top.map((player, index) => ({
      ...player,
      rank: index + 1,
      tier: getTier(player.elo)
    }));

    res.json(ranked);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get player rank
router.get('/player/:playerId', async (req, res) => {
  try {
    const player = await Player.getById(req.params.playerId);
    if (!player) {
      return res.status(404).json({ error: 'Player not found' });
    }

    // Count how many players have higher ELO
    const allPlayers = await Player.getLeaderboard(100000, 0);
    const rank = allPlayers.findIndex(p => p.id === req.params.playerId) + 1;

    res.json({
      ...player,
      rank,
      tier: getTier(player.elo)
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get ranking tier based on ELO
 */
function getTier(elo) {
  if (elo < 1200) return 'Bronze';
  if (elo < 1400) return 'Silver';
  if (elo < 1600) return 'Gold';
  if (elo < 1800) return 'Platinum';
  return 'Diamond';
}

module.exports = router;
