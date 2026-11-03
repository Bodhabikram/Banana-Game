// AI-assisted, reviewed by me.

const MAX_LIVES = 3;

// In-memory state for the current game session of each user.
// userId -> { image, solution, startedAt, hintUsed }
const activePuzzles = new Map();
// userId -> number of correct answers in a row
const streaks = new Map();
// userId -> { lives, maxLives, status: 'active' | 'over' }
const sessions = new Map();

function getSession(userId) {
  return sessions.get(userId) || null;
}

function startSession(userId, lives = MAX_LIVES) {
  const session = { lives, maxLives: lives, status: 'active' };
  sessions.set(userId, session);
  return session;
}

function clearUserState(userId) {
  activePuzzles.delete(userId);
  streaks.delete(userId);
  sessions.delete(userId);
}

module.exports = {
  MAX_LIVES,
  activePuzzles,
  streaks,
  getSession,
  startSession,
  clearUserState,
};
