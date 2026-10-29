// =============================================================================
// API Client & UI Notification Helpers
// Centralizes all REST calls, JWT auth token attachment, and toast messages
// =============================================================================

const API_BASE = ''; // Relative paths serve seamlessly from EC2 or localhost

/**
 * Get stored JWT auth token
 */
function getToken() {
  return localStorage.getItem('token');
}

/**
 * Get stored current user object
 */
function getCurrentUser() {
  try {
    const raw = localStorage.getItem('user');
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}

/**
 * Set user session
 */
function setSession(token, user) {
  localStorage.setItem('token', token);
  localStorage.setItem('user', JSON.stringify(user));
}

/**
 * Clear user session
 */
function clearSession() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
}

/**
 * Check authentication on protected pages
 */
function requireAuth() {
  const token = getToken();
  if (!token) {
    window.location.href = '/login.html';
  }
}

/**
 * Redirect to dashboard if already authenticated
 */
function redirectIfAuthenticated() {
  const token = getToken();
  if (token) {
    window.location.href = '/dashboard.html';
  }
}

/**
 * Unified API fetch wrapper
 */
async function apiFetch(endpoint, options = {}) {
  const token = getToken();
  const headers = options.headers || {};

  // If body is NOT FormData, set Content-Type to application/json
  if (!(options.body instanceof FormData) && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  // Attach JWT Bearer token
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const config = {
    ...options,
    headers,
  };

  try {
    const response = await fetch(`${API_BASE}${endpoint}`, config);

    // If unauthorized / session expired, redirect to login
    if (response.status === 401 && !endpoint.includes('/api/auth/login')) {
      clearSession();
      showToast('Session expired. Please log in again.', 'error');
      setTimeout(() => {
        window.location.href = '/login.html';
      }, 1000);
      throw new Error('Unauthorized');
    }

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || `Request failed with status ${response.status}`);
    }

    return data;
  } catch (err) {
    console.error(`API Error [${endpoint}]:`, err);
    throw err;
  }
}

/**
 * Toast Notification system
 */
function showToast(message, type = 'info') {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    container.className = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `
    <span>${type === 'success' ? '✓' : type === 'error' ? '✕' : 'ℹ'}</span>
    <div>${message}</div>
  `;

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(100%)';
    toast.style.transition = 'all 0.3s ease-out';
    setTimeout(() => {
      toast.remove();
    }, 300);
  }, 4000);
}

/**
 * Format currency amount (INR / ₹)
 */
function formatCurrency(amount) {
  const num = parseFloat(amount) || 0;
  return '₹' + num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/**
 * Format YYYY-MM-DD date to readable format
 */
function formatDate(dateStr) {
  if (!dateStr) return 'N/A';
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}
