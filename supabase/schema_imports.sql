-- Supabase schema for Polymarket CSV imports (Phase 1)

create table if not exists public.polymarket_fills (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  wallet text not null,
  market_id text not null,
  market_title text not null,
  side text not null check (side in ('buy','sell')),
  price numeric not null,
  quantity numeric not null,
  fee numeric default 0,
  timestamp timestamptz not null,
  outcome_status text default 'open',
  resolution_price numeric,
  tx_hash text,
  raw_json jsonb,
  created_at timestamptz default now()
);

create index if not exists polymarket_fills_user_idx on public.polymarket_fills(user_id);
create index if not exists polymarket_fills_wallet_idx on public.polymarket_fills(wallet);
create index if not exists polymarket_fills_market_idx on public.polymarket_fills(market_id);
create index if not exists polymarket_fills_time_idx on public.polymarket_fills(timestamp);

-- normalized trades linked to journal
create table if not exists public.journal_trades (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  date date not null,
  market_id text not null,
  market_title text not null,
  category text not null,
  entry numeric,
  exit numeric,
  pnl numeric default 0,
  outcome text check (outcome in ('win','loss','open')),
  volume numeric default 0,
  source_fill_id text references public.polymarket_fills(id) on delete set null,
  created_at timestamptz default now()
);

create index if not exists journal_trades_user_date_idx on public.journal_trades(user_id, date);
create index if not exists journal_trades_market_idx on public.journal_trades(market_id);

-- user settings for wallet linking
create table if not exists public.user_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  polymarket_wallet text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists user_settings_wallet_idx on public.user_settings(polymarket_wallet);
