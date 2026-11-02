// AI-assisted, reviewed by me.

function initGameEvents({ onGuess, onHint, onNewPuzzle, onLogout }) {
  // EVENT: the user submits a guess
  document.getElementById('guess-form').addEventListener('submit', (event) => {
    event.preventDefault();
    onGuess(document.getElementById('guess-input').value);
  });

  // EVENT: the user asks for a hint
  document.getElementById('hint-btn').addEventListener('click', () => {
    onHint();
  });

  // EVENT: the user asks for a new puzzle
  document.getElementById('new-puzzle-btn').addEventListener('click', () => {
    onNewPuzzle();
  });

  // EVENT: the user logs out
  document.getElementById('logout-btn').addEventListener('click', () => {
    onLogout();
  });
}
