const db = require('../db/database');
require('./userModel'); 

db.exec(`
  CREATE TABLE IF NOT EXISTS scores (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    score INTEGER NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
  )
`);

function addPoints(userId, points) {
  if (!Number.isInteger(points) || points <= 0) {
    throw new Error('Points must be a positive whole number');
  }

  return db
    .prepare('INSERT INTO scores (user_id, score) VALUES (?, ?)')
    .run(userId, points);
}

function getTotal(userId) {
  return db
    .prepare('SELECT COALESCE(SUM(score), 0) AS total FROM scores WHERE user_id = ?')
    .get(userId).total;
}

function getLeaderboard(limit = 10) {
  return db
    .prepare(`
      SELECT u.username, SUM(s.score) AS total
      FROM scores s
      JOIN users u ON u.id = s.user_id
      GROUP BY s.user_id
      ORDER BY total DESC
      LIMIT ?
    `)
    .all(limit);
}

module.exports = { addPoints, getTotal, getLeaderboard };