// AI-assisted, reviewed by me.

const ui = {
  currentUser: null,
  audio: null,

  message(text, isError) {
    const element = document.getElementById('message');
    element.textContent = text;
    element.className = `message ${isError ? 'error' : 'success'}`;
  },

  username(name) {
    this.currentUser = name;
    document.getElementById('username').textContent = name;

    const avatar = document.getElementById('avatar');
    if (avatar) avatar.textContent = name.charAt(0).toUpperCase();
  },

  total(value) {
    const element = document.getElementById('total');
    if (element.textContent === String(value)) return;
    element.textContent = value;
    element.classList.remove('bump');
    void element.offsetWidth;
    element.classList.add('bump');
  },

  streak(value) {
    const element = document.getElementById('streak');
    if (element.textContent === String(value)) return;
    element.textContent = value;
    element.classList.remove('bump');
    void element.offsetWidth;
    element.classList.add('bump');
  },

  timer(text, state) {
    const element = document.getElementById('timer');
    element.textContent = text;
    element.className = state || '';
  },

  puzzleLoading(isLoading) {
    document.getElementById('puzzle-loading').hidden = !isLoading;
  },

  puzzle(image) {
    const element = document.getElementById('puzzle-image');
    element.src = image;
    element.hidden = false;
  },

  clearPuzzle() {
    const element = document.getElementById('puzzle-image');
    element.hidden = true;
    element.removeAttribute('src');
  },

  clearGuess() {
    document.getElementById('guess-input').value = '';
  },

  hint(text) {
    document.getElementById('hint-text').textContent = text;
  },

  resetHint() {
    document.getElementById('hint-text').textContent = '';
    document.getElementById('hint-btn').disabled = false;
  },

  hintUsed() {
    document.getElementById('hint-btn').disabled = true;
  },

  leaderboard(rows) {
    const list = document.getElementById('leaderboard');
    list.innerHTML = '';

    if (rows.length === 0) {
      const empty = document.createElement('li');
      empty.className = 'lb-empty';
      empty.textContent = 'No scores yet. Be the first!';
      list.appendChild(empty);
      return;
    }

    rows.forEach((row, index) => {
      const item = document.createElement('li');
      item.className = 'lb-row';

      if (index === 0) item.classList.add('top-1');
      else if (index === 1) item.classList.add('top-2');
      else if (index === 2) item.classList.add('top-3');

      if (row.username === this.currentUser) item.classList.add('me');

      const rank = document.createElement('span');
      rank.className = 'lb-rank';
      rank.textContent = index + 1;

      const name = document.createElement('span');
      name.className = 'lb-name';
      name.textContent = row.username;

      const points = document.createElement('span');
      points.className = 'lb-points';
      points.textContent = `${row.total} pts`;

      item.append(rank, name, points);
      list.appendChild(item);
    });
  },

  setBusy(isBusy) {
    document.getElementById('guess-btn').disabled = isBusy;
    document.getElementById('new-puzzle-btn').disabled = isBusy;
    document.getElementById('logout-btn').disabled = isBusy;
  },

  shake() {
    const card = document.getElementById('game-card');
    card.classList.remove('shake');
    void card.offsetWidth;
    card.classList.add('shake');
  },

  confetti() {
    const container = document.getElementById('confetti');
    const colors = ['#ffd93d', '#ffb300', '#43c463', '#ff8a3d', '#ff5d8f', '#7ad7ff'];

    for (let i = 0; i < 55; i += 1) {
      const piece = document.createElement('span');
      piece.className = 'confetti-piece';
      piece.style.left = `${Math.random() * 100}%`;
      piece.style.background = colors[Math.floor(Math.random() * colors.length)];
      piece.style.animationDelay = `${Math.random() * 0.3}s`;
      piece.style.animationDuration = `${1.2 + Math.random() * 0.8}s`;
      container.appendChild(piece);
      setTimeout(() => piece.remove(), 2500);
    }
  },

  playSound(type) {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;

      if (!this.audio) this.audio = new AudioCtx();
      const context = this.audio;
      const now = context.currentTime;
      const oscillator = context.createOscillator();
      const gain = context.createGain();

      const notes =
        type === 'correct' ? [523, 659, 784] : type === 'hint' ? [440] : [220, 175];

      oscillator.type = 'sine';
      notes.forEach((frequency, index) => {
        oscillator.frequency.setValueAtTime(frequency, now + index * 0.12);
      });

      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

      oscillator.connect(gain).connect(context.destination);
      oscillator.start(now);
      oscillator.stop(now + 0.5);
    } catch (err) {
      // Audio is a bonus; ignore failures (e.g. autoplay blocked).
    }
  },
};
