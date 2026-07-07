-- Email capture: anonymous visitors who want their report emailed become
-- reachable leads. Write-only from the client; nobody can read it back
-- through the API (service role only).

create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  source text not null default 'report',   -- report | landing | pricing
  vehicle text,                            -- "2019 Subaru WRX" for context
  created_at timestamptz not null default now()
);

-- Dedupe repeat submissions of the same email+source.
create unique index if not exists leads_email_source_idx on public.leads (lower(email), source);

alter table public.leads enable row level security;

-- Inserts allowed from the app (anon + signed-in); no select/update/delete.
create policy "leads_insert" on public.leads
  for insert to anon, authenticated with check (true);
