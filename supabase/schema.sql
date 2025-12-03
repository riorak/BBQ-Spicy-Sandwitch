-- Polyedge schema (run in Supabase SQL editor)

-- Users table (extends auth.users)
create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique not null,
  polymarket_wallet text,
  created_at timestamp with time zone default now()
);

-- Enable RLS
alter table public.users enable row level security;

-- Users can only see/edit their own data
create policy "Users can view own data"
  on public.users for select
  using (auth.uid() = id);

create policy "Users can update own data"
  on public.users for update
  using (auth.uid() = id);

-- Categories (public read, no RLS needed)
create table if not exists public.categories (
  id serial primary key,
  slug text unique not null,
  name text not null
);

insert into public.categories (slug, name) values
  ('politics','Politics'),
  ('sports','Sports'),
  ('crypto','Crypto'),
  ('science','Science/News')
  on conflict (slug) do nothing;

-- Markets (public read)
create table if not exists public.markets (
  id text primary key,
  title text not null,
  category_id int references public.categories(id),
  resolution_price numeric,
  resolved_at timestamp with time zone,
  created_at timestamp with time zone default now()
);

-- Trades
create table if not exists public.trades (
  id bigserial primary key,
  user_id uuid references public.users(id) on delete cascade,
  market_id text references public.markets(id),
  side text check (side in ('buy','sell')),
  price numeric not null,
  quantity numeric not null,
  fee numeric default 0,
  executed_at timestamp with time zone not null,
  tx_id text unique
);

alter table public.trades enable row level security;

create policy "Users can view own trades"
  on public.trades for select
  using (auth.uid() = user_id);

create policy "Users can insert own trades"
  on public.trades for insert
  with check (auth.uid() = user_id);

-- Day stats
create table if not exists public.day_stats (
  id bigserial primary key,
  user_id uuid references public.users(id) on delete cascade,
  date date not null,
  pnl numeric not null default 0,
  volume numeric not null default 0,
  categories text[] not null default '{}',
  created_at timestamp with time zone default now(),
  unique (user_id, date)
);

alter table public.day_stats enable row level security;

create policy "Users can view own stats"
  on public.day_stats for select
  using (auth.uid() = user_id);

create policy "Users can insert own stats"
  on public.day_stats for insert
  with check (auth.uid() = user_id);

create policy "Users can update own stats"
  on public.day_stats for update
  using (auth.uid() = user_id);

-- Journal entries
create table if not exists public.journal_entries (
  id bigserial primary key,
  user_id uuid references public.users(id) on delete cascade,
  date date not null,
  notes text,
  screenshots text[] default '{}',
  updated_at timestamp with time zone default now(),
  unique (user_id, date)
);

alter table public.journal_entries enable row level security;

create policy "Users can view own journal"
  on public.journal_entries for select
  using (auth.uid() = user_id);

create policy "Users can insert own journal"
  on public.journal_entries for insert
  with check (auth.uid() = user_id);

create policy "Users can update own journal"
  on public.journal_entries for update
  using (auth.uid() = user_id);

-- Trade notes and analysis
create table if not exists public.trade_notes (
  id bigserial primary key,
  user_id uuid references public.users(id) on delete cascade,
  trade_id bigint references public.trades(id) on delete cascade,
  notes text,
  screenshots text[] default '{}',
  ai_analysis jsonb,
  updated_at timestamp with time zone default now(),
  unique (user_id, trade_id)
);

alter table public.trade_notes enable row level security;

create policy "Users can view own trade notes"
  on public.trade_notes for select
  using (auth.uid() = user_id);

create policy "Users can insert own trade notes"
  on public.trade_notes for insert
  with check (auth.uid() = user_id);

create policy "Users can update own trade notes"
  on public.trade_notes for update
  using (auth.uid() = user_id);

create policy "Users can delete own trade notes"
  on public.trade_notes for delete
  using (auth.uid() = user_id);

-- Function to auto-create user row on first auth
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, email)
  values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

-- Trigger to create user on auth sign up
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
