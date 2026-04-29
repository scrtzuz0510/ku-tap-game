'use strict';

const router   = require('express').Router();
const { pool } = require('../db');

function validateProfileName(name) {
  return typeof name === 'string' && name.length >= 2 && name.length <= 12;
}

// 내 프로필 목록 조회
router.get('/', async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT profile_name, updated_at FROM game_saves WHERE user_id = $1 ORDER BY updated_at DESC',
      [req.user.userId]
    );
    res.json(rows);
  } catch (err) {
    console.error('List saves error:', err.message);
    res.status(500).json({ error: '서버 오류가 발생했습니다' });
  }
});

// 특정 프로필 세이브 불러오기
router.get('/:profileName', async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT profile_name, save_data, updated_at FROM game_saves WHERE user_id = $1 AND profile_name = $2',
      [req.user.userId, req.params.profileName]
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: '세이브 데이터가 없습니다' });
    }
    res.json(rows[0]);
  } catch (err) {
    console.error('Load save error:', err.message);
    res.status(500).json({ error: '서버 오류가 발생했습니다' });
  }
});

// 세이브 저장(upsert)
router.post('/:profileName', async (req, res) => {
  const { profileName } = req.params;
  const { save_data }   = req.body ?? {};

  if (!validateProfileName(profileName)) {
    return res.status(400).json({ error: '프로필 이름은 2~12자여야 합니다' });
  }
  if (!save_data || typeof save_data !== 'object' || Array.isArray(save_data)) {
    return res.status(400).json({ error: '유효하지 않은 세이브 데이터입니다' });
  }

  try {
    await pool.query(
      `INSERT INTO game_saves (user_id, profile_name, save_data, updated_at)
       VALUES ($1, $2, $3, NOW())
       ON CONFLICT (user_id, profile_name)
       DO UPDATE SET save_data = $3, updated_at = NOW()`,
      [req.user.userId, profileName, save_data]
    );
    res.json({ ok: true });
  } catch (err) {
    console.error('Save error:', err.message);
    res.status(500).json({ error: '서버 오류가 발생했습니다' });
  }
});

// 프로필 삭제
router.delete('/:profileName', async (req, res) => {
  try {
    const result = await pool.query(
      'DELETE FROM game_saves WHERE user_id = $1 AND profile_name = $2',
      [req.user.userId, req.params.profileName]
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ error: '세이브 데이터가 없습니다' });
    }
    res.json({ ok: true });
  } catch (err) {
    console.error('Delete save error:', err.message);
    res.status(500).json({ error: '서버 오류가 발생했습니다' });
  }
});

module.exports = router;
