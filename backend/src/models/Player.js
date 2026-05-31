const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto');
const db = require('../db');

const HASH_ITERATIONS = 100000;
const HASH_KEY_LENGTH = 64;
const HASH_DIGEST = 'sha512';

const sanitizePlayer = (player) => {
  if (!player) return player;
  const { passwordHash, passwordSalt, ...safePlayer } = player;
  return safePlayer;
};

const hashPassword = (password, salt = crypto.randomBytes(16).toString('hex')) => {
  const hash = crypto
    .pbkdf2Sync(password, salt, HASH_ITERATIONS, HASH_KEY_LENGTH, HASH_DIGEST)
    .toString('hex');

  return { hash, salt };
};

const verifyPassword = (password, salt, expectedHash) => {
  if (!password || !salt || !expectedHash) return false;

  const { hash } = hashPassword(password, salt);
  return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(expectedHash, 'hex'));
};

class Player {
  static async create(username) {
    const id = uuidv4();
    const result = await db.run(
      `INSERT INTO players (id, username, elo, wins, losses, totalGestures, highestCombo, isGuest)
       VALUES (?, ?, 1000, 0, 0, 0, 0, 0)`,
      [id, username]
    );
    return this.getById(id);
  }

  static async createWithPassword(username, password) {
    const id = uuidv4();
    const { hash, salt } = hashPassword(password);

    await db.run(
      `INSERT INTO players (id, username, elo, wins, losses, totalGestures, highestCombo, passwordHash, passwordSalt, isGuest)
       VALUES (?, ?, 1000, 0, 0, 0, 0, ?, ?, 0)`,
      [id, username, hash, salt]
    );

    return this.getById(id);
  }

  static async createAnonymous() {
    const id = uuidv4();
    const username = `Guest-${id.slice(0, 8)}`;

    await db.run(
      `INSERT INTO players (id, username, elo, wins, losses, totalGestures, highestCombo, isGuest)
       VALUES (?, ?, 1000, 0, 0, 0, 0, 1)`,
      [id, username]
    );

    return this.getById(id);
  }

  static async getById(id) {
    return sanitizePlayer(await db.get(`SELECT * FROM players WHERE id = ?`, [id]));
  }

  static async getByUsername(username) {
    return sanitizePlayer(await db.get(`SELECT * FROM players WHERE username = ?`, [username]));
  }

  static async getAuthByUsername(username) {
    return db.get(`SELECT * FROM players WHERE username = ?`, [username]);
  }

  static async login(username, password) {
    const player = await this.getAuthByUsername(username);
    if (!player || player.isGuest) return null;
    if (!verifyPassword(password, player.passwordSalt, player.passwordHash)) return null;

    return sanitizePlayer(player);
  }

  static async updateElo(playerId, eloChange) {
    return db.run(
      `UPDATE players SET elo = elo + ? WHERE id = ?`,
      [eloChange, playerId]
    );
  }

  static async updateStats(playerId, stats) {
    const updateFields = [];
    const params = [];

    for (const [key, value] of Object.entries(stats)) {
      if (key === 'wins' || key === 'losses') {
        updateFields.push(`${key} = ${key} + ?`);
      } else {
        updateFields.push(`${key} = MAX(${key}, ?)`);
      }
      params.push(value);
    }

    params.push(playerId);

    return db.run(
      `UPDATE players SET ${updateFields.join(', ')}, lastPlayedAt = CURRENT_TIMESTAMP WHERE id = ?`,
      params
    );
  }

  static async getLeaderboard(limit = 50, offset = 0) {
    const players = await db.all(
      `SELECT * FROM players ORDER BY elo DESC LIMIT ? OFFSET ?`,
      [limit, offset]
    );
    return players.map(sanitizePlayer);
  }

  static async existsByUsername(username) {
    console.log(`[Player.existsByUsername] Checking: ${username}`);
    const result = await db.get(
      `SELECT COUNT(*) as count FROM players WHERE username = ?`,
      [username]
    );
    console.log(`[Player.existsByUsername] Result:`, result);
    return result.count > 0;
  }
}

module.exports = Player;
