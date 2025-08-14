-- SLA Tracking tables for uptime by service/system

DO $$ BEGIN
  CREATE TYPE window_status AS ENUM ('OK','AT_RISK','BREACHED');
EXCEPTION WHEN duplicate_object THEN null; END $$;

CREATE TABLE IF NOT EXISTS "SlaPolicy" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id UUID NULL,
  system_id UUID NULL,
  target_pct NUMERIC(5,3) NOT NULL CHECK (target_pct >= 0 AND target_pct <= 100),
  period TEXT NOT NULL CHECK (period = 'MONTH'),
  timezone TEXT NOT NULL,
  active_from TIMESTAMPTZ NOT NULL,
  active_to TIMESTAMPTZ NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "MaintenanceWindow" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id UUID NULL,
  system_id UUID NULL,
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ NOT NULL CHECK (ends_at > starts_at),
  reason TEXT NULL,
  recurrence_rule TEXT NULL
);

CREATE TABLE IF NOT EXISTS "Incident" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id UUID NOT NULL,
  started_at TIMESTAMPTZ NOT NULL,
  ended_at TIMESTAMPTZ NULL,
  is_planned BOOLEAN NOT NULL DEFAULT false,
  source TEXT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_incident_service_started ON "Incident"(service_id, started_at);

CREATE TABLE IF NOT EXISTS "SlaWindow" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id UUID NULL,
  system_id UUID NULL,
  period_start TIMESTAMPTZ NOT NULL,
  period_end TIMESTAMPTZ NOT NULL,
  availability_pct NUMERIC(6,4) NOT NULL,
  error_budget_allowed_ms INTEGER NOT NULL,
  error_budget_used_ms INTEGER NOT NULL,
  status window_status NOT NULL,
  computed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  needs_recompute BOOLEAN NOT NULL DEFAULT false
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_slawindow_service_period ON "SlaWindow"(service_id, period_start, period_end);

CREATE TABLE IF NOT EXISTS "Violation" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  policy_id UUID NOT NULL,
  window_id UUID NOT NULL,
  expected_pct NUMERIC(5,3) NOT NULL,
  observed_pct NUMERIC(6,4) NOT NULL,
  reason TEXT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_violation_policy ON "Violation"(policy_id, created_at);

CREATE TABLE IF NOT EXISTS "System" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  composition_rule TEXT NOT NULL CHECK (composition_rule IN ('ALL','K_OF_N')),
  k_required INTEGER NULL
);

CREATE TABLE IF NOT EXISTS "SystemMember" (
  system_id UUID NOT NULL,
  service_id UUID NOT NULL,
  is_critical BOOLEAN NOT NULL DEFAULT true,
  PRIMARY KEY (system_id, service_id)
);
