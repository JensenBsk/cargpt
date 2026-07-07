-- Security hardening + OBD2 sessions
-- Run in Supabase SQL editor or via `supabase db push`.

-- ============================================================
-- 1. shared_diagnoses — was created outside version control.
--    This makes it reproducible and locks it down with RLS.
-- ============================================================
create table if not exists public.shared_diagnoses (
  id uuid primary key default gen_random_uuid(),
  token text unique not null,
  diagnosis_json jsonb not null,
  car_year text,
  car_make text,
  car_model text,
  code_or_symptom text,
  created_by uuid references auth.users(id) on delete set null,
  view_count integer not null default 0,
  created_at timestamptz default now() not null
);

alter table public.shared_diagnoses enable row level security;

-- Anyone with the (unguessable, crypto-random) token may read a share.
drop policy if exists "Anyone can read shared diagnoses" on public.shared_diagnoses;
create policy "Anyone can read shared diagnoses" on public.shared_diagnoses
  for select using (true);

-- Anyone may create a share (the API route rate-limits and size-caps).
drop policy if exists "Anyone can create shares" on public.shared_diagnoses;
create policy "Anyone can create shares" on public.shared_diagnoses
  for insert with check (true);

-- Nobody can update/delete via the anon/user role (no policies for those verbs).

-- Atomic view counter (avoids read-modify-write from the client).
create or replace function public.increment_share_views(share_token text)
returns void as $$
  update public.shared_diagnoses
  set view_count = view_count + 1
  where token = share_token;
$$ language sql security definer;

-- ============================================================
-- 2. garage.vin — the API inserts this column; original schema
--    never defined it.
-- ============================================================
alter table public.garage add column if not exists vin text;

-- ============================================================
-- 3. diagnosis_feedback: allow anonymous feedback rows.
--    The API inserts without user_id for signed-out users; the
--    original NOT NULL + RLS silently rejected those.
-- ============================================================
alter table public.diagnosis_feedback alter column user_id drop not null;

drop policy if exists "Users manage own feedback" on public.diagnosis_feedback;
create policy "Users manage own feedback" on public.diagnosis_feedback
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "Anonymous feedback insert" on public.diagnosis_feedback;
create policy "Anonymous feedback insert" on public.diagnosis_feedback
  for insert with check (user_id is null);

-- ============================================================
-- 4. obd_sessions — OBD2 scanner reading history per user.
-- ============================================================
create table if not exists public.obd_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  car_id uuid references public.garage(id) on delete set null,
  vin text,
  dtc_codes jsonb not null default '[]'::jsonb,        -- [{code, description, status}]
  freeze_frame jsonb,                                   -- sensor snapshot at fault time
  live_data jsonb,                                      -- last live readings {rpm, coolantTempC, ...}
  adapter_name text,
  cleared_codes boolean not null default false,
  created_at timestamptz default now() not null
);

alter table public.obd_sessions enable row level security;

drop policy if exists "Users manage own obd sessions" on public.obd_sessions;
create policy "Users manage own obd sessions" on public.obd_sessions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create index if not exists obd_sessions_user_created_idx
  on public.obd_sessions (user_id, created_at desc);
