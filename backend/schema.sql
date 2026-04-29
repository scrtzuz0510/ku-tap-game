-- 건덕이 탭게임 DB 스키마
-- 멱등 실행 가능 (반복 실행해도 안전)

CREATE TABLE IF NOT EXISTS users (
  id            SERIAL PRIMARY KEY,
  username      VARCHAR(20) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS game_saves (
  id           SERIAL PRIMARY KEY,
  user_id      INTEGER REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  profile_name VARCHAR(12) NOT NULL,
  save_data    JSONB NOT NULL DEFAULT '{}',
  updated_at   TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, profile_name)
);
