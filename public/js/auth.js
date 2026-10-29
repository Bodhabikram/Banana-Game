// Event-driven code for the register and login pages

async function sendAuth(endpoint, body) {
  const response = await fetch(`/api/auth/${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  const data = await response.json().catch(() => ({}));
  return { ok: response.ok, data };
}

function showMessage(text, isError) {
  const element = document.getElementById('message');
  element.textContent = text;
  element.className = isError ? 'error' : 'success';
}

const registerForm = document.getElementById('register-form');
if (registerForm) {
  // EVENT: the user submits the register form
  registerForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    const username = document.getElementById('username').value.trim();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;

    const { ok, data } = await sendAuth('register', { username, email, password });
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

    const { ok, data } = await sendAuth('login', { identifier, password });
    showMessage(data.message || data.error || 'Something went wrong', !ok);

    if (ok) {
      window.location.href = 'index.html';
    }
  });
}