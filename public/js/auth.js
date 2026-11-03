// Event-driven code for the register and login pages
async function sendAuth(endpoint, body, button, busyText) {
  if (button) {
    button.disabled = true;
    button.dataset.label = button.textContent;
    button.textContent = busyText;
  }

  try {
    const response = await fetch(`/api/auth/${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const data = await response.json().catch(() => ({}));
    return { ok: response.ok, data };
  } catch (err) {
    return { ok: false, data: { error: 'Could not reach the server. Please try again.' } };
  } finally {
    if (button) {
      button.disabled = false;
      button.textContent = button.dataset.label;
    }
  }
}

function showMessage(text, isError) {
  const element = document.getElementById('message');
  element.textContent = text;
  element.className = `message ${isError ? 'error' : 'success'}`;
}

const registerForm = document.getElementById('register-form');
if (registerForm) {
  // EVENT: the user submits the register form
  registerForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    const username = document.getElementById('username').value.trim();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;

    const button = registerForm.querySelector('button[type="submit"]');
    const { ok, data } = await sendAuth(
      'register',
      { username, email, password },
      button,
      'Creating account...'
    );
    showMessage(data.message || data.error || 'Something went wrong', !ok);

    if (ok) {
      setTimeout(() => { window.location.href = 'login.html'; }, 1000);
    }
  });
}

const loginForm = document.getElementById('login-form');
if (loginForm) {
  // EVENT: the user submits the login form
  loginForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    const identifier = document.getElementById('identifier').value.trim();
    const password = document.getElementById('password').value;

    const button = loginForm.querySelector('button[type="submit"]');
    const { ok, data } = await sendAuth(
      'login',
      { identifier, password },
      button,
      'Logging in...'
    );
    showMessage(data.message || data.error || 'Something went wrong', !ok);

    if (ok) {
      window.location.href = 'index.html';
    }
  });
}

document.querySelectorAll('.toggle-password').forEach((button) => {
  // EVENT: the user toggles password visibility
  button.addEventListener('click', () => {
    const input = document.getElementById(button.dataset.target);
    if (!input) return;

    const shouldShow = input.type === 'password';
    input.type = shouldShow ? 'text' : 'password';
    button.textContent = shouldShow ? 'Hide' : 'Show';
    button.setAttribute('aria-pressed', String(shouldShow));
    button.setAttribute('aria-label', shouldShow ? 'Hide password' : 'Show password');
  });
});