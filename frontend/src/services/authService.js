const API = import.meta.env.API_URL || 'http://localhost:8000';

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
  if (!res.ok) throw new Error('Register failed');
  const data = await res.json();
  setToken(data.token);
  return data;
}

export async function login({ email, password }) {
  const res = await fetch(`${API}/api/player/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  if (!res.ok) throw new Error('Login failed');
  const data = await res.json();
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


