-- PropEdge v2 Database Schema
-- PostgreSQL 15+
-- Comprehensive schema for FundingPips trader intelligence platform

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Rules table: Dynamic compliance rules from FundingPips
CREATE TABLE IF NOT EXISTS rules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  platform TEXT NOT NULL CHECK (platform IN ('FundingPips', 'Other')),
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL CHECK (category IN ('Consistency', 'Daily Loss', 'News Trading', 'Drawdown', 'Position Size', 'Other')),
  severity TEXT NOT NULL CHECK (severity IN ('info', 'warning', 'critical')),
  effective_date TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true,
  version INT DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Rule acknowledgements: Trader acceptance/awareness of rules
CREATE TABLE IF NOT EXISTS rule_acknowledgements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trader_id TEXT NOT NULL,
  rule_id UUID NOT NULL REFERENCES rules(id) ON DELETE CASCADE,
  platform TEXT NOT NULL,
  account_id TEXT,
  acknowledged_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  ip_address INET,
  user_agent TEXT,
  session_id TEXT,
  UNIQUE(trader_id, rule_id)
);

-- Audit log: All rule-related events for compliance
CREATE TABLE IF NOT EXISTS audit_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event TEXT NOT NULL CHECK (event IN ('rule_created', 'rule_updated', 'rule_acknowledged', 'rule_violation', 'payout_eligible', 'payout_denied')),
  trader_id TEXT,
  rule_id UUID REFERENCES rules(id) ON DELETE SET NULL,
  account_id TEXT,
  metadata JSONB,
  ip_address INET,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Report jobs: Async report generation
CREATE TABLE IF NOT EXISTS report_jobs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type TEXT NOT NULL CHECK (type IN ('monthly', 'quarterly', 'consistency', 'drawdown', 'pnl')),
  trader_id TEXT NOT NULL,
  account_id TEXT,
  date_range JSONB NOT NULL,
  format TEXT DEFAULT 'pdf',
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  download_url TEXT,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE
);

-- Leaderboard: Trader performance rankings
CREATE TABLE IF NOT EXISTS leaderboard (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trader_id TEXT NOT NULL UNIQUE,
  display_name TEXT,
  platform TEXT NOT NULL,
  period TEXT NOT NULL CHECK (period IN ('daily', 'weekly', 'monthly', 'all_time')),
  return_pct DECIMAL(8,2),
  win_rate DECIMAL(5,2),
  profit_factor DECIMAL(6,2),
  max_drawdown DECIMAL(6,2),
  total_trades INT,
  badge TEXT CHECK (badge IN ('rising_star', 'consistent_trader', 'profit_machine', 'risk_master', NULL)),
  account_type TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Trader sessions: Real-time sync metadata
CREATE TABLE IF NOT EXISTS trader_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trader_id TEXT NOT NULL UNIQUE,
  account_id TEXT NOT NULL,
  platform TEXT NOT NULL,
  consistency_score DECIMAL(5,2),
  last_sync_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for query performance
CREATE INDEX idx_rules_platform_active ON rules(platform, is_active);
CREATE INDEX idx_rules_category ON rules(category);
CREATE INDEX idx_rule_acknowledgements_trader ON rule_acknowledgements(trader_id);
CREATE INDEX idx_rule_acknowledgements_rule ON rule_acknowledgements(rule_id);
CREATE INDEX idx_audit_log_trader ON audit_log(trader_id);
CREATE INDEX idx_audit_log_event ON audit_log(event);
CREATE INDEX idx_audit_log_created ON audit_log(created_at DESC);
CREATE INDEX idx_report_jobs_trader ON report_jobs(trader_id);
CREATE INDEX idx_report_jobs_status ON report_jobs(status);
CREATE INDEX idx_leaderboard_period ON leaderboard(period);
CREATE INDEX idx_leaderboard_platform ON leaderboard(platform);
CREATE INDEX idx_trader_sessions_trader ON trader_sessions(trader_id);

-- Seed data: FundingPips compliance rules
INSERT INTO rules (platform, title, description, category, severity, is_active) VALUES
('FundingPips', 'Consistency Zero', 'Best daily profit cannot exceed 15% of total profit', 'Consistency', 'critical', true),
('FundingPips', 'Consistency On-Demand', 'Best daily profit cannot exceed 35% of total profit', 'Consistency', 'warning', true),
('FundingPips', 'Consistency Pro', 'Best daily profit cannot exceed 45% of total profit', 'Consistency', 'info', true),
('FundingPips', 'Daily Loss 2-Step Standard', 'Daily loss cannot exceed 5% of account balance', 'Daily Loss', 'critical', true),
('FundingPips', 'Daily Loss 2-Step Pro', 'Daily loss cannot exceed 3% of account balance', 'Daily Loss', 'critical', true),
('FundingPips', 'Daily Loss Consistency Zero', 'Daily loss cannot exceed 3% of account balance', 'Daily Loss', 'critical', true),
('FundingPips', 'News Trading Restriction', 'No news trading within 10 minute window', 'News Trading', 'warning', true),
('FundingPips', 'XAG Silver Warning', 'Position size warning at $50 per lot', 'Position Size', 'info', true);

-- Row Level Security (RLS) setup
ALTER TABLE rule_acknowledgements ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE report_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE trader_sessions ENABLE ROW LEVEL SECURITY;

-- Trigger for updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_rules_updated_at BEFORE UPDATE ON rules
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_leaderboard_updated_at BEFORE UPDATE ON leaderboard
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_trader_sessions_updated_at BEFORE UPDATE ON trader_sessions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
