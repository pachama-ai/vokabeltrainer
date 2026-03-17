// ============================================================
// vocabApi.js — Alle Aufrufe an das PHP-Backend
// ============================================================

// Vor dem Build auf echte Server-URL ändern:
const API_BASE = 'http://localhost/vocab-app/api';

// ──────────────────────────────────────────────────────────────
// Hilfsfunktionen
// ──────────────────────────────────────────────────────────────

function getToken() {
  return localStorage.getItem('vocab_token') ?? sessionStorage.getItem('vocab_token');
}

function saveToken(token, remember) {
  if (remember) {
    localStorage.setItem('vocab_token', token);
    sessionStorage.removeItem('vocab_token');
  } else {
    sessionStorage.setItem('vocab_token', token);
    localStorage.removeItem('vocab_token');
  }
}

function clearToken() {
  localStorage.removeItem('vocab_token');
  localStorage.removeItem('vocab_user');
  sessionStorage.removeItem('vocab_token');
  sessionStorage.removeItem('vocab_user');
}

function saveUser(user, remember) {
  const store = remember ? localStorage : sessionStorage;
  store.setItem('vocab_user', JSON.stringify(user));
}

export function getSavedUser() {
  try {
    return JSON.parse(localStorage.getItem('vocab_user') ?? sessionStorage.getItem('vocab_user'));
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

// Basis-Fetch mit Auth-Header
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
    let msg = 'Incorrect email or password';
    try {
      const body = await res.json();
      if (body?.error && !body.error.toLowerCase().includes('eingeloggt')) msg = body.error;
    } catch {}
    throw Object.assign(new Error(msg), { status: 401 });
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
export async function register(username, email, password, remember = false) {
  const data = await apiFetch('/register.php', {
    method: 'POST',
    body: JSON.stringify({ username, email, password }),
  });
  saveToken(data.token, remember);
  saveUser({ user_id: data.user_id, email: data.email }, remember);
  return data;
}

/** Einloggen. Gibt { token, user_id, email } zurück. */
export async function login(email, password, remember = false) {
  const data = await apiFetch('/login.php', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  saveToken(data.token, remember);
  saveUser({ user_id: data.user_id, email: data.email }, remember);
  localStorage.setItem('vocab_pw_len', String(password.length));
  return data;
}

/** Neues Passwort per E-Mail anfordern. Antwort bleibt absichtlich generisch. */
export async function requestPasswordReset(email) {
  return apiFetch('/forgot_password.php', {
    method: 'POST',
    body: JSON.stringify({ email }),
  });
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

export async function getDetailStats(category) {
  return apiFetch(`/get_detail_stats.php?category=${encodeURIComponent(category)}`);
}

export async function startSession(category) {
  return apiFetch('/session.php', { method: 'POST', body: JSON.stringify({ action: 'start', category }) });
}

export async function endSession(sessionId, cardsReviewed) {
  return apiFetch('/session.php', { method: 'POST', body: JSON.stringify({ action: 'end', session_id: sessionId, cards_reviewed: cardsReviewed }) });
}

/** Verfall prüfen: Stufe-5-Wörter die > 30 Tage alt sind → Stufe 4. */
export async function checkDecay() {
  return apiFetch('/check_decay.php', { method: 'POST' });
}

/** Alle Kategorien aus der vocabulary-Tabelle zurückgeben. */
export async function getCategories() {
  return apiFetch('/get_categories.php');
}

/** Alle Vokabeln mit optionalem Filter + Paginierung. */
export async function getManageWords(category = 'all', search = '', offset = 0, limit = 20) {
  const p = new URLSearchParams({ category, search, offset: String(offset), limit: String(limit) });
  return apiFetch(`/get_all_words.php?${p}`);
}

/** Vokabel bearbeiten. */
export async function updateWord(wordId, word, translation) {
  return apiFetch('/update_word.php', {
    method: 'POST',
    body: JSON.stringify({ word_id: wordId, word, translation }),
  });
}

/** Vokabel löschen. */
export async function deleteWord(wordId) {
  return apiFetch('/delete_word.php', {
    method: 'POST',
    body: JSON.stringify({ word_id: wordId }),
  });
}

/** Neue Kategorie mit Vokabeln anlegen. Words: [{de, en}, ...] */
export async function createCategory(name, words) {
  return apiFetch('/create_category.php', {
    method: 'POST',
    body: JSON.stringify({ name, words }),
  });
}

// ──────────────────────────────────────────────────────────────
// Profil
// ──────────────────────────────────────────────────────────────

export async function getProfile() {
  return apiFetch('/get_profile.php');
}

export async function updateProfile(data) {
  return apiFetch('/update_profile.php', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function changePassword(currentPassword, newPassword) {
  const result = await apiFetch('/change_password.php', {
    method: 'POST',
    body: JSON.stringify({ current_password: currentPassword, new_password: newPassword }),
  });
  localStorage.setItem('vocab_pw_len', String(newPassword.length));
  return result;
}

// ──────────────────────────────────────────────────────────────
// Security / Sessions
// ──────────────────────────────────────────────────────────────

export async function getSessions() {
  return apiFetch('/get_sessions.php');
}

export async function revokeSession(sessionId) {
  return apiFetch('/revoke_session.php', {
    method: 'POST',
    body: JSON.stringify({ session_id: sessionId }),
  });
}

export async function logoutAll() {
  return apiFetch('/logout_all.php', { method: 'POST' });
}

export async function deleteAccount() {
  return apiFetch('/delete_account.php', { method: 'POST' });
}
