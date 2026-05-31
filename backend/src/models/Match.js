const { v4: uuidv4 } = require('uuid');
const db = require('../db');

class Match {
  static async create(player1Id, player2Id, duration = 60) {
    const id = uuidv4();
    await db.run(
      `INSERT INTO matches (id, player1Id, player2Id, duration)
       VALUES (?, ?, ?, ?)`,
      [id, player1Id, player2Id, duration]
    );
    return this.getById(id);
  }

  static async getById(id) {
    return db.get(`SELECT * FROM matches WHERE id = ?`, [id]);
  }

  static async updateScore(matchId, player1Score, player2Score) {
    return db.run(
      `UPDATE matches SET player1Score = ?, player2Score = ? WHERE id = ?`,
      [player1Score, player2Score, matchId]
    );
  }

  static async updateCombo(matchId, player1Combo, player2Combo) {
    return db.run(
      `UPDATE matches SET player1Combo = ?, player2Combo = ? WHERE id = ?`,
      [player1Combo, player2Combo, matchId]
    );
  }

  static async complete(matchId, winnerId, eloChangePlayer1, eloChangePlayer2) {
    return db.run(
      `UPDATE matches SET winnerId = ?, eloChangePlayer1 = ?, eloChangePlayer2 = ?, completedAt = CURRENT_TIMESTAMP WHERE id = ?`,
      [winnerId, eloChangePlayer1, eloChangePlayer2, matchId]
    );
  }

  static async getPlayerHistory(playerId, limit = 20, offset = 0) {
    return db.all(
      `SELECT * FROM matches 
       WHERE player1Id = ? OR player2Id = ? 
       ORDER BY createdAt DESC LIMIT ? OFFSET ?`,
      [playerId, playerId, limit, offset]
    );
  }

  static async recordHistory(playerId, matchId, score, combo, gestures, won, eloChange) {
    const id = uuidv4();
    return db.run(
      `INSERT INTO matchHistory (id, playerId, matchId, score, combo, gestures, won, eloChange)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, playerId, matchId, score, combo, gestures, won, eloChange]
    );
  }
}

module.exports = Match;
