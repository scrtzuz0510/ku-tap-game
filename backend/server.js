'use strict';

require('dotenv').config();

// 필수 환경변수 누락 시 즉시 종료
const REQUIRED_ENV = ['DB_HOST', 'DB_USER', 'DB_PASSWORD', 'DB_NAME', 'JWT_SECRET', 'ALLOWED_ORIGIN'];
for (const key of REQUIRED_ENV) {
  if (!process.env[key]) {
    console.error(`FATAL: 환경변수 ${key}가 설정되지 않았습니다`);
    process.exit(1);
  }
}

const express = require('express');
const cors    = require('cors');
const { pool } = require('./db');

const app  = express();
const PORT = process.env.PORT || 3000;

app.use(cors({
  origin:      process.env.ALLOWED_ORIGIN,
  credentials: true,
}));
app.use(express.json({ limit: '1mb' }));

// ── 헬스체크 ──────────────────────────────────
app.get('/', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT NOW() AS time');
    res.json({ status: 'ok', db_time: rows[0].time });
  } catch (err) {
    console.error('Health check failed:', err.message);
    res.status(500).json({ status: 'error', message: 'DB connection failed' });
  }
});

// ── 라우트 ───────────────────────────────────
const authMiddleware = require('./middleware/auth');
app.use('/api/auth',  require('./routes/auth'));
app.use('/api/saves', authMiddleware, require('./routes/saves'));

// ── 404 ──────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
