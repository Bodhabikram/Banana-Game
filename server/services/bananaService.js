const config = require('../config');

const REQUEST_TIMEOUT_MS = 5000;

async function fetchPuzzle() {
  const response = await fetch(config.bananaApiUrl, {
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });

  if (!response.ok) {
    throw new Error(`Banana API returned status ${response.status}`);
  }

  const data = await response.json();
  const image = data.question;
  const solution = Number(data.solution);

  if (typeof image !== 'string' || image === '' || Number.isNaN(solution)) {
    throw new Error('Unexpected response from Banana API: ' + JSON.stringify(data));
  }

  return { image, solution };
}

module.exports = { fetchPuzzle };