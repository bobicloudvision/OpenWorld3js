const API = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const TOKEN_KEY = 'playerToken';

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

export async function register({ name, email, password }) {
  const res = await fetch(`${API}/api/player/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, password })
  });
  const data = await res.json();
  if (!res.ok) {
    const error = new Error(data.message || 'Register failed');
    error.errors = data.errors;
    throw error;
  }
  setToken(data.token);
  return data;
}

export async function login({ email, password }) {
  const res = await fetch(`${API}/api/player/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  const data = await res.json();
  if (!res.ok) {
    const error = new Error(data.message || 'Login failed');
    error.errors = data.errors;
    throw error;
  }
  setToken(data.token);
  return data;
}

export async function me() {
  const token = getToken();
  if (!token) return null;
  const res = await fetch(`${API}/api/player/me`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) return null;
  return await res.json();
}

export async function logout() {
  const token = getToken();
  if (!token) return;
  await fetch(`${API}/api/player/logout`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` }
  });
  clearToken();
}


