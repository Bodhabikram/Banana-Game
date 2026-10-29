const express = require('express');
const requireLogin = require('../middleware/requireLogin');
const { fetchPuzzle } = require('../services/bananaService');
const scoreModel = require('../models/scoreModel');

const router = express.Router();

const POINTS_PER_CORRECT_ANSWER = 10;

// userId -> the solution of the puzzle currently shown to that user
const activePuzzles = new Map();

router.use(requireLogin);

// GET /api/game/puzzle
router.get('/puzzle', async (req, res) => {
  try {
    const { image, solution } = await fetchPuzzle();
    activePuzzles.set(req.user.id, solution);
    res.json({ image });
  } catch (err) {
    console.error('Puzzle error:', err.message);
    res.status(502).json({ error: 'Could not load a puzzle from the Banana API' });
  }
});
// POST /api/game/guess   body: { guess: number }
router.post('/guess', (req, res) => {
  const guess = Number(req.body.guess);

  if (!Number.isInteger(guess)) {
    return res.status(400).json({ error: 'Guess must be a whole number' });
  }

  if (!activePuzzles.has(req.user.id)) {
    return res.status(400).json({ error: 'No active puzzle. Request a new one.' });
  }

  const solution = activePuzzles.get(req.user.id);
  activePuzzles.delete(req.user.id);

  const correct = guess === solution;
  if (correct) {
    scoreModel.addPoints(req.user.id, POINTS_PER_CORRECT_ANSWER);
  }

  res.json({ correct, solution, total: scoreModel.getTotal(req.user.id) });
});

module.exports = router;