-- Torque — run this in your Supabase SQL Editor

-- Garage (saved cars)
create table public.garage (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users on delete cascade not null,
  year integer not null,
  make text not null,
  model text not null,
  mods text,
  has_tune boolean not null default false,
  nickname text,
  created_at timestamptz default now() not null
);

-- Diagnoses (history)
create table public.diagnoses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users on delete cascade not null,
  car_id uuid references public.garage on delete set null,
  year integer not null,
  make text not null,
  model text not null,
  issue text not null,
  mods text,
  has_tune boolean not null default false,
  diagnosis jsonb not null,
  created_at timestamptz default now() not null
);

-- Feedback
create table public.diagnosis_feedback (
  id uuid primary key default gen_random_uuid(),
  diagnosis_id uuid references public.diagnoses on delete cascade not null,
  user_id uuid references auth.users on delete cascade not null,
  resolved boolean not null,
  actual_fix text,
  created_at timestamptz default now() not null,
  unique(diagnosis_id, user_id)
);

-- User profiles (for ZIP and preferences)
create table public.user_profiles (
  id uuid references auth.users on delete cascade primary key,
  zip_code text,
  created_at timestamptz default now() not null
);

-- Enable Row Level Security
alter table public.garage enable row level security;
alter table public.diagnoses enable row level security;
alter table public.diagnosis_feedback enable row level security;
alter table public.user_profiles enable row level security;

-- Garage policies
create policy "Users manage own garage" on public.garage
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Diagnoses policies
create policy "Users manage own diagnoses" on public.diagnoses
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Feedback policies
create policy "Users manage own feedback" on public.diagnosis_feedback
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Profile policies
create policy "Users manage own profile" on public.user_profiles
  using (auth.uid() = id) with check (auth.uid() = id);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.user_profiles (id) values (new.id);
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
