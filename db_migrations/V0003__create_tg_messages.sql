CREATE TABLE IF NOT EXISTS tg_messages (
  id SERIAL PRIMARY KEY,
  chat_id INTEGER,
  sender_id INTEGER,
  text TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);