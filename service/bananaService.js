const config = require('../config');

async function fetchPuzzle() {
  const response = await fetch(config.bananaApiUrl);

  if (!response.ok) {
    throw new Error(`Banana API returned status ${response.status}`);
  }

  const data = await response.json();
  const image = data.question;
  const solution = Number(data.solution);

  if (!image || Number.isNaN(solution)) {
    throw new Error('Unexpected response from Banana API: ' + JSON.stringify(data));
  }

  return { image, solution };
}

module.exports = { fetchPuzzle };