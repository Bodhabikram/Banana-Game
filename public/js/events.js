// AI-assisted, reviewed by me.

function initGameEvents({
  onGuess,
  onHint,
  onNewPuzzle,
  onLogout,
  onNewGame,
  onResume,
  onOpenMenu,
  onMainMenu,
}) {
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

  // EVENT: the user starts a new game (menu or play again)
  document.getElementById('new-game-btn').addEventListener('click', () => {
    onNewGame();
  });
  document.getElementById('play-again-btn').addEventListener('click', () => {
    onNewGame();
  });

  // EVENT: the user resumes the run they left
  document.getElementById('resume-btn').addEventListener('click', () => {
    onResume();
  });

  // EVENT: the user opens the in-game menu
  document.getElementById('open-menu-btn').addEventListener('click', () => {
    onOpenMenu();
  });

  // EVENT: the user goes back to the start menu after game over
  document.getElementById('menu-btn').addEventListener('click', () => {
    onMainMenu();
  });
}
