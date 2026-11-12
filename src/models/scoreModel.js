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

// Keep best_score in sync for databases created before the column existed.
db.exec(`
  UPDATE users
  SET best_score = (
    SELECT COALESCE(SUM(score), 0) FROM scores WHERE scores.user_id = users.id
  )
  WHERE best_score = 0
`);

function getTotal(userId) {
  return db
    .prepare('SELECT COALESCE(SUM(score), 0) AS total FROM scores WHERE user_id = ?')
    .get(userId).total;
}

function getBest(userId) {
  const row = db.prepare('SELECT best_score FROM users WHERE id = ?').get(userId);
  return row ? row.best_score : 0;
}

function syncBestScore(userId) {
  const total = getTotal(userId);
  db.prepare('UPDATE users SET best_score = ? WHERE id = ? AND best_score < ?').run(
    total,
    userId,
    total
  );
}

function addPoints(userId, points) {
  if (!Number.isInteger(points) || points <= 0) {
    throw new Error('Points must be a positive whole number');
  }

  const result = db
    .prepare('INSERT INTO scores (user_id, score) VALUES (?, ?)')
    .run(userId, points);

  syncBestScore(userId);
  return result;
}

// Called on logout: the running score returns to zero, the personal best stays.
function resetCurrentScore(userId) {
  return db.prepare('DELETE FROM scores WHERE user_id = ?').run(userId);
}

function getLeaderboard(limit = 10) {
  return db
    .prepare(`
      SELECT username, best_score AS total
      FROM users
      WHERE best_score > 0
      ORDER BY best_score DESC, username COLLATE NOCASE ASC
      LIMIT ?
    `)
    .all(limit);
}

module.exports = { addPoints, getTotal, getBest, getLeaderboard, resetCurrentScore };