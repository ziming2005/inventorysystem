-- SupabaseMCP schema for Dental Clinic Designer persistence
-- Run in the SQL editor of your Supabase project.

create extension if not exists "uuid-ossp";

-- Profiles (1:1 with auth.users)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  company_name text,
  phone text,
  job_position text,
  account_type text check (account_type in ('individual','company')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.profiles enable row level security;

create policy "Profiles are viewable by owner" on public.profiles
  for select using (auth.uid() = id);

create policy "Profiles are updatable by owner" on public.profiles
  for update using (auth.uid() = id)
  with check (auth.uid() = id);

create policy "Profiles are insertable by owner" on public.profiles
  for insert with check (auth.uid() = id);

-- Clinic designs (one per user for now, name column allows multiple later)
create table if not exists public.clinic_designs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  name text not null default 'default',
  layout_json jsonb not null,
  world_color text,
  floor_color text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create unique index if not exists clinic_designs_user_name_idx on public.clinic_designs(user_id, name);

alter table public.clinic_designs enable row level security;

create policy "Designs are readable by owner" on public.clinic_designs
  for select using (auth.uid() = user_id);

create policy "Designs are insertable by owner" on public.clinic_designs
  for insert with check (auth.uid() = user_id);

create policy "Designs are updatable by owner" on public.clinic_designs
  for update using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Designs are deletable by owner" on public.clinic_designs
  for delete using (auth.uid() = user_id);

-- Inventory items (flattened from the layout)
create table if not exists public.inventory_items (
  id uuid primary key default gen_random_uuid(),
  design_id uuid not null references public.clinic_designs(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade default auth.uid(),
  name text not null,
  brand text,
  sku text,
  quantity integer not null default 0,
  status text,
  uom text,
  unit_price numeric,
  vendor text,
  category text,
  description text,
  location text,
  tile_x integer,
  tile_y integer,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists inventory_items_design_idx on public.inventory_items(design_id);
create index if not exists inventory_items_user_idx on public.inventory_items(user_id);

alter table public.inventory_items enable row level security;

create policy "Inventory readable by owner" on public.inventory_items
  for select using (auth.uid() = user_id);

create policy "Inventory insertable by owner" on public.inventory_items
  for insert with check (auth.uid() = user_id);

create policy "Inventory updatable by owner" on public.inventory_items
  for update using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Inventory deletable by owner" on public.inventory_items
  for delete using (auth.uid() = user_id);
