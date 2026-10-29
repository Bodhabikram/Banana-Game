const db = require('../db/database');

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  )
`);

const MIN_EMAIL_LENGTH = 5;
const MAX_EMAIL_LENGTH = 254;

function isValidEmail(email) {
  if (typeof email !== 'string') return false;
  const length = email.trim().length;
  return length >= MIN_EMAIL_LENGTH && length <= MAX_EMAIL_LENGTH;
}

function createUser(username, email, passwordHash) {
  if (!isValidEmail(email)) {
    throw new Error(`Email must be between ${MIN_EMAIL_LENGTH} and ${MAX_EMAIL_LENGTH} characters`);
  }

  return db
    .prepare('INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)')
    .run(username, email.trim().toLowerCase(), passwordHash);
}

function findByUsername(username) {
  return db.prepare('SELECT * FROM users WHERE username = ?').get(username);
}

function findByEmail(email) {
  return db.prepare('SELECT * FROM users WHERE email = ?').get(email.trim().toLowerCase());
}

function findById(id) {
  return db.prepare('SELECT id, username, email, created_at FROM users WHERE id = ?').get(id);
}

module.exports = { createUser, findByUsername, findByEmail, findById, isValidEmail };