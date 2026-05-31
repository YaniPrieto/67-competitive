/**
 * API Client Utility
 */

import { API_BASE } from './network';

export const api = {
  // Players
  registerPlayer: async (username, password) => {
    const res = await fetch(`${API_BASE}/players/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    if (!res.ok) throw new Error(`Registration failed: ${res.status}`);
    return res.json();
  },

  loginPlayer: async (username, password) => {
    const res = await fetch(`${API_BASE}/players/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    if (!res.ok) throw new Error(`Login failed: ${res.status}`);
    return res.json();
  },

  loginAnonymous: async () => {
    const res = await fetch(`${API_BASE}/players/anonymous`, {
      method: 'POST'
    });
    if (!res.ok) throw new Error(`Anonymous login failed: ${res.status}`);
    return res.json();
  },

  getPlayer: async (playerId) => {
    const res = await fetch(`${API_BASE}/players/${playerId}`);
    if (!res.ok) throw new Error(`Player not found: ${res.status}`);
    return res.json();
  },

  getPlayerByUsername: async (username) => {
    const res = await fetch(`${API_BASE}/players/username/${username}`);
    if (!res.ok) throw new Error(`Player not found: ${res.status}`);
    return res.json();
  },

  getPlayerHistory: async (playerId, limit = 20, offset = 0) => {
    const res = await fetch(
      `${API_BASE}/players/${playerId}/history?limit=${limit}&offset=${offset}`
    );
    if (!res.ok) throw new Error(`Failed to fetch history: ${res.status}`);
    return res.json();
  },

  // Matches
  getMatch: async (matchId) => {
    const res = await fetch(`${API_BASE}/matches/${matchId}`);
    if (!res.ok) throw new Error(`Match not found: ${res.status}`);
    return res.json();
  },

  getPlayerMatches: async (playerId, limit = 20, offset = 0) => {
    const res = await fetch(
      `${API_BASE}/matches/player/${playerId}?limit=${limit}&offset=${offset}`
    );
    if (!res.ok) throw new Error(`Failed to fetch matches: ${res.status}`);
    return res.json();
  },

  // Leaderboard
  getLeaderboard: async (limit = 50, offset = 0) => {
    const res = await fetch(
      `${API_BASE}/leaderboard?limit=${limit}&offset=${offset}`
    );
    if (!res.ok) throw new Error(`Failed to fetch leaderboard: ${res.status}`);
    return res.json();
  },

  getTopPlayers: async () => {
    const res = await fetch(`${API_BASE}/leaderboard/seasonal/top`);
    if (!res.ok) throw new Error(`Failed to fetch top players: ${res.status}`);
    return res.json();
  },

  getPlayerRank: async (playerId) => {
    const res = await fetch(`${API_BASE}/leaderboard/player/${playerId}`);
    if (!res.ok) throw new Error(`Failed to fetch player rank: ${res.status}`);
    return res.json();
  }
};

export const handleApiError = (error) => {
  console.error('API Error:', error.message);
  return {
    error: error.message,
    timestamp: new Date().toISOString()
  };
};
