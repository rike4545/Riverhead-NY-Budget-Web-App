create table budgets (
  id uuid primary key,
  fiscal_year integer not null,
  adopted_total numeric,
  tax_levy numeric,
  fund_balance_ratio numeric,
  created_at timestamp default now()
);

create table ai_audit_log (
  id uuid primary key,
  agent_name text not null,
  event_type text not null,
  confidence numeric,
  created_at timestamp default now()
);

create table fiscal_events (
  id uuid primary key,
  event_name text not null,
  event_type text not null,
  event_date date not null,
  summary text,
  estimated_financial_impact numeric,
  created_at timestamp default now()
);

create table retirement_scenarios (
  id uuid primary key,
  scenario_name text not null,
  uptake_rate numeric,
  eligible_employees integer,
  year_one_net_impact numeric,
  created_at timestamp default now()
);
