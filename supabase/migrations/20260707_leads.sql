-- Email capture: anonymous visitors who want their report emailed become
-- reachable leads. Write-only from the client; nobody can read it back
-- through the API (service role only).
-- Idempotent: safe to re-run after a partial earlier attempt.

create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  source text not null default 'report',
  vehicle text,
  created_at timestamptz not null default now()
);

create unique index if not exists leads_email_source_idx
  on public.leads (lower(email), source);

alter table public.leads enable row level security;

drop policy if exists "leads_insert" on public.leads;
create policy "leads_insert" on public.leads
  for insert to anon, authenticated with check (true);
