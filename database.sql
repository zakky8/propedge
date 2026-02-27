-- ─────────────────────────────────────────────
-- PropEdge Database Schema
-- Run this in Supabase SQL Editor
-- https://app.supabase.com → SQL Editor → New Query
-- ─────────────────────────────────────────────

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─────────────────────────────────────────────
-- F3: RULE ACKNOWLEDGEMENT SYSTEM
-- ─────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS rules (
  id            UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  platform      TEXT NOT NULL DEFAULT 'fundingpips',
  title         TEXT NOT NULL,
  description   TEXT,
  category      TEXT NOT NULL DEFAULT 'general',  -- 'consistency', 'daily_loss', 'news', 'general'
  severity      TEXT NOT NULL DEFAULT 'medium',   -- 'low', 'medium', 'high', 'critical'
  effective_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  is_active     BOOLEAN NOT NULL DEFAULT TRUE,
  version       INTEGER NOT NULL DEFAULT 1,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS rule_acknowledgements (
  id              UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  trader_id       TEXT NOT NULL,
  rule_id         UUID NOT NULL REFERENCES rules(id),
  platform        TEXT NOT NULL DEFAULT 'fundingpips',
  account_id      TEXT,
  acknowledged_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ip_address      TEXT,
  user_agent      TEXT,
  UNIQUE (trader_id, rule_id)
);

CREATE INDEX IF NOT EXISTS idx_acks_trader ON rule_acknowledgements(trader_id);
CREATE INDEX IF NOT EXISTS idx_acks_rule ON rule_acknowledgements(rule_id);
CREATE INDEX IF NOT EXISTS idx_rules_platform_active ON rules(platform, is_active);

-- ─────────────────────────────────────────────
-- AUDIT LOG
-- ─────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS audit_log (
  id         UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  event      TEXT NOT NULL,
  trader_id  TEXT,
  rule_id    UUID,
  metadata   JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_trader ON audit_log(trader_id);
CREATE INDEX IF NOT EXISTS idx_audit_event ON audit_log(event);

-- ─────────────────────────────────────────────
-- REPORTS
-- ─────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS report_jobs (
  id           UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  type         TEXT NOT NULL,  -- 'performance', 'consistency', 'cost_analysis'
  trader_id    TEXT NOT NULL,
  account_id   TEXT,
  date_range   JSONB,          -- { from: '2024-01-01', to: '2024-01-31' }
  format       TEXT NOT NULL DEFAULT 'pdf',  -- 'pdf', 'xlsx', 'pptx', 'docx'
  status       TEXT NOT NULL DEFAULT 'queued',  -- 'queued', 'processing', 'done', 'error'
  download_url TEXT,
  error_message TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_reports_trader ON report_jobs(trader_id);
CREATE INDEX IF NOT EXISTS idx_reports_status ON report_jobs(status);

-- ─────────────────────────────────────────────
-- COMMUNITY LEADERBOARD
-- ─────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS leaderboard (
  id            UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  trader_id     TEXT NOT NULL,
  display_name  TEXT NOT NULL,
  platform      TEXT NOT NULL DEFAULT 'fundingpips',
  period        TEXT NOT NULL,  -- 'weekly', 'monthly', 'all-time'
  return_pct    DECIMAL(10,4) NOT NULL DEFAULT 0,
  win_rate      DECIMAL(5,2),
  profit_factor DECIMAL(10,2),
  badge         TEXT,           -- 'top10', 'consistent', 'risk-master'
  account_type  TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_leaderboard_period ON leaderboard(period, return_pct DESC);

-- ─────────────────────────────────────────────
-- SEED DATA: Sample FundingPips Rules
-- ─────────────────────────────────────────────

INSERT INTO rules (title, description, category, severity, effective_date, platform) VALUES
(
  'Consistency Rule — Zero Account (15% Cap)',
  'No single trading day may account for more than 15% of total net profit when requesting a payout on a Zero account. Formula: maxToday = (0.15 × totalProfit) / (1 - 0.15) - max(todayPnL, 0)',
  'consistency',
  'critical',
  NOW(),
  'fundingpips'
),
(
  'Consistency Rule — On-Demand Payout (35% Cap)',
  'For On-Demand payouts, no single day may exceed 35% of total profit. Applies at payout time, not during trading.',
  'consistency',
  'high',
  NOW(),
  'fundingpips'
),
(
  'Consistency Rule — Pro Account (45% Cap)',
  'Pro accounts have a 45% consistency cap per trading day at payout.',
  'consistency',
  'high',
  NOW(),
  'fundingpips'
),
(
  'Daily Loss Limit — 2-Step Standard (5%)',
  'Maximum daily loss is 5% of account balance. Includes open floating losses. Account balance may not drop more than 5% below the starting day balance.',
  'daily_loss',
  'critical',
  NOW(),
  'fundingpips'
),
(
  'Daily Loss Limit — 2-Step Pro & Zero (3%)',
  'Maximum daily loss is 3% of account balance for 2-Step Pro and Zero account types. Tighter limit requires stricter risk management.',
  'daily_loss',
  'critical',
  NOW(),
  'fundingpips'
),
(
  'High-Impact News Trading Restriction',
  'Trading is prohibited from 2 minutes before to 2 minutes after high-impact news events (NFP, FOMC, CPI, etc.). Positions opened within this window may be closed at market and count as violations.',
  'news',
  'high',
  NOW(),
  'fundingpips'
),
(
  'Silver (XAGUSD) Position Size Warning',
  'XAGUSD pip value is $50/lot — 5× higher than EURUSD ($10/lot). A 2.5-lot Silver position consumes the entire 5% daily limit via spread alone on a $10,000 account. Always check pip value before trading Silver.',
  'general',
  'high',
  NOW(),
  'fundingpips'
),
(
  'Maximum Drawdown Limit',
  'The overall maximum drawdown is 10% from initial account balance for 2-Step Standard and 1-Step accounts. 6% for 2-Step Pro and Zero. Breaching this limit terminates the challenge.',
  'daily_loss',
  'critical',
  NOW(),
  'fundingpips'
)
ON CONFLICT DO NOTHING;

-- ─────────────────────────────────────────────
-- ROW LEVEL SECURITY (for production)
-- ─────────────────────────────────────────────

ALTER TABLE rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE rule_acknowledgements ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

-- Allow public read on rules
CREATE POLICY "Public rules read" ON rules FOR SELECT USING (true);

-- Traders can only see their own acknowledgements
CREATE POLICY "Own acks only" ON rule_acknowledgements
  FOR ALL USING (trader_id = auth.uid()::text);

-- Service role bypasses RLS (for server.js with service key)
