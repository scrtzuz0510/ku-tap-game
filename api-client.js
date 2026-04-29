'use strict';

/* ══════════════════════════════════════════════
   API Client - 백엔드 통신 + 인증 토큰 관리
══════════════════════════════════════════════ */

const API_BASE  = 'https://api.ddong-ku-be.shop';
const TOKEN_KEY = 'kuTapGame:token';
const USER_KEY  = 'kuTapGame:authUser';

const api = {
  getToken()   { return localStorage.getItem(TOKEN_KEY); },
  getUser()    { return localStorage.getItem(USER_KEY); },
  isLoggedIn() { return !!this.getToken(); },

  /* ── 내부 fetch 래퍼 ── */
  async _fetch(path, options = {}) {
    const token = this.getToken();
    const res = await fetch(API_BASE + path, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(options.headers ?? {}),
      },
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      const err  = new Error(body.error || '서버 오류가 발생했습니다');
      err.status = res.status;
      throw err;
    }
    return res.json();
  },

  /* ── 인증 ── */
  async signup(username, password) {
    const data = await this._fetch('/api/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
    localStorage.setItem(TOKEN_KEY, data.token);
    localStorage.setItem(USER_KEY,  data.username);
    return data;
  },

  async login(username, password) {
    const data = await this._fetch('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
    localStorage.setItem(TOKEN_KEY, data.token);
    localStorage.setItem(USER_KEY,  data.username);
    return data;
  },

  logout() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  },

  /* ── 세이브 CRUD ── */
  listSaves() {
    return this._fetch('/api/saves');
  },
  loadSave(profileName) {
    return this._fetch(`/api/saves/${encodeURIComponent(profileName)}`);
  },
  upsertSave(profileName, saveData) {
    return this._fetch(`/api/saves/${encodeURIComponent(profileName)}`, {
      method: 'POST',
      body: JSON.stringify({ save_data: saveData }),
    });
  },
  deleteSave(profileName) {
    return this._fetch(`/api/saves/${encodeURIComponent(profileName)}`, {
      method: 'DELETE',
    });
  },
};
