-- Profile upgrades: favorite team, winner pick, top scorer pick

alter table public.profiles
  add column if not exists favorite_team text,
  add column if not exists favorite_team_flag text,
  add column if not exists avatar_color text default '#0369a1',
  add column if not exists predicted_winner text,
  add column if not exists predicted_winner_flag text,
  add column if not exists predicted_top_scorer_id uuid;

-- Players table (for top scorer selection)
create table if not exists public.players (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  team text not null,
  team_flag text not null,
  position text not null default 'Attaquant',
  goals integer not null default 0
);

alter table public.profiles
  add constraint fk_predicted_top_scorer
  foreign key (predicted_top_scorer_id)
  references public.players(id)
  on delete set null;

-- RLS for players (read-only for everyone)
alter table public.players enable row level security;

create policy "Players readable by authenticated users"
  on public.players for select to authenticated using (true);

-- Allow users to update their own profile
create policy "Users can update their own profile"
  on public.profiles for update to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);
