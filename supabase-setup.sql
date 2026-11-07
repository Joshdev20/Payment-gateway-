-- Payout — shared settings table.
-- Run this in the Supabase SQL editor, then paste the project URL and anon key
-- into js/config.js. Until you do, the app runs from localStorage alone.

create table if not exists public.settings (
  id         text primary key,
  value      jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.settings enable row level security;

-- The anon key ships in the browser, so treat this table as public data: it
-- holds the account details the payment pages display, and nothing secret.
create policy "settings are readable"
  on public.settings for select
  using (true);

create policy "settings are writable"
  on public.settings for insert
  with check (true);

create policy "settings are updatable"
  on public.settings for update
  using (true)
  with check (true);
