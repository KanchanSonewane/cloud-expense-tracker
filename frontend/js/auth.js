// =============================================================================
// Authentication Frontend Controller
// Manages Login, Registration, Logout, and User Header State
// =============================================================================

document.addEventListener('DOMContentLoaded', () => {
  // Update user badge in navbar if logged in
  const user = getCurrentUser();
  const userNameElem = document.getElementById('nav-user-name');
  if (userNameElem && user) {
    userNameElem.textContent = user.name || user.email;
  }

  // Handle Logout button
  const logoutBtn = document.getElementById('btn-logout');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', async (e) => {
      e.preventDefault();
      try {
        await apiFetch('/api/auth/logout', { method: 'POST' });
      } catch (err) {
        // proceed anyway
      }
      clearSession();
      showToast('Logged out successfully.', 'info');
      setTimeout(() => {
        window.location.href = '/login.html';
      }, 500);
    });
  }

  // Handle Login Form
  const loginForm = document.getElementById('form-login');
  if (loginForm) {
    redirectIfAuthenticated();

    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('email').value.trim();
      const password = document.getElementById('password').value;
      const submitBtn = loginForm.querySelector('button[type="submit"]');

      if (!email || !password) {
        showToast('Please fill in both email and password.', 'error');
        return;
      }

      try {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Authenticating with RDS...';

        const result = await apiFetch('/api/auth/login', {
          method: 'POST',
          body: JSON.stringify({ email, password }),
        });

        setSession(result.token, result.user);
        showToast('Login successful! Redirecting...', 'success');
        setTimeout(() => {
          window.location.href = '/dashboard.html';
        }, 600);
      } catch (err) {
        showToast(err.message || 'Login failed.', 'error');
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Sign In';
      }
    });
  }

  // Handle Registration Form
  const registerForm = document.getElementById('form-register');
  if (registerForm) {
    redirectIfAuthenticated();

    registerForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const name = document.getElementById('name').value.trim();
      const email = document.getElementById('email').value.trim();
      const password = document.getElementById('password').value;
      const confirmPassword = document.getElementById('confirm-password').value;
      const submitBtn = registerForm.querySelector('button[type="submit"]');

      if (!name || !email || !password) {
        showToast('Please fill in all required fields.', 'error');
        return;
      }

      if (password !== confirmPassword) {
        showToast('Passwords do not match.', 'error');
        return;
      }

      if (password.length < 6) {
        showToast('Password must be at least 6 characters long.', 'error');
        return;
      }

      try {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Creating account in RDS...';

        const result = await apiFetch('/api/auth/register', {
          method: 'POST',
          body: JSON.stringify({ name, email, password }),
        });

        setSession(result.token, result.user);
        showToast('Account created successfully! Redirecting...', 'success');
        setTimeout(() => {
          window.location.href = '/dashboard.html';
        }, 700);
      } catch (err) {
        showToast(err.message || 'Registration failed.', 'error');
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Create Account';
      }
    });
  }
});

// Demo account auto-fill helper
function fillDemoCredentials() {
  const emailInput = document.getElementById('email');
  const passwordInput = document.getElementById('password');
  if (emailInput && passwordInput) {
    emailInput.value = 'demo@cloudlab.edu';
    passwordInput.value = 'Demo@1234';
    showToast('Demo credentials prefilled! Click "Sign In" to continue.', 'info');
  }
}
