'use strict';

/* ══════════════════════════════════════════════
   game.js — 게임 코어 로직 (상태 관리 / 계산 / 저장)
   렌더링은 ui.js에서 Object.assign으로 주입
══════════════════════════════════════════════ */

const game = {
  state: null,
  _username: null,
  tickInterval: null,
  _localSaveInterval: null,
  _dbSaveInterval: null,
  _lastTickTime: 0,
  _tickCount: 0,
  _pendingAchievements: [],
  _showCapture: false,
  _captureShownFor: -1,

  /* ────────────────────────────────────────────
     초기화
  ──────────────────────────────────────────── */

  init() {
    if (api.isLoggedIn()) {
      this._username = api.getUser();
      this._startGame();
    } else {
      this._showAuthModal();
    }
  },

  /* ── 게임 시작 (로컬 → 즉시 표시, DB → 백그라운드 hydrate) ── */
  _startGame() {
    this.state = this._loadLocalState();

    // 오프라인 보상 계산 및 적용
    const offlineReward = this._calcOfflineReward();
    if (offlineReward > 0) {
      this.state.energy += offlineReward;
      this.state.totalEnergy += offlineReward;
      const hours = Math.floor((Date.now() - this.state.lastTickAt) / 3600000);
      document.getElementById('modal-offline-msg').innerHTML =
        `${hours}시간 동안 자동 수집기가 열심히 일했어요!<br><br>` +
        `<strong>+${this.formatNum(offlineReward)} 건덕이 에너지</strong>를 수령했습니다! 🎉`;
      this._openModal('modal-offline');
    }
    this.state.lastTickAt = Date.now();

    this._refreshDailyMissions();

    // 게임 화면 즉시 표시 (버그 1 수정: 빈 화면 방지)
    document.getElementById('modal-auth').classList.add('hidden');
    document.getElementById('app').classList.remove('hidden');

    // 게임 루프 시작
    this._lastTickTime = Date.now();
    this.tickInterval        = setInterval(() => this._tick(), TICK_MS);
    this._localSaveInterval  = setInterval(() => this._saveLocal(), LOCAL_SAVE_MS);
    this._dbSaveInterval     = setInterval(() => this._saveDB(), DB_SAVE_MS);
    window.addEventListener('beforeunload', () => this._saveAll());

    this._renderAll();
    this._updateShopTab();

    // DB에서 최신 데이터 백그라운드 로드
    this._hydrateFromDB();
  },

  /* ── DB hydration (백그라운드) ── */
  async _hydrateFromDB() {
    if (!api.isLoggedIn()) return;
    try {
      const row = await api.loadSave(this._username);
      if (!row?.save_data) return;

      const dbState  = row.save_data;
      const dbTotal  = dbState.totalEnergy  || 0;
      const locTotal = this.state.totalEnergy || 0;

      if (dbTotal > locTotal) {
        const def = createDefaultState(this._username);
        this.state = {
          ...def,
          ...dbState,
          upgrades:     { ...(dbState.upgrades     || {}) },
          collectors:   { ...(dbState.collectors   || {}) },
          achievements: { ...(dbState.achievements || {}) },
          lastTickAt: Date.now(),
        };
        this._refreshDailyMissions();
        this._renderAll();
        this._updateShopTab();
        this.showToast('☁️ 클라우드 데이터로 복원했습니다', 'success');
      }
      this._saveLocal();
    } catch (_) { /* 네트워크 오류 - 로컬 데이터로 계속 진행 */ }
  },

  /* ────────────────────────────────────────────
     인증
  ──────────────────────────────────────────── */

  _showAuthModal() {
    document.getElementById('modal-auth').classList.remove('hidden');

    const tabLogin  = document.getElementById('auth-tab-login');
    const tabSignup = document.getElementById('auth-tab-signup');
    const formLogin  = document.getElementById('auth-form-login');
    const formSignup = document.getElementById('auth-form-signup');

    tabLogin.onclick = () => {
      tabLogin.classList.add('active');   tabSignup.classList.remove('active');
      formLogin.classList.remove('hidden'); formSignup.classList.add('hidden');
      document.getElementById('auth-error-login').textContent = '';
    };
    tabSignup.onclick = () => {
      tabSignup.classList.add('active');  tabLogin.classList.remove('active');
      formSignup.classList.remove('hidden'); formLogin.classList.add('hidden');
      document.getElementById('auth-error-signup').textContent = '';
    };

    const setLoading = (btn, loading) => {
      btn.disabled = loading;
      btn.textContent = loading ? '처리 중...' : (btn.id === 'btn-auth-login' ? '로그인' : '회원가입');
    };

    document.getElementById('btn-auth-login').onclick = async () => {
      const btn      = document.getElementById('btn-auth-login');
      const username = document.getElementById('auth-username-login').value.trim();
      const password = document.getElementById('auth-password-login').value;
      const errEl    = document.getElementById('auth-error-login');
      errEl.textContent = '';
      if (!username || !password) { errEl.textContent = '유저네임과 비밀번호를 입력해주세요'; return; }
      setLoading(btn, true);
      try {
        await api.login(username, password);
        this._onAuthSuccess();
      } catch (err) {
        errEl.textContent = err.message;
      } finally {
        setLoading(btn, false);
      }
    };

    document.getElementById('btn-auth-signup').onclick = async () => {
      const btn   = document.getElementById('btn-auth-signup');
      const uname = document.getElementById('auth-username-signup').value.trim();
      const pw1   = document.getElementById('auth-password-signup').value;
      const pw2   = document.getElementById('auth-password-signup2').value;
      const errEl = document.getElementById('auth-error-signup');
      errEl.textContent = '';
      if (!uname || !pw1) { errEl.textContent = '모든 항목을 입력해주세요'; return; }
      if (pw1 !== pw2)    { errEl.textContent = '비밀번호가 일치하지 않습니다'; return; }
      setLoading(btn, true);
      try {
        await api.signup(uname, pw1);
        this._onAuthSuccess();
      } catch (err) {
        errEl.textContent = err.message;
      } finally {
        setLoading(btn, false);
      }
    };

    document.getElementById('auth-password-login').onkeydown = e => {
      if (e.key === 'Enter') document.getElementById('btn-auth-login').click();
    };
    document.getElementById('auth-password-signup2').onkeydown = e => {
      if (e.key === 'Enter') document.getElementById('btn-auth-signup').click();
    };
  },

  _onAuthSuccess() {
    this._username = api.getUser();
    this._startGame();
  },

  _onLogout() {
    if (!confirm('로그아웃 하시겠습니까?')) return;
    this._saveAll();
    api.logout();
    location.reload();
  },

  /* ────────────────────────────────────────────
     게임 루프
  ──────────────────────────────────────────── */

  _tick() {
    const now = Date.now();
    const dt  = (now - this._lastTickTime) / 1000;
    this._lastTickTime = now;
    const s = this.state;

    // 자동 수집
    const eps = this.getEPS();
    if (eps > 0) {
      const gained = eps * dt;
      s.energy      += gained;
      s.totalEnergy += gained;
      if (s.dailyProgress) {
        s.dailyProgress.earnEnergy = (s.dailyProgress.earnEnergy || 0) + gained;
      }
    }

    // 콤보 타이머
    if (s.combo > 0) {
      s.comboTimer += dt * 1000;
      if (s.comboTimer >= this._getComboWindow()) {
        s.combo = 0;
        s.comboTimer = 0;
      }
    }

    // 피버 타이머
    if (s.feverActive) {
      s.feverTimer -= dt * 1000;
      if (s.feverTimer <= 0) {
        s.feverActive  = false;
        s.feverTimer   = 0;
        s.feverCooldown = FEVER_COOLDOWN;
        this._onFeverEnd();
      }
    }
    if (s.feverCooldown > 0) {
      s.feverCooldown -= dt * 1000;
      if (s.feverCooldown < 0) s.feverCooldown = 0;
    }

    // 이벤트 타이머
    if (s.currentEvent && s.eventTimer > 0) {
      s.eventTimer -= dt * 1000;
      if (s.eventTimer <= 0) {
        s.currentEvent = null;
        s.eventTimer   = 0;
      }
    }

    // 랜덤 이벤트 발생
    if (!s.currentEvent && Math.random() < 0.0005) {
      this._triggerRandomEvent();
    }

    // 진화 체크
    const nextLvl = s.evolutionLevel + 1;
    if (nextLvl <= 30) {
      const required = Math.floor(getEvoRequired(nextLvl) * this._getGrowthReductionMult());
      s.canEvolve = s.totalEnergy >= required;
    } else {
      s.canEvolve = false;
    }

    this._checkAchievements();

    // 렌더링
    this._renderScoreArea();
    this._renderComboFever();
    this._renderEvoSection();
    this._renderEventBanner();

    this._tickCount++;
    if (this._tickCount % 10 === 0) {
      this._updateShopTab();
    }
  },

  /* ────────────────────────────────────────────
     탭
  ──────────────────────────────────────────── */

  tap(e) {
    if (!this.state) return;
    const s      = this.state;
    const tapPow = this.getTPS();
    s.energy      += tapPow;
    s.totalEnergy += tapPow;
    s.tapCount++;

    if (s.dailyProgress) {
      s.dailyProgress.tapCount = (s.dailyProgress.tapCount || 0) + 1;
    }

    // 콤보
    s.combo++;
    s.comboTimer = 0;
    if (s.combo > s.bestCombo) s.bestCombo = s.combo;

    const comboNum = document.getElementById('combo-num');
    comboNum.classList.remove('combo-low','combo-mid','combo-high','combo-max');
    if      (s.combo >= 25) comboNum.classList.add('combo-max');
    else if (s.combo >= 15) comboNum.classList.add('combo-high');
    else if (s.combo >= 5)  comboNum.classList.add('combo-mid');
    else                    comboNum.classList.add('combo-low');

    // 피버 체크
    if (!s.feverActive && s.feverCooldown <= 0 && s.combo >= FEVER_THRESHOLD) {
      this._activateFever();
    }

    // 캐릭터 바운스
    const ku = document.getElementById('ku');
    ku.classList.remove('bouncing', 'fever-bouncing');
    void ku.offsetWidth;
    ku.classList.add(s.feverActive ? 'fever-bouncing' : 'bouncing');

    // 파티클
    const rect      = ku.getBoundingClientRect();
    const layerRect = document.getElementById('particle-layer').getBoundingClientRect();
    this._spawnParticles(
      rect.left - layerRect.left + rect.width / 2,
      rect.top  - layerRect.top  + rect.height / 2,
      tapPow, s.feverActive, s.combo,
    );
  },

  /* ────────────────────────────────────────────
     피버
  ──────────────────────────────────────────── */

  _activateFever() {
    const s = this.state;
    s.feverActive = true;
    s.feverTimer  = FEVER_DURATION + (this._getUpgradeLevel('fever_duration') * 1000);
    s.feverCount++;
    if (s.dailyProgress) {
      s.dailyProgress.feverCount = (s.dailyProgress.feverCount || 0) + 1;
    }
    document.getElementById('fever-aura').classList.remove('hidden');
    document.getElementById('panel-tap').classList.add('fever-active');
    document.getElementById('combo-section').classList.add('fever-active');
    document.getElementById('combo-bar').classList.add('fever-active');
    this.showToast('🔥 FEVER MODE!', 'warning');
  },

  _onFeverEnd() {
    document.getElementById('fever-aura').classList.add('hidden');
    document.getElementById('panel-tap').classList.remove('fever-active');
    document.getElementById('combo-section').classList.remove('fever-active');
    document.getElementById('combo-bar').classList.remove('fever-active');
  },

  /* ────────────────────────────────────────────
     진화 / 전생
  ──────────────────────────────────────────── */

  evolve() {
    const s = this.state;
    if (!s.canEvolve || s.evolutionLevel >= 30) return;
    s.evolutionLevel++;
    s.canEvolve = false;
    this._showCapture    = true;
    this._captureShownFor = s.evolutionLevel;

    const evo = EVOLUTIONS[s.evolutionLevel - 1];
    this.showToast(`✨ ${evo.title}로 성장했어요!`, 'success');
    document.getElementById('ku').setAttribute('data-stage', s.evolutionLevel);
    document.getElementById('capture-section').classList.remove('hidden');
    document.getElementById('display-place').textContent = evo.place;

    this._saveAll();
    this._checkAchievements();
    this._renderEvoSection();
    this._renderCampusPanel();
    this._renderCollectors();
  },

  reincarnate() {
    const s = this.state;
    if (s.totalEnergy < 50000 && s.energy < 50000) {
      this.showToast('전생하려면 에너지가 50,000 이상 필요합니다', 'warning');
      return;
    }
    s.reincarnations++;
    s.permanentBonus = 1 + s.reincarnations * 0.5;
    Object.assign(s, {
      energy:0, totalEnergy:0, tapCount:0, combo:0, comboTimer:0, bestCombo:0,
      feverActive:false, feverTimer:0, feverCooldown:0, feverCount:0,
      evolutionLevel:1, canEvolve:false, upgrades:{}, collectors:{},
      currentEvent:null, eventTimer:0,
    });
    document.getElementById('ku').setAttribute('data-stage', 1);
    document.getElementById('capture-section').classList.add('hidden');
    this._onFeverEnd();
    this._saveAll();
    this._checkAchievements();
    this._renderAll();
    this.showToast(`♻️ 전생 완료! 영구 보너스 ×${s.permanentBonus.toFixed(1)}`, 'success');
  },

  /* ────────────────────────────────────────────
     상점
  ──────────────────────────────────────────── */

  buyUpgrade(id) {
    const s   = this.state;
    const upg = UPGRADES.find(u => u.id === id);
    if (!upg) return;
    const lvl = s.upgrades[id] || 0;
    if (lvl >= upg.maxLevel) { this.showToast('이미 최대 레벨입니다', 'warning'); return; }
    const cost = this._upgradeCost(upg, lvl);
    if (s.energy < cost) { this.showToast('에너지가 부족합니다', 'warning'); return; }
    s.energy -= cost;
    s.upgrades[id] = lvl + 1;
    if (s.dailyProgress) {
      s.dailyProgress.buyUpgrade = (s.dailyProgress.buyUpgrade || 0) + 1;
    }
    this.showToast(`⬆️ ${upg.name} Lv.${lvl+1}`, 'success');
    this._saveLocal();
    this._renderUpgrades();
    this._renderScoreArea();
    this._updateShopTab();
  },

  buyCollector(id) {
    const s   = this.state;
    const col = COLLECTORS.find(c => c.id === id);
    if (!col) return;
    if (s.evolutionLevel < col.unlockEvo) {
      this.showToast(`진화 ${col.unlockEvo}단계에서 해금됩니다`, 'warning'); return;
    }
    const cnt  = s.collectors[id] || 0;
    const cost = Math.floor(col.baseCost * Math.pow(col.costGrowth, cnt));
    if (s.energy < cost) { this.showToast('에너지가 부족합니다', 'warning'); return; }
    s.energy -= cost;
    s.collectors[id] = cnt + 1;
    if (s.dailyProgress) {
      s.dailyProgress.buyCollector = (s.dailyProgress.buyCollector || 0) + 1;
    }
    this.showToast(`🏗️ ${col.name} 추가!`, 'success');
    this._saveLocal();
    this._renderCollectors();
    this._renderScoreArea();
    this._checkAchievements();
  },

  /* ────────────────────────────────────────────
     계산 함수
  ──────────────────────────────────────────── */

  getTPS() {
    const s        = this.state;
    const baseTap  = 1 + this._getUpgradeLevel('tap_power');
    const comboMult = getComboMult(s.combo) + this._getUpgradeLevel('combo_amp') * 0.1;
    const feverMult = s.feverActive ? (FEVER_MULT + this._getUpgradeLevel('fever_mult') * 0.5) : 1;
    const eventTap  = s.currentEvent ? (RANDOM_EVENTS.find(e=>e.id===s.currentEvent)?.tapBonus || 1) : 1;
    const campBonus = this._getCampusBonus();
    const lucky     = this._getLuckyBonus();
    return Math.floor(baseTap * comboMult * feverMult * eventTap * s.permanentBonus * campBonus * lucky);
  },

  getEPS() {
    const s = this.state;
    if (!s) return 0;
    let total = 0;
    const autoMult = this._getUpgradeLevel('auto_collect') > 0
      ? UPGRADES.find(u=>u.id==='auto_collect').getValue(this._getUpgradeLevel('auto_collect')) : 1;
    const eventAuto = s.currentEvent
      ? (RANDOM_EVENTS.find(e=>e.id===s.currentEvent)?.autoBonus || 1) : 1;
    const campBonus = this._getCampusBonus();
    COLLECTORS.forEach(col => {
      const cnt = s.collectors[col.id] || 0;
      if (cnt > 0) total += col.baseProd * cnt;
    });
    return total * autoMult * eventAuto * s.permanentBonus * campBonus;
  },

  _getCampusBonus() {
    let bonus = 1.0;
    CAMPUS_LOCATIONS.forEach(loc => {
      if (this.state.evolutionLevel >= loc.unlockEvo) bonus = Math.max(bonus, loc.bonusMult);
    });
    return bonus;
  },

  _getLuckyBonus() {
    const lvl = this._getUpgradeLevel('lucky_badge');
    if (lvl === 0) return 1;
    const chance = UPGRADES.find(u=>u.id==='lucky_badge').getValue(lvl);
    return Math.random() < chance ? 5 : 1;
  },

  _getComboWindow() {
    return COMBO_WINDOW + this._getUpgradeLevel('combo_time') * 200;
  },

  _getGrowthReductionMult() {
    const lvl = this._getUpgradeLevel('growth_research');
    if (lvl === 0) return 1;
    return UPGRADES.find(u=>u.id==='growth_research').getValue(lvl);
  },

  _getUpgradeLevel(id) {
    return (this.state?.upgrades[id] || 0);
  },

  _upgradeCost(upg, currentLevel) {
    return Math.floor(upg.baseCost * Math.pow(upg.costGrowth, currentLevel));
  },

  /* ────────────────────────────────────────────
     업적
  ──────────────────────────────────────────── */

  _checkAchievements() {
    const s = this.state;
    if (!s) return;
    let newCount = 0;
    ACHIEVEMENTS.forEach(ach => {
      if (s.achievements[ach.id]) return;
      if (ach.cond(s)) {
        s.achievements[ach.id] = { unlocked: true, unlockedAt: Date.now() };
        if (ach.reward > 0) {
          s.energy      += ach.reward;
          s.totalEnergy += ach.reward;
        }
        this._pendingAchievements.push(ach);
        newCount++;
      }
    });
    if (newCount > 0) {
      this._flushAchievementToasts();
      this._renderAchievements();
      this._updateAchBadge();
      this._saveAll();
    }
  },

  _flushAchievementToasts() {
    this._pendingAchievements.forEach(ach => {
      this.showToast(`🏆 업적 달성: ${ach.name}\n${ach.rewardDesc}`, 'achievement');
    });
    this._pendingAchievements = [];
  },

  /* ────────────────────────────────────────────
     일일 미션
  ──────────────────────────────────────────── */

  _refreshDailyMissions() {
    const s = this.state;
    if (!s) return;
    const today = new Date().toDateString();
    if (s.dailyDate !== today) {
      const shuffled = [...DAILY_TEMPLATES].sort(() => Math.random() - 0.5);
      s.dailyMissions = shuffled.slice(0, 3).map(t => ({ ...t, done: false }));
      s.dailyDate     = today;
      s.dailyProgress = {};
    }
  },

  _checkDailyMissions() {
    const s = this.state;
    if (!s?.dailyMissions) return;
    let changed = false;
    s.dailyMissions.forEach(m => {
      if (m.done) return;
      const prog = s.dailyProgress[m.type] || 0;
      if (prog >= m.target) {
        m.done = true;
        s.energy      += m.reward;
        s.totalEnergy += m.reward;
        changed = true;
        this.showToast(`📋 미션 완료: ${m.name}\n+${this.formatNum(m.reward)} 에너지!`, 'success');
      }
    });
    if (changed) { this._saveLocal(); this._renderDailyMissions(); }
  },

  /* ────────────────────────────────────────────
     랜덤 이벤트
  ──────────────────────────────────────────── */

  _triggerRandomEvent() {
    const s  = this.state;
    const ev = RANDOM_EVENTS[Math.floor(Math.random() * RANDOM_EVENTS.length)];
    s.currentEvent = ev.id;
    s.eventTimer   = ev.duration * 1000;
    document.getElementById('event-modal-icon').textContent  = ev.icon;
    document.getElementById('event-modal-title').textContent = ev.name;
    document.getElementById('event-modal-desc').textContent  = ev.desc + ` (${ev.duration}초 동안)`;
    this._openModal('modal-event');
  },

  /* ────────────────────────────────────────────
     저장 / 불러오기
  ──────────────────────────────────────────── */

  _saveKey() {
    return `kuTapGame:save:${this._username}`;
  },

  _saveLocal() {
    if (!this.state || !this._username) return;
    const el = document.getElementById('save-indicator');
    if (el) { el.textContent = '저장 중'; el.className = 'save-ing'; }
    this.state.lastSavedAt = Date.now();
    this.state.lastTickAt  = Date.now();
    try {
      localStorage.setItem(this._saveKey(), JSON.stringify(this.state));
      setTimeout(() => {
        const el2 = document.getElementById('save-indicator');
        if (el2) { el2.textContent = '저장됨'; el2.className = 'save-ok'; }
      }, 300);
    } catch (_) {
      if (el) { el.textContent = '저장 실패'; el.className = 'save-err'; }
    }
  },

  async _saveDB() {
    if (!this.state || !api.isLoggedIn()) return;
    try {
      await api.upsertSave(this._username, this.state);
    } catch (err) {
      console.warn('DB save failed:', err.message);
    }
  },

  _saveAll() {
    this._saveLocal();
    this._saveDB();
  },

  _loadLocalState() {
    const username = this._username;
    try {
      const raw = localStorage.getItem(`kuTapGame:save:${username}`);
      if (raw) {
        const data = JSON.parse(raw);
        const def  = createDefaultState(username);
        return {
          ...def, ...data,
          upgrades:     { ...(data.upgrades     || {}) },
          collectors:   { ...(data.collectors   || {}) },
          achievements: { ...(data.achievements || {}) },
        };
      }
    } catch (_) {}
    return createDefaultState(username);
  },

  _calcOfflineReward() {
    const s   = this.state;
    const eps = this.getEPS();
    if (eps <= 0 || !s.lastTickAt) return 0;
    const maxH    = MAX_OFFLINE_H + this._getUpgradeLevel('offline_note') * 2;
    const elapsed = Math.min((Date.now() - s.lastTickAt) / 1000, maxH * 3600);
    if (elapsed < 10) return 0;
    return Math.floor(eps * elapsed * 0.5);
  },

  /* ────────────────────────────────────────────
     유틸
  ──────────────────────────────────────────── */

  formatNum(n, decimals = 0) {
    if (n === undefined || n === null) return '0';
    if (n >= 1e12) return (n / 1e12).toFixed(1) + 'T';
    if (n >= 1e9)  return (n / 1e9).toFixed(1)  + 'B';
    if (n >= 1e6)  return (n / 1e6).toFixed(1)  + 'M';
    if (n >= 1e4)  return (n / 1e3).toFixed(1)  + 'K';
    if (decimals > 0) return n.toFixed(decimals);
    return Math.floor(n).toLocaleString('ko-KR');
  },

  showToast(msg, type = '') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = msg;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 2600);
  },

  _openModal(id)  { document.getElementById(id).classList.remove('hidden'); },
  _closeModal(id) { document.getElementById(id).classList.add('hidden'); },
};
