// ============================================================
// vocabApi.js — Alle Aufrufe an das PHP-Backend
// ============================================================

// Vor dem Build auf echte Server-URL ändern:
const API_BASE = 'http://localhost/vocab-app/api';

// ──────────────────────────────────────────────────────────────
// Hilfsfunktionen
// ──────────────────────────────────────────────────────────────

function getToken() {
  return localStorage.getItem('vocab_token');
}

function saveToken(token) {
  localStorage.setItem('vocab_token', token);
}

function clearToken() {
  localStorage.removeItem('vocab_token');
  localStorage.removeItem('vocab_user');
}

function saveUser(user) {
  localStorage.setItem('vocab_user', JSON.stringify(user));
}

export function getSavedUser() {
  try {
    return JSON.parse(localStorage.getItem('vocab_user'));
  } catch {
    return null;
  }
}

export function isLoggedIn() {
  return !!getToken();
}

export function logout() {
  clearToken();
}

// Basis-Fetch mit Auth-Header und automatischem Logout bei 401
async function apiFetch(path, options = {}) {
  const token = getToken();
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers ?? {}),
    },
  });

  if (res.status === 401) {
    clearToken();
    // Seite neu laden → App zeigt Login-Screen
    window.location.reload();
    throw new Error('Nicht eingeloggt');
  }

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error ?? `HTTP ${res.status}`);
  }
  return data;
}

// ──────────────────────────────────────────────────────────────
// Auth
// ──────────────────────────────────────────────────────────────

/** Neuen Account erstellen. Gibt { token, user_id, email } zurück. */
export async function register(email, password) {
  const data = await apiFetch('/register.php', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  saveToken(data.token);
  saveUser({ user_id: data.user_id, email: data.email });
  return data;
}

/** Einloggen. Gibt { token, user_id, email } zurück. */
export async function login(email, password) {
  const data = await apiFetch('/login.php', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  saveToken(data.token);
  saveUser({ user_id: data.user_id, email: data.email });
  return data;
}

// ──────────────────────────────────────────────────────────────
// Vokabeln
// ──────────────────────────────────────────────────────────────

/** Alle Vokabeln + Fortschritt für eine Kategorie holen. */
export async function getWords(category) {
  return apiFetch(`/get_words.php?category=${encodeURIComponent(category)}`);
}

/** Antwort einreichen. correct = true | false */
export async function submitAnswer(wordId, correct) {
  return apiFetch('/answer.php', {
    method: 'POST',
    body: JSON.stringify({ word_id: wordId, correct }),
  });
}

/** N Wörter aus dem Pool (Stufe 0) in Stufe 1 verschieben. */
export async function addWords(category, count) {
  return apiFetch('/add_words.php', {
    method: 'POST',
    body: JSON.stringify({ category, count }),
  });
}

/** Statistik: Anzahl Wörter je Stufe. Optional: category. */
export async function getStats(category = null) {
  const param = category ? `?category=${encodeURIComponent(category)}` : '';
  return apiFetch(`/get_stats.php${param}`);
}

/** Verfall prüfen: Stufe-5-Wörter die > 30 Tage alt sind → Stufe 4. */
export async function checkDecay() {
  return apiFetch('/check_decay.php', { method: 'POST' });
}
