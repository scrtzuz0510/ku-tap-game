'use strict';

const router  = require('express').Router();
const bcrypt  = require('bcryptjs');
const jwt     = require('jsonwebtoken');
const { pool } = require('../db');

const USERNAME_RE  = /^[a-zA-Z0-9가-힣]{2,20}$/;
const SALT_ROUNDS  = 10;
const TOKEN_EXPIRY = '7d';

function issueToken(userId, username) {
  return jwt.sign({ userId, username }, process.env.JWT_SECRET, { expiresIn: TOKEN_EXPIRY });
}

// 회원가입
router.post('/signup', async (req, res) => {
  const { username, password } = req.body ?? {};

  if (!username || !USERNAME_RE.test(username)) {
    return res.status(400).json({ error: '유저네임은 2~20자 영문/숫자/한글만 가능합니다' });
  }
  if (!password || password.length < 4) {
    return res.status(400).json({ error: '비밀번호는 4자 이상이어야 합니다' });
  }

  try {
    const hash = await bcrypt.hash(password, SALT_ROUNDS);
    const { rows } = await pool.query(
      'INSERT INTO users (username, password_hash) VALUES ($1, $2) RETURNING id, username',
      [username, hash]
    );
    res.status(201).json({ token: issueToken(rows[0].id, rows[0].username), username: rows[0].username });
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ error: '이미 사용 중인 유저네임입니다' });
    }
    console.error('Signup error:', err.message);
    res.status(500).json({ error: '서버 오류가 발생했습니다' });
  }
});

// 로그인
router.post('/login', async (req, res) => {
  const { username, password } = req.body ?? {};

  if (!username || !password) {
    return res.status(400).json({ error: '유저네임과 비밀번호를 입력해주세요' });
  }

  try {
    const { rows } = await pool.query(
      'SELECT id, username, password_hash FROM users WHERE username = $1',
      [username]
    );
    // 유저 없음과 비밀번호 틀림에 동일한 메시지(타이밍 어택 방지)
    const user = rows[0];
    const ok   = user ? await bcrypt.compare(password, user.password_hash) : false;
    if (!ok) {
      return res.status(401).json({ error: '유저네임 또는 비밀번호가 올바르지 않습니다' });
    }
    res.json({ token: issueToken(user.id, user.username), username: user.username });
  } catch (err) {
    console.error('Login error:', err.message);
    res.status(500).json({ error: '서버 오류가 발생했습니다' });
  }
});

module.exports = router;
