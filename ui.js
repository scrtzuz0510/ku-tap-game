'use strict';

/* ══════════════════════════════════════════════
   ui.js — 렌더링 / DOM 조작
   game.js의 game 객체에 메서드를 추가
══════════════════════════════════════════════ */

Object.assign(game, {

  /* ────────────────────────────────────────────
     전체 렌더링
  ──────────────────────────────────────────── */

  _renderAll() {
    const s = this.state;
    this._renderScoreArea();
    this._renderEvoSection();
    this._renderComboFever();
    this._renderUpgrades();
    this._renderCollectors();
    this._renderCampusPanel();
    this._renderAchievements();
    this._renderProfilePanel();
    this._renderEventBanner();
    this._updateAchBadge();
    this._updateShopTab();

    document.getElementById('display-username').textContent = '@' + this._username;
    document.getElementById('display-place').textContent    = EVOLUTIONS[s.evolutionLevel - 1]?.place || '건국대학교';
    document.getElementById('ku').setAttribute('data-stage', s.evolutionLevel);

    if (s.feverActive) {
      document.getElementById('fever-aura').classList.remove('hidden');
      document.getElementById('panel-tap').classList.add('fever-active');
    }
  },

  /* ────────────────────────────────────────────
     점수 영역
  ──────────────────────────────────────────── */

  _renderScoreArea() {
    const s = this.state;
    if (!s) return;
    document.getElementById('energy-num').textContent = this.formatNum(Math.floor(s.energy));
    document.getElementById('stat-total').textContent = this.formatNum(Math.floor(s.totalEnergy));
    document.getElementById('stat-eps').textContent   = this.formatNum(this.getEPS(), 1);
    document.getElementById('stat-tps').textContent   = this.formatNum(this.getTPS());
    this._checkDailyMissions();
  },

  /* ────────────────────────────────────────────
     진화 섹션
  ──────────────────────────────────────────── */

  _renderEvoSection() {
    const s = this.state;
    if (!s) return;
    const evo = EVOLUTIONS[s.evolutionLevel - 1];
    document.getElementById('evo-stage-badge').textContent = `Lv.${s.evolutionLevel}`;
    document.getElementById('evo-title-text').textContent  = evo.title;

    const btn = document.getElementById('btn-evolve');
    if (s.evolutionLevel >= 30) {
      btn.classList.add('hidden');
      document.getElementById('evo-bar').style.width     = '100%';
      document.getElementById('evo-bar-label').textContent = '최대 단계 달성!';
    } else {
      const nextLvl  = s.evolutionLevel + 1;
      const required = Math.floor(getEvoRequired(nextLvl) * this._getGrowthReductionMult());
      const pct      = Math.min((s.totalEnergy / required) * 100, 100);
      document.getElementById('evo-bar').style.width     = pct.toFixed(1) + '%';
      document.getElementById('evo-bar-label').textContent =
        `${this.formatNum(Math.floor(s.totalEnergy))} / ${this.formatNum(required)}`;
      btn.classList.toggle('hidden', !s.canEvolve);
    }
  },

  /* ────────────────────────────────────────────
     콤보 / 피버
  ──────────────────────────────────────────── */

  _renderComboFever() {
    const s = this.state;
    if (!s) return;
    document.getElementById('combo-num').textContent = s.combo;
    const mult      = getComboMult(s.combo) + this._getUpgradeLevel('combo_amp') * 0.1;
    const multBadge = document.getElementById('combo-mult-badge');
    multBadge.textContent = mult > 1 ? `×${mult.toFixed(1)}` : '';

    const window = this._getComboWindow();
    const pct    = s.combo > 0 ? Math.max(0, 100 - (s.comboTimer / window * 100)) : 0;
    document.getElementById('combo-bar').style.width = pct + '%';

    const feverInd = document.getElementById('fever-indicator');
    if (s.feverActive) {
      feverInd.classList.remove('hidden');
      document.getElementById('fever-time').textContent = `${(s.feverTimer / 1000).toFixed(1)}s`;
    } else {
      feverInd.classList.add('hidden');
    }
  },

  /* ────────────────────────────────────────────
     이벤트 배너
  ──────────────────────────────────────────── */

  _renderEventBanner() {
    const s      = this.state;
    const banner = document.getElementById('event-banner');
    if (s?.currentEvent && s.eventTimer > 0) {
      const ev = RANDOM_EVENTS.find(e => e.id === s.currentEvent);
      if (ev) {
        banner.classList.remove('hidden');
        document.getElementById('event-text').textContent  = `${ev.icon} ${ev.name}`;
        document.getElementById('event-timer').textContent = `${Math.ceil(s.eventTimer / 1000)}초`;
        return;
      }
    }
    banner.classList.add('hidden');
  },

  /* ────────────────────────────────────────────
     업그레이드 목록
  ──────────────────────────────────────────── */

  _renderUpgrades() {
    const s  = this.state;
    if (!s) return;
    const el = document.getElementById('upgrades-list');
    el.innerHTML = '';
    UPGRADES.forEach(upg => {
      const lvl      = s.upgrades[upg.id] || 0;
      const cost     = this._upgradeCost(upg, lvl);
      const maxed    = lvl >= upg.maxLevel;
      const canAfford = s.energy >= cost;

      const card = document.createElement('div');
      card.className = 'upgrade-card';
      card.innerHTML = `
        <div class="card-icon">${upg.icon}</div>
        <div class="card-info">
          <div class="card-name">${upg.name}</div>
          <div class="card-level">Lv.${lvl} / ${upg.maxLevel}</div>
          <div class="card-desc">${upg.effect(lvl)}</div>
          ${lvl < upg.maxLevel ? `<div class="card-desc" style="color:var(--ku-green)">다음: ${upg.effect(lvl+1)}</div>` : ''}
        </div>
        <div class="card-buy-col">
          <button class="btn-buy" ${maxed || !canAfford ? 'disabled' : ''} data-id="${upg.id}">
            ${maxed ? 'MAX' : '⚡' + this.formatNum(cost)}
          </button>
        </div>
      `;
      card.querySelector('.btn-buy').addEventListener('click', () => this.buyUpgrade(upg.id));
      el.appendChild(card);
    });
  },

  /* ────────────────────────────────────────────
     자동 수집기 목록
  ──────────────────────────────────────────── */

  _renderCollectors() {
    const s  = this.state;
    if (!s) return;
    const el = document.getElementById('collectors-list');
    el.innerHTML = '';
    COLLECTORS.forEach(col => {
      const cnt      = s.collectors[col.id] || 0;
      const cost     = Math.floor(col.baseCost * Math.pow(col.costGrowth, cnt));
      const locked   = s.evolutionLevel < col.unlockEvo;
      const canAfford = !locked && s.energy >= cost;

      const card = document.createElement('div');
      card.className = `collector-card${locked ? ' locked' : ''}`;
      card.innerHTML = `
        <div class="card-icon">${col.icon}</div>
        <div class="card-info">
          <div class="card-name">${col.name}</div>
          <div class="card-level">보유 ${cnt}개 · 초당 ${this.formatNum(col.baseProd * Math.max(cnt, 1), 1)}</div>
          <div class="card-desc">${col.desc}</div>
          ${locked ? `<div class="card-lock-msg">🔒 진화 ${col.unlockEvo}단계 달성 시 해금</div>` : ''}
        </div>
        <div class="card-buy-col">
          ${locked ? '' : `<button class="btn-buy" ${!canAfford ? 'disabled' : ''} data-id="${col.id}">⚡${this.formatNum(cost)}</button>`}
          <div class="card-count">${cnt > 0 ? `×${cnt}` : ''}</div>
        </div>
      `;
      if (!locked) {
        card.querySelector('.btn-buy')?.addEventListener('click', () => this.buyCollector(col.id));
      }
      el.appendChild(card);
    });
  },

  /* ────────────────────────────────────────────
     캠퍼스 패널
  ──────────────────────────────────────────── */

  _renderCampusPanel() {
    const s  = this.state;
    if (!s) return;
    const el = document.getElementById('campus-list');
    el.innerHTML = '';
    CAMPUS_LOCATIONS.forEach(loc => {
      const unlocked = s.evolutionLevel >= loc.unlockEvo;
      const current  = EVOLUTIONS[s.evolutionLevel - 1]?.place === loc.name;
      const card = document.createElement('div');
      card.className = `campus-card${!unlocked ? ' locked' : ''}${current ? ' current' : ''}`;
      card.innerHTML = `
        <div class="campus-icon">${loc.icon}</div>
        <div class="campus-info">
          <div class="campus-name">${loc.name}</div>
          <div class="campus-desc">${unlocked ? loc.desc : `진화 ${loc.unlockEvo}단계에서 해금됩니다`}</div>
          ${unlocked ? `<div class="campus-bonus">🌟 ${loc.bonus}</div>` : ''}
        </div>
        ${current
          ? '<span class="campus-badge">현재</span>'
          : unlocked
            ? '<span class="campus-badge" style="background:var(--ku-gray3)">해금</span>'
            : '<span class="campus-badge locked-badge">🔒</span>'}
      `;
      el.appendChild(card);
    });

    document.getElementById('ri-count').textContent     = `${s.reincarnations}회`;
    document.getElementById('ri-bonus').textContent     = `×${s.permanentBonus.toFixed(1)}`;
    document.getElementById('ri-next-bonus').textContent = `×${(1 + (s.reincarnations + 1) * 0.5).toFixed(1)}`;
    const canRI = s.totalEnergy >= 50000 || s.energy >= 50000;
    document.getElementById('btn-reincarnate').disabled = !canRI;
    document.getElementById('ri-req-text').textContent  = canRI
      ? '전생 조건을 달성했습니다!'
      : `전생하려면 누적 에너지 50,000이 필요합니다 (현재: ${this.formatNum(Math.floor(s.totalEnergy))})`;
  },

  /* ────────────────────────────────────────────
     업적 패널
  ──────────────────────────────────────────── */

  _renderAchievements() {
    const s     = this.state;
    if (!s) return;
    const done  = ACHIEVEMENTS.filter(a => s.achievements[a.id]);
    const total = ACHIEVEMENTS.length;

    document.getElementById('ach-summary').innerHTML =
      `<span>달성 ${done.length} / ${total}</span>` +
      `<div style="flex:1;height:6px;background:var(--ku-gray2);border-radius:3px;overflow:hidden">` +
      `<div style="width:${(done.length/total*100).toFixed(0)}%;height:100%;background:var(--ku-green-mid)"></div></div>`;

    const el = document.getElementById('achievements-list');
    el.innerHTML = '';
    ACHIEVEMENTS.forEach(ach => {
      const achData = s.achievements[ach.id];
      const isDone  = !!achData;
      const card = document.createElement('div');
      card.className = `ach-card${isDone ? ' done' : ''}`;
      const date = isDone ? new Date(achData.unlockedAt).toLocaleDateString('ko-KR') : '';
      card.innerHTML = `
        <div class="ach-icon">${ach.icon}</div>
        <div class="ach-info">
          <div class="ach-name">${ach.name}</div>
          <div class="ach-desc">${ach.desc}</div>
          <div class="ach-reward">보상: ${ach.rewardDesc}</div>
          ${isDone ? `<span class="ach-date">${date} 달성</span>` : ''}
        </div>
        <div class="ach-status">${isDone ? '✅' : '⬜'}</div>
      `;
      el.appendChild(card);
    });
  },

  /* ────────────────────────────────────────────
     프로필 패널 (계정 정보 + 통계만)
     Bug 2 수정: onclick 속성 사용으로 이벤트 중복 방지
  ──────────────────────────────────────────── */

  _renderProfilePanel() {
    const accountEl = document.getElementById('auth-account-info');
    if (api.isLoggedIn()) {
      accountEl.innerHTML = `
        <div class="auth-account-row">
          <div>
            <div class="auth-account-name">@${api.getUser()}</div>
            <div class="auth-account-label">로그인된 계정</div>
          </div>
          <button class="btn-logout" onclick="game._onLogout()">로그아웃</button>
        </div>`;
    } else {
      accountEl.innerHTML = '';
    }

    const s = this.state;
    if (s) {
      document.getElementById('profile-stats').innerHTML = `
        <div class="stat-row"><span>탭 횟수</span><span>${this.formatNum(s.tapCount)}회</span></div>
        <div class="stat-row"><span>최고 콤보</span><span>${s.bestCombo}콤보</span></div>
        <div class="stat-row"><span>피버 횟수</span><span>${s.feverCount}회</span></div>
        <div class="stat-row"><span>진화 단계</span><span>Lv.${s.evolutionLevel}</span></div>
        <div class="stat-row"><span>전생 횟수</span><span>${s.reincarnations}회</span></div>
        <div class="stat-row"><span>영구 보너스</span><span>×${s.permanentBonus.toFixed(1)}</span></div>
        <div class="stat-row"><span>누적 에너지</span><span>${this.formatNum(Math.floor(s.totalEnergy))}</span></div>
        <div class="stat-row"><span>초당 자동 수집</span><span>${this.formatNum(this.getEPS(), 1)}/s</span></div>
      `;
    }
  },

  /* ────────────────────────────────────────────
     일일 미션 목록
  ──────────────────────────────────────────── */

  _renderDailyMissions() {
    const s = this.state;
    if (!s?.dailyMissions) return;
    const el = document.getElementById('daily-missions-list');
    el.innerHTML = '';
    s.dailyMissions.forEach(m => {
      const prog = Math.min(s.dailyProgress?.[m.type] || 0, m.target);
      const pct  = (prog / m.target * 100).toFixed(0);
      const item = document.createElement('div');
      item.className = `daily-mission-item${m.done ? ' dm-done' : ''}`;
      item.innerHTML = `
        <div class="dm-check">${m.done ? '✅' : '⬜'}</div>
        <div class="dm-info">
          <div class="dm-name">${m.name}</div>
          <div class="dm-progress">${m.desc} (${Math.floor(prog)} / ${m.target})</div>
          <div class="dm-bar-wrap"><div class="dm-bar" style="width:${pct}%"></div></div>
        </div>
        <div class="dm-reward">+${this.formatNum(m.reward)}⚡</div>
      `;
      el.appendChild(item);
    });
  },

  /* ────────────────────────────────────────────
     탭 전환
  ──────────────────────────────────────────── */

  _switchTab(tabName) {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelector(`.tab-btn[data-tab="${tabName}"]`).classList.add('active');
    document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
    document.getElementById(`panel-${tabName}`).classList.add('active');

    if (tabName === 'shop')         { this._renderUpgrades(); this._renderCollectors(); }
    if (tabName === 'campus')         this._renderCampusPanel();
    if (tabName === 'achievements')   this._renderAchievements();
    if (tabName === 'profile')        this._renderProfilePanel();
  },

  /* ────────────────────────────────────────────
     배지 업데이트
  ──────────────────────────────────────────── */

  _updateShopTab() {
    const s = this.state;
    if (!s) return;
    let count = 0;
    UPGRADES.forEach(upg => {
      const lvl = s.upgrades[upg.id] || 0;
      if (lvl < upg.maxLevel && s.energy >= this._upgradeCost(upg, lvl)) count++;
    });
    COLLECTORS.forEach(col => {
      if (s.evolutionLevel < col.unlockEvo) return;
      const cnt  = s.collectors[col.id] || 0;
      const cost = Math.floor(col.baseCost * Math.pow(col.costGrowth, cnt));
      if (s.energy >= cost) count++;
    });
    const badge = document.getElementById('shop-badge');
    if (count > 0) { badge.textContent = count; badge.classList.remove('hidden'); }
    else             badge.classList.add('hidden');
  },

  _updateAchBadge() {
    document.getElementById('ach-badge').classList.add('hidden');
  },

  /* ────────────────────────────────────────────
     파티클
  ──────────────────────────────────────────── */

  _spawnParticles(cx, cy, value, isFever, combo) {
    const layer = document.getElementById('particle-layer');
    const rect  = layer.getBoundingClientRect();

    const pop = document.createElement('div');
    pop.className = 'particle';
    const col = isFever ? '#ff6600' : combo >= 25 ? '#e00' : combo >= 10 ? '#f5a623' : 'var(--ku-green)';
    const sz  = isFever ? 20 : combo >= 15 ? 16 : 14;
    pop.style.cssText = `left:${cx - rect.left + (Math.random()-0.5)*30}px;top:${cy - rect.top - 20}px;color:${col};font-size:${sz}px;`;
    pop.textContent = `+${this.formatNum(value)}`;
    layer.appendChild(pop);
    setTimeout(() => pop.remove(), 900);

    const colors = isFever
      ? ['#ff6600','#ffaa00','#ff3300']
      : ['var(--ku-green-light)','var(--ku-yellow)','var(--ku-sky)','var(--ku-pink)'];
    const dotCount = isFever ? 8 : 4;
    for (let i = 0; i < dotCount; i++) {
      const dot   = document.createElement('div');
      dot.className = 'particle-dot';
      const angle = (i / dotCount) * Math.PI * 2;
      const dist  = 30 + Math.random() * 30;
      dot.style.cssText = `left:${cx - rect.left}px;top:${cy - rect.top}px;background:${colors[i % colors.length]};--tx:${Math.cos(angle)*dist}px;--ty:${Math.sin(angle)*dist}px;`;
      layer.appendChild(dot);
      setTimeout(() => dot.remove(), 700);
    }
  },

  /* ────────────────────────────────────────────
     성장 캡쳐
  ──────────────────────────────────────────── */

  captureGrowth() {
    const s      = this.state;
    const canvas = document.getElementById('capture-canvas');
    const ctx    = canvas.getContext('2d');
    canvas.width  = 400;
    canvas.height = 500;

    const bg = ctx.createLinearGradient(0, 0, 400, 500);
    bg.addColorStop(0, '#e8f7ee');
    bg.addColorStop(1, '#d0eedd');
    ctx.fillStyle = bg;
    ctx.beginPath(); ctx.roundRect(0, 0, 400, 500, 24); ctx.fill();

    ctx.fillStyle = '#1b8a4a';
    ctx.beginPath(); ctx.roundRect(0, 0, 400, 80, [24, 24, 0, 0]); ctx.fill();

    ctx.fillStyle = 'white';
    ctx.font = 'bold 28px Pretendard, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('건덕이 탭게임 ver2', 200, 38);
    ctx.font = '16px Pretendard, sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.8)';
    ctx.fillText('건국대학교 마스코트 건덕이', 200, 62);

    const stageEmojis = ['🐣','🐥','📚','🎓','🎸','🌊','📣','📝','⚙️','🧪','🎨','💼','⚖️','🔬','🎪','🎆','🤝','😰','🌙','🏅','🔭','💡','🌍','👑','📜','🦸','⭐','🏆','🛡️','✨'];
    ctx.font = '80px serif';
    ctx.fillStyle = 'black';
    ctx.fillText(stageEmojis[(s.evolutionLevel - 1) % stageEmojis.length], 200, 200);

    ctx.fillStyle = '#1b8a4a';
    ctx.font = 'bold 32px Pretendard, sans-serif';
    ctx.fillText(`Lv.${s.evolutionLevel}`, 200, 260);

    ctx.fillStyle = '#333';
    ctx.font = 'bold 22px Pretendard, sans-serif';
    const evo = EVOLUTIONS[s.evolutionLevel - 1];
    ctx.fillText(evo.title, 200, 295);

    ctx.strokeStyle = '#c0ddc8'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(40, 315); ctx.lineTo(360, 315); ctx.stroke();

    ctx.fillStyle = '#555';
    ctx.font = '14px Pretendard, sans-serif';
    this._wrapText(ctx, evo.story, 320).forEach((line, i) => ctx.fillText(line, 200, 340 + i * 22));

    ctx.fillStyle = '#888';
    ctx.font = '13px Pretendard, sans-serif';
    ctx.fillText(`@${this._username} · 누적 ${this.formatNum(Math.floor(s.totalEnergy))} 에너지`, 200, 440);
    ctx.fillText(new Date().toLocaleDateString('ko-KR', { year:'numeric', month:'long', day:'numeric' }), 200, 462);

    ctx.fillStyle = '#1b8a4a';
    ctx.font = 'bold 13px Pretendard, sans-serif';
    ctx.fillText('🏫 건국대학교 마스코트 건덕이와 함께', 200, 487);

    const link = document.createElement('a');
    link.download = `ku-growth-lv${String(s.evolutionLevel).padStart(2,'0')}-${this._username}.png`;
    link.href     = canvas.toDataURL('image/png');
    link.click();
    this.showToast('📸 성장 기념 사진이 저장되었습니다!', 'success');
  },

  _wrapText(ctx, text, maxWidth) {
    const lines = [];
    let line = '';
    for (const char of text) {
      const test = line + char;
      if (ctx.measureText(test).width > maxWidth && line) {
        lines.push(line); line = char;
      } else {
        line = test;
      }
    }
    if (line) lines.push(line);
    return lines;
  },
});
