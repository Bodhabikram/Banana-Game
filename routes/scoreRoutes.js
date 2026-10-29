const express = require('express');
const requireLogin = require('../middleware/auth');
const scoreModel = require('../models/scoreModel');

const router = express.Router();

// GET /api/scores
router.get('/', requireLogin, (req, res) => {
  res.json({
    mine: scoreModel.getTotal(req.user.id),
    leaderboard: scoreModel.getLeaderboard(10),
  });
});

module.exports = router;