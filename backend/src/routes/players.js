const express = require('express');
const Player = require('../models/Player');
const Match = require('../models/Match');

const router = express.Router();

// Create temporary anonymous player
router.post('/anonymous', async (req, res) => {
  try {
    const player = await Player.createAnonymous();
    res.status(201).json(player);
  } catch (error) {
    console.error(`[Anonymous Login] Error:`, error);
    res.status(500).json({ error: error.message });
  }
});

// Create new player
router.post('/register', async (req, res) => {
  try {
    const { username, password } = req.body;
    console.log(`[Register] Username: ${username}`);

    if (!username || username.length < 3) {
      return res.status(400).json({ error: 'Username must be at least 3 characters' });
    }

    if (!password || password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    console.log(`[Register] Checking if user exists...`);
    const exists = await Player.existsByUsername(username);
    console.log(`[Register] User exists: ${exists}`);
    
    if (exists) {
      return res.status(409).json({ error: 'Username already taken' });
    }

    console.log(`[Register] Creating player...`);
    const player = await Player.createWithPassword(username, password);
    console.log(`[Register] Player created: ${JSON.stringify(player)}`);
    res.status(201).json(player);
  } catch (error) {
    console.error(`[Register] Error:`, error);
    res.status(500).json({ error: error.message });
  }
});

// Login existing player
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    const player = await Player.login(username, password);
    if (!player) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    res.json(player);
  } catch (error) {
    console.error(`[Login] Error:`, error);
    res.status(500).json({ error: error.message });
  }
});

// Get player by ID
router.get('/:id', async (req, res) => {
  try {
    const player = await Player.getById(req.params.id);
    if (!player) {
      return res.status(404).json({ error: 'Player not found' });
    }
    res.json(player);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get player by username
router.get('/username/:username', async (req, res) => {
  try {
    const player = await Player.getByUsername(req.params.username);
    if (!player) {
      return res.status(404).json({ error: 'Player not found' });
    }
    res.json(player);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get player match history
router.get('/:id/history', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 20;
    const offset = parseInt(req.query.offset) || 0;

    const history = await Match.getPlayerHistory(req.params.id, limit, offset);
    res.json(history);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update player username
router.patch('/:id', async (req, res) => {
  try {
    const { username } = req.body;
    if (username && username.length < 3) {
      return res.status(400).json({ error: 'Username must be at least 3 characters' });
    }

    // Note: In production, add database update method
    res.json({ message: 'Update not fully implemented' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
