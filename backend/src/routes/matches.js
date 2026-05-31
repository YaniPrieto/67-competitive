const express = require('express');
const Match = require('../models/Match');

const router = express.Router();

// Get match details
router.get('/:id', async (req, res) => {
  try {
    const match = await Match.getById(req.params.id);
    if (!match) {
      return res.status(404).json({ error: 'Match not found' });
    }
    res.json(match);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get player match history
router.get('/player/:playerId', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 20;
    const offset = parseInt(req.query.offset) || 0;

    const history = await Match.getPlayerHistory(req.params.playerId, limit, offset);
    res.json(history);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
