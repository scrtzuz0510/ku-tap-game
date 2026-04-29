'use strict';

/* ══════════════════════════════════════════════
   app.js — 진입점: 정적 이벤트 리스너 등록 + 게임 초기화
══════════════════════════════════════════════ */

window.addEventListener('DOMContentLoaded', () => {

  /* ── 탭 전환 ── */
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => game._switchTab(btn.dataset.tab));
  });

  /* ── 모달 닫기 버튼 ── */
  document.querySelectorAll('.modal-close').forEach(btn => {
    btn.addEventListener('click', () => game._closeModal(btn.dataset.modal));
  });

  /* ── 캐릭터 탭 ── */
  document.getElementById('ku').addEventListener('click', e => game.tap(e));

  /* ── 진화 버튼 ── */
  document.getElementById('btn-evolve').addEventListener('click', () => game.evolve());

  /* ── 전생 버튼 ── */
  document.getElementById('btn-reincarnate').addEventListener('click', () => {
    if (!game.state) return;
    game._openModal('modal-reincarnate');
    document.getElementById('modal-ri-bonus').textContent =
      `×${(1 + (game.state.reincarnations + 1) * 0.5).toFixed(1)}`;
  });
  document.getElementById('btn-ri-confirm').addEventListener('click', () => {
    game._closeModal('modal-reincarnate');
    game.reincarnate();
  });

  /* ── 일일 미션 버튼 ── */
  document.getElementById('btn-daily').addEventListener('click', () => {
    game._refreshDailyMissions();
    game._openModal('modal-daily');
    game._renderDailyMissions();
  });

  /* ── 성장 캡쳐 버튼 ── */
  document.getElementById('btn-capture').addEventListener('click', () => game.captureGrowth());

  /* ── 게임 초기화 ── */
  game.init();
});
