// AI-assisted, reviewed by me.

let isBusy = false;
let timerId = null;
let puzzleStartedAt = 0;
let sessionStatus = 'none';

function stopTimer() {
  if (timerId) {
    clearInterval(timerId);
    timerId = null;
  }
  ui.timer('Waiting for a puzzle', 'slow');
}

function updateTimer() {
  const seconds = Math.floor((Date.now() - puzzleStartedAt) / 1000);

  if (seconds <= 10) {
    ui.timer(`${seconds}s - fast bonus +5`, 'fast');
  } else if (seconds <= 20) {
    ui.timer(`${seconds}s - speed bonus +2`, 'medium');
  } else {
    ui.timer(`${seconds}s - no speed bonus`, 'slow');
  }
}

function startTimer(elapsedMs = 0) {
  stopTimer();
  puzzleStartedAt = Date.now() - elapsedMs;
  updateTimer();
  timerId = setInterval(updateTimer, 250);
}

function applyState(state) {
  sessionStatus = state.status;
  ui.total(state.score);
  ui.best(state.best);
  ui.streak(state.streak);
  ui.lives(state.status === 'none' ? state.maxLives : state.lives, state.maxLives);
}

async function loadPuzzle(clearMessage = true) {
  if (clearMessage) ui.message('');

  stopTimer();
  ui.puzzleLoading(true);
  ui.clearPuzzle();
  ui.resetHint();

  try {
    const { image } = await api.getPuzzle();
    ui.puzzle(image);
    startTimer(0);
  } catch (err) {
    ui.message(err.message, true);
  } finally {
    ui.puzzleLoading(false);
  }
}

async function loadScores() {
  try {
    const { mine, best, leaderboard } = await api.getScores();
    ui.total(mine);
    ui.best(best);
    ui.leaderboard(leaderboard);
  } catch (err) {
    ui.message(err.message, true);
  }
}

async function refreshGameState() {
  const state = await api.getGameState();
  applyState(state);

  if (state.status === 'active') {
    ui.showStartMenu({ canResume: true });
  } else if (state.status === 'over') {
    ui.showGameOver(state.score, state.best);
  } else {
    ui.showStartMenu({ canResume: false });
  }
}

async function startNewGame() {
  if (isBusy) return;

  isBusy = true;
  ui.setBusy(true);

  try {
    const state = await api.newGame();
    applyState(state);
    ui.hideMenu();
    ui.clearGuess();
    ui.message('');
    ui.resetHint();
    ui.timer('Waiting for a puzzle', 'slow');

    await loadPuzzle();
    await loadScores();
  } catch (err) {
    ui.message(err.message, true);
  } finally {
    isBusy = false;
    ui.setBusy(false);
  }
}

async function resumeGame() {
  if (isBusy) return;

  isBusy = true;
  ui.setBusy(true);

  try {
    const state = await api.resumeGame();
    applyState(state);
    ui.hideMenu();
    ui.clearGuess();
    ui.message('');

    if (state.image) {
      ui.puzzleLoading(false);
      ui.puzzle(state.image);
      if (state.hintUsed) ui.hintUsed();
      else ui.resetHint();
      startTimer(state.elapsedMs || 0);
    } else {
      await loadPuzzle();
    }

    await loadScores();
  } catch (err) {
    ui.message(err.message, true);
  } finally {
    isBusy = false;
    ui.setBusy(false);
  }
}

async function handleGuess(rawValue) {
  if (isBusy) return;

  const guess = Number(rawValue);

  if (!rawValue.trim() || !Number.isInteger(guess)) {
    ui.message('Enter a whole number.', true);
    return;
  }

  isBusy = true;
  ui.setBusy(true);
  ui.message('Checking your answer...');

  try {
    const result = await api.submitGuess(guess);
    ui.clearGuess();
    ui.total(result.total);
    ui.best(result.best);
    ui.streak(result.streak);
    ui.lives(result.lives, result.maxLives);
    stopTimer();

    if (result.correct) {
      const extras = [];
      if (result.speedBonus > 0) extras.push(`speed +${result.speedBonus}`);
      if (result.streakBonus > 0) extras.push(`streak +${result.streakBonus}`);
      if (result.hinted) extras.push('hint -3');

      const detail = extras.length ? ` (${extras.join(', ')})` : '';
      ui.message(`Correct! +${result.points} points${detail}`, false);
      ui.confetti();
      ui.playSound('correct');

      await Promise.all([loadPuzzle(false), loadScores()]);
    } else if (result.gameOver) {
      sessionStatus = 'over';
      ui.message(`Not quite. The answer was ${result.solution}.`, true);
      ui.shake();
      ui.playSound('gameover');
      ui.showGameOver(result.total, result.best);
      await loadScores();
    } else {
      ui.message(
        `Not quite. The answer was ${result.solution}. ${result.lives} ${
          result.lives === 1 ? 'life' : 'lives'
        } left.`,
        true
      );
      ui.shake();
      ui.playSound('wrong');

      await Promise.all([loadPuzzle(false), loadScores()]);
    }
  } catch (err) {
    ui.message(err.message, true);
  } finally {
    isBusy = false;
    ui.setBusy(false);
  }
}

async function handleHint() {
  if (isBusy) return;

  try {
    const result = await api.getHint();
    const suffix = result.alreadyUsed ? '' : ` (-${result.penalty} points this round)`;
    ui.hint(`Hint: the answer is ${result.hint}.${suffix}`);
    ui.hintUsed();
    ui.playSound('hint');
  } catch (err) {
    ui.message(err.message, true);
  }
}

async function handleNewPuzzle() {
  if (isBusy) return;

  isBusy = true;
  ui.setBusy(true);
  ui.clearGuess();
  await loadPuzzle();
  isBusy = false;
  ui.setBusy(false);
}

function openMenu() {
  if (isBusy) return;
  stopTimer();
  ui.showStartMenu({ canResume: sessionStatus === 'active' });
}

function mainMenu() {
  ui.showStartMenu({ canResume: false });
}

async function handleLogout() {
  try {
    await api.logout();
  } finally {
    window.location.href = 'login.html';
  }
}

async function init() {
  try {
    const user = await api.getMe();
    ui.username(user.username);
  } catch (err) {
    return;
  }

  initGameEvents({
    onGuess: handleGuess,
    onHint: handleHint,
    onNewPuzzle: handleNewPuzzle,
    onLogout: handleLogout,
    onNewGame: startNewGame,
    onResume: resumeGame,
    onOpenMenu: openMenu,
    onMainMenu: mainMenu,
  });

  try {
    await Promise.all([refreshGameState(), loadScores()]);
  } catch (err) {
    ui.message(err.message, true);
  }
}

init();
