-- Add subscription fields to users table
-- Run this in Supabase SQL editor or via `supabase db push`

-- Create users table if it doesn't exist (for profile data)
create table if not exists public.users (
  id uuid references auth.users(id) on delete cascade primary key,
  email text,
  created_at timestamptz default now(),
  subscription_tier text default 'free' check (subscription_tier in ('free', 'pro', 'enthusiast')),
  stripe_customer_id text unique
);

-- If table already exists, add columns safely
alter table public.users
  add column if not exists subscription_tier text default 'free' check (subscription_tier in ('free', 'pro', 'enthusiast'));

alter table public.users
  add column if not exists stripe_customer_id text unique;

-- Enable RLS
alter table public.users enable row level security;

-- Users can read their own row
create policy if not exists "users can read own profile"
  on public.users for select
  using (auth.uid() = id);

-- Users can update their own row (for non-sensitive fields)
create policy if not exists "users can update own profile"
  on public.users for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Trigger: auto-create user row on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, email)
  values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
