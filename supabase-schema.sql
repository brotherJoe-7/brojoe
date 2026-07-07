-- ============================================================
-- BroJoe Platform - Supabase Schema
-- Run this entire script in the Supabase SQL Editor
-- (Dashboard → SQL Editor → New Query → Paste → Run)
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ── Users Table ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name          TEXT NOT NULL,
  email         TEXT NOT NULL UNIQUE,
  password      TEXT NOT NULL,
  role          TEXT NOT NULL DEFAULT 'user'
                CHECK (role IN ('user','mentor','admin','assistant','accountant')),
  account_type  TEXT DEFAULT 'individual'
                CHECK (account_type IN ('individual','boss','assistant')),
  mentor_email  TEXT DEFAULT '',
  avatar        TEXT DEFAULT '',
  total_budget  NUMERIC DEFAULT 0,
  mentor_budget NUMERIC DEFAULT 0,
  cal_link      TEXT DEFAULT '',
  gdpr_consent  BOOLEAN DEFAULT FALSE,
  gdpr_consent_date TIMESTAMPTZ,
  achievements  TEXT[] DEFAULT '{}',
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ── Expenses Table ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS expenses (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  description  TEXT NOT NULL,
  amount       NUMERIC NOT NULL,
  category     TEXT DEFAULT 'miscellaneous'
               CHECK (category IN ('transport','food','supplies','accommodation','communication','miscellaneous')),
  fund_source  TEXT DEFAULT 'personal'
               CHECK (fund_source IN ('personal','mentor')),
  date         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  notes        TEXT DEFAULT '',
  vendor       TEXT DEFAULT '',
  receipt_url  TEXT DEFAULT '',
  tags         TEXT[] DEFAULT '{}',
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

-- ── Tasks Table ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tasks (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  assigned_by     UUID REFERENCES users(id),
  title           TEXT NOT NULL,
  description     TEXT DEFAULT '',
  status          TEXT DEFAULT 'pending'
                  CHECK (status IN ('pending','in-progress','completed','cancelled')),
  priority        TEXT DEFAULT 'medium'
                  CHECK (priority IN ('low','medium','high','urgent')),
  due_date        TIMESTAMPTZ,
  sub_tasks       JSONB DEFAULT '[]',
  completion_note TEXT DEFAULT '',
  is_mentor_task  BOOLEAN DEFAULT FALSE,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ── Reports Table ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS reports (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title       TEXT NOT NULL,
  type        TEXT DEFAULT 'daily'
              CHECK (type IN ('daily','weekly','custom','monthly')),
  date_range  JSONB DEFAULT '{}',
  summary     TEXT DEFAULT '',
  ai_insights TEXT DEFAULT '',
  share_token TEXT DEFAULT '',
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ── Calendar Events Table ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS cal_events (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title       TEXT NOT NULL,
  description TEXT DEFAULT '',
  date        TIMESTAMPTZ NOT NULL,
  start_time  TEXT DEFAULT '',
  end_time    TEXT DEFAULT '',
  type        TEXT DEFAULT 'personal'
              CHECK (type IN ('errand','meeting','mentor-session','personal','deadline','booking')),
  color       TEXT DEFAULT '#d97757',
  all_day     BOOLEAN DEFAULT FALSE,
  recurring   TEXT DEFAULT 'none'
              CHECK (recurring IN ('none','daily','weekly','monthly')),
  location    TEXT DEFAULT '',
  status      TEXT DEFAULT 'confirmed'
              CHECK (status IN ('confirmed','pending','cancelled')),
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ── Indexes for performance ───────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_expenses_user_id ON expenses(user_id);
CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(date DESC);
CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_reports_user_id ON reports(user_id);
CREATE INDEX IF NOT EXISTS idx_cal_events_user_id ON cal_events(user_id);
CREATE INDEX IF NOT EXISTS idx_cal_events_date ON cal_events(date);

-- ── Row Level Security (RLS) ──────────────────────────────────
-- NOTE: We use the service role key in API routes, so RLS is
-- bypassed server-side. This is still good practice to have.
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE cal_events ENABLE ROW LEVEL SECURITY;

-- ── Done! ─────────────────────────────────────────────────────
-- Your BroJoe Platform database is now ready.
-- Next steps:
-- 1. Copy your Project URL and Anon Key from Supabase Dashboard → Settings → API
-- 2. Copy your Service Role Key from the same page
-- 3. Paste them into your .env.local file
