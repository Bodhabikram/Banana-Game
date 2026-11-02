// AI-assisted, reviewed by me.

const express = require('express');
const requireLogin = require('../middleware/requireLogin');
const { fetchPuzzle } = require('../services/bananaService');
const scoreModel = require('../models/scoreModel');

const router = express.Router();

const POINTS_PER_CORRECT_ANSWER = 10;
const FAST_BONUS_MS = 10000;
const FAST_BONUS_POINTS = 5;
const SPEED_BONUS_MS = 20000;
const SPEED_BONUS_POINTS = 2;
const STREAK_BONUS_PER_LEVEL = 2;
const MAX_STREAK_BONUS = 10;
const HINT_PENALTY = 3;
const PUZZLE_TTL_MS = 10 * 60 * 1000;

// userId -> { solution, startedAt, hintUsed }
const activePuzzles = new Map();
// userId -> number of correct answers in a row
const streaks = new Map();

function getActivePuzzle(userId) {
  const puzzle = activePuzzles.get(userId);

  if (!puzzle) return null;

  if (Date.now() - puzzle.startedAt > PUZZLE_TTL_MS) {
    activePuzzles.delete(userId);
    return null;
  }

  return puzzle;
}

setInterval(() => {
  const now = Date.now();
  for (const [userId, puzzle] of activePuzzles) {
    if (now - puzzle.startedAt > PUZZLE_TTL_MS) activePuzzles.delete(userId);
  }
}, PUZZLE_TTL_MS).unref();

router.use(requireLogin);

// GET /api/game/puzzle
router.get('/puzzle', async (req, res) => {
  try {
    const { image, solution } = await fetchPuzzle();
    activePuzzles.set(req.user.id, {
      solution,
      startedAt: Date.now(),
      hintUsed: false,
    });
    res.json({ image });
  } catch (err) {
    console.error('Puzzle error:', err.message);
    res.status(502).json({ error: 'Could not load a puzzle from the Banana API' });
  }
});

// GET /api/game/hint   reveals whether the answer is even or odd, for a cost
router.get('/hint', (req, res) => {
  const puzzle = getActivePuzzle(req.user.id);

  if (!puzzle) {
    return res.status(400).json({ error: 'No active puzzle. Request a new one.' });
  }

  const hint = puzzle.solution % 2 === 0 ? 'even' : 'odd';
  const alreadyUsed = puzzle.hintUsed;
  puzzle.hintUsed = true;

  res.json({ hint, penalty: alreadyUsed ? 0 : HINT_PENALTY, alreadyUsed });
});

// POST /api/game/guess   body: { guess: number }
router.post('/guess', (req, res) => {
  const guess = Number(req.body.guess);

  if (!Number.isInteger(guess)) {
    return res.status(400).json({ error: 'Guess must be a whole number' });
  }

  const puzzle = getActivePuzzle(req.user.id);

  if (!puzzle) {
    return res.status(400).json({ error: 'No active puzzle. Request a new one.' });
  }

  activePuzzles.delete(req.user.id);

  const elapsedMs = Date.now() - puzzle.startedAt;
  const correct = guess === puzzle.solution;

  let streak = streaks.get(req.user.id) || 0;
  let points = 0;
  let speedBonus = 0;
  let streakBonus = 0;

  if (correct) {
    streak += 1;

    if (elapsedMs <= FAST_BONUS_MS) {
      speedBonus = FAST_BONUS_POINTS;
    } else if (elapsedMs <= SPEED_BONUS_MS) {
      speedBonus = SPEED_BONUS_POINTS;
    }

    streakBonus = Math.min((streak - 1) * STREAK_BONUS_PER_LEVEL, MAX_STREAK_BONUS);

    points = POINTS_PER_CORRECT_ANSWER + speedBonus + streakBonus;
    if (puzzle.hintUsed) points -= HINT_PENALTY;
    if (points < 0) points = 0;

    if (points > 0) {
      scoreModel.addPoints(req.user.id, points);
    }
  } else {
    streak = 0;
  }

  streaks.set(req.user.id, streak);

  res.json({
    correct,
    solution: puzzle.solution,
    total: scoreModel.getTotal(req.user.id),
    points,
    streak,
    speedBonus,
    streakBonus,
    hinted: puzzle.hintUsed,
    elapsedMs,
  });
});

module.exports = router;
