// AI-assisted, reviewed by me.

let isBusy = false;
let timerId = null;
let puzzleStartedAt = 0;

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

function startTimer() {
  stopTimer();
  puzzleStartedAt = Date.now();
  updateTimer();
  timerId = setInterval(updateTimer, 250);
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
    startTimer();
  } catch (err) {
    ui.message(err.message, true);
  } finally {
    ui.puzzleLoading(false);
  }
}

async function loadScores() {
  try {
    const { mine, leaderboard } = await api.getScores();
    ui.total(mine);
    ui.leaderboard(leaderboard);
  } catch (err) {
    ui.message(err.message, true);
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
    ui.streak(result.streak);
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
    } else {
      ui.message(`Not quite. The answer was ${result.solution}.`, true);
      ui.shake();
      ui.playSound('wrong');
    }

    await Promise.all([loadPuzzle(false), loadScores()]);
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
  });

  await Promise.all([loadPuzzle(), loadScores()]);
}

init();
