const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');

dotenv.config();

const dbPath = process.env.DATABASE_PATH || path.join(__dirname, '../data/gesture-battle.db');

// Ensure data directory exists
const dataDir = path.dirname(dbPath);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) console.error('Database connection error:', err);
  else console.log('Connected to SQLite database');
});

db.configure('busyTimeout', 5000);

const initialize = () => {
  // Players table
  db.run(`
    CREATE TABLE IF NOT EXISTS players (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      elo INTEGER DEFAULT 1000,
      wins INTEGER DEFAULT 0,
      losses INTEGER DEFAULT 0,
      totalGestures INTEGER DEFAULT 0,
      highestCombo INTEGER DEFAULT 0,
      passwordHash TEXT,
      passwordSalt TEXT,
      isGuest INTEGER DEFAULT 0,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      lastPlayedAt DATETIME
    )
  `);

  db.run(`ALTER TABLE players ADD COLUMN passwordHash TEXT`, (err) => {
    if (err && !err.message.includes('duplicate column name')) console.error(err);
  });
  db.run(`ALTER TABLE players ADD COLUMN passwordSalt TEXT`, (err) => {
    if (err && !err.message.includes('duplicate column name')) console.error(err);
  });
  db.run(`ALTER TABLE players ADD COLUMN isGuest INTEGER DEFAULT 0`, (err) => {
    if (err && !err.message.includes('duplicate column name')) console.error(err);
  });

  // Matches table
  db.run(`
    CREATE TABLE IF NOT EXISTS matches (
      id TEXT PRIMARY KEY,
      player1Id TEXT NOT NULL,
      player2Id TEXT NOT NULL,
      player1Score INTEGER DEFAULT 0,
      player2Score INTEGER DEFAULT 0,
      player1Combo INTEGER DEFAULT 0,
      player2Combo INTEGER DEFAULT 0,
      winnerId TEXT,
      duration INTEGER DEFAULT 60,
      eloChangePlayer1 INTEGER DEFAULT 0,
      eloChangePlayer2 INTEGER DEFAULT 0,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      completedAt DATETIME,
      FOREIGN KEY (player1Id) REFERENCES players(id),
      FOREIGN KEY (player2Id) REFERENCES players(id),
      FOREIGN KEY (winnerId) REFERENCES players(id)
    )
  `);

  // Match history table
  db.run(`
    CREATE TABLE IF NOT EXISTS matchHistory (
      id TEXT PRIMARY KEY,
      playerId TEXT NOT NULL,
      matchId TEXT NOT NULL,
      score INTEGER,
      combo INTEGER,
      gestures INTEGER,
      won BOOLEAN,
      eloChange INTEGER,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (playerId) REFERENCES players(id),
      FOREIGN KEY (matchId) REFERENCES matches(id)
    )
  `);

  // Leaderboard cache table
  db.run(`
    CREATE TABLE IF NOT EXISTS leaderboard (
      playerId TEXT PRIMARY KEY,
      username TEXT,
      elo INTEGER,
      wins INTEGER,
      losses INTEGER,
      winRate REAL,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (playerId) REFERENCES players(id)
    )
  `);
};

const run = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function(err) {
      if (err) reject(err);
      else resolve({ id: this.lastID, changes: this.changes });
    });
  });
};

const get = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
};

const all = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
};

module.exports = {
  db,
  initialize,
  run,
  get,
  all
};
