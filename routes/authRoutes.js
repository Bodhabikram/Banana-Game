const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('../config');
const requireLogin = require('../middleware/requireLogin');
const userModel = require('../models/userModel');

const router = express.Router();

const COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: 'strict',
  secure: process.env.NODE_ENV === 'production',
  maxAge: 60 * 60 * 1000,
};

function validateRegistration(username, email, password) {
  if (typeof username !== 'string' || !/^[A-Za-z0-9_]{3,20}$/.test(username)) {
    return 'Username must be 3-20 characters: letters, numbers or underscore';
  }
  if (!userModel.isValidEmail(email)) {
    return 'Email must be between 5 and 254 characters';
  }
  if (typeof password !== 'string' || password.length < 8) {
    return 'Password must be at least 8 characters';
  }
  return null;
}

// POST /api/auth/register
router.post('/register', async (req, res) => {
  const { username, email, password } = req.body;

  const problem = validateRegistration(username, email, password);
  if (problem) return res.status(400).json({ error: problem });

  if (userModel.findByUsername(username)) {
    return res.status(409).json({ error: 'Username already taken' });
  }
  if (userModel.findByEmail(email)) {
    return res.status(409).json({ error: 'Email already registered' });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  userModel.createUser(username, email, passwordHash);

  res.status(201).json({ message: 'Account created. You can now log in.' });
});

// POST /api/auth/login   body: { identifier, password }
router.post('/login', async (req, res) => {
  const { identifier, password } = req.body;

  if (typeof identifier !== 'string' || typeof password !== 'string') {
    return res.status(400).json({ error: 'Username/email and password are required' });
  }

  const user = identifier.includes('@')
    ? userModel.findByEmail(identifier)
    : userModel.findByUsername(identifier);

  const passwordMatches = user && (await bcrypt.compare(password, user.password_hash));

  if (!passwordMatches) {
    return res.status(401).json({ error: 'Invalid username/email or password' });
  }

  const token = jwt.sign(
    { id: user.id, username: user.username },
    config.jwtSecret,
    { expiresIn: config.jwtExpiresIn }
  );

  res.cookie('token', token, COOKIE_OPTIONS);
  res.json({ message: 'Logged in', username: user.username });
});

// POST /api/auth/logout
router.post('/logout', (req, res) => {
  res.clearCookie('token', COOKIE_OPTIONS);
  res.json({ message: 'Logged out' });
});

// GET /api/auth/me   (protected)
router.get('/me', requireLogin, (req, res) => {
  const user = userModel.findById(req.user.id);
  if (!user) return res.status(401).json({ error: 'Account no longer exists' });
  res.json(user);
});

module.exports = router;