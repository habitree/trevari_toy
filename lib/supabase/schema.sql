-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Water Logs Table
CREATE TABLE IF NOT EXISTS water_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  intensity VARCHAR(20) NOT NULL CHECK (intensity IN ('high', 'medium', 'low')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_water_logs_recorded_at ON water_logs(recorded_at DESC);

-- 2. Condition Memos Table
CREATE TABLE IF NOT EXISTS condition_memos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  memo_date DATE NOT NULL UNIQUE,
  condition_type VARCHAR(20) CHECK (condition_type IN ('tired', 'swollen', 'refreshed', 'normal')),
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_condition_memos_date ON condition_memos(memo_date DESC);

-- 3. AI Reports Table
CREATE TABLE IF NOT EXISTS ai_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  content TEXT NOT NULL,
  report_type VARCHAR(20) DEFAULT 'weekly' CHECK (report_type IN ('weekly', 'on_demand')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_reports_created_at ON ai_reports(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_reports_period ON ai_reports(period_start, period_end);

-- Updated_at Trigger Function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers
DROP TRIGGER IF EXISTS update_water_logs_updated_at ON water_logs;
CREATE TRIGGER update_water_logs_updated_at 
  BEFORE UPDATE ON water_logs 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_condition_memos_updated_at ON condition_memos;
CREATE TRIGGER update_condition_memos_updated_at 
  BEFORE UPDATE ON condition_memos 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();
