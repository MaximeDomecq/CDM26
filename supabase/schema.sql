-- Profiles (auto-created on sign-up via trigger)
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null,
  created_at timestamptz default now()
);

-- Trigger: create profile on new user
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1))
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Matches
create table public.matches (
  id uuid primary key default gen_random_uuid(),
  api_id integer unique,              -- football-data.org match id
  home_team text not null,
  away_team text not null,
  kickoff_at timestamptz not null,
  phase text not null default 'Groupe',  -- 'Groupe', 'Huitièmes', etc.
  home_score integer,
  away_score integer,
  created_at timestamptz default now()
);

-- Predictions
create table public.predictions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  match_id uuid not null references public.matches(id) on delete cascade,
  home_score integer not null,
  away_score integer not null,
  created_at timestamptz default now(),
  unique(user_id, match_id)
);

-- Leagues
create table public.leagues (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  invite_code text not null unique,
  created_by uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz default now()
);

-- League members
create table public.league_members (
  league_id uuid not null references public.leagues(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  joined_at timestamptz default now(),
  primary key (league_id, user_id)
);

-- Row Level Security
alter table public.profiles enable row level security;
alter table public.matches enable row level security;
alter table public.predictions enable row level security;
alter table public.leagues enable row level security;
alter table public.league_members enable row level security;

-- Profiles: readable by all authenticated users
create policy "Profiles are viewable by authenticated users"
  on public.profiles for select to authenticated using (true);

-- Matches: readable by all authenticated users, writable only via service role (cron)
create policy "Matches are viewable by authenticated users"
  on public.matches for select to authenticated using (true);

-- Predictions: users manage their own predictions, can read all (for leaderboard)
create policy "Users can manage their own predictions"
  on public.predictions for all to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Predictions are viewable by authenticated users"
  on public.predictions for select to authenticated using (true);

-- Leagues: readable by members, insertable by authenticated users
create policy "Leagues are viewable by members"
  on public.leagues for select to authenticated using (
    exists (
      select 1 from public.league_members
      where league_id = leagues.id and user_id = auth.uid()
    )
  );

create policy "Authenticated users can create leagues"
  on public.leagues for insert to authenticated
  with check (auth.uid() = created_by);

-- League members: users can see and join leagues
create policy "Members can view their leagues"
  on public.league_members for select to authenticated using (true);

create policy "Users can join leagues"
  on public.league_members for insert to authenticated
  with check (auth.uid() = user_id);
