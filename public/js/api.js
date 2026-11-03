async function request(url, options = {}) {
  const response = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });

  if (response.status === 401) {
    window.location.href = 'login.html';
    throw new Error('Not logged in');
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || `Request failed (${response.status})`);
  }

  return data;
}

const api = {
  getMe: () => request('/api/auth/me'),
  getGameState: () => request('/api/game/state'),
  newGame: () => request('/api/game/new', { method: 'POST' }),
  resumeGame: () => request('/api/game/resume', { method: 'POST' }),
  getPuzzle: () => request('/api/game/puzzle'),
  getHint: () => request('/api/game/hint'),
  submitGuess: (guess) =>
    request('/api/game/guess', {
      method: 'POST',
      body: JSON.stringify({ guess }),
    }),
  getScores: () => request('/api/scores'),
  logout: () => request('/api/auth/logout', { method: 'POST' }),
};
