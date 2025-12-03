-- Add trade_notes table (run this as an update to existing schema)

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
