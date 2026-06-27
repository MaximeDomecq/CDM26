-- Migration 05 — Table league_messages (chat en temps réel)
-- À exécuter dans le SQL Editor du dashboard Supabase

create table public.league_messages (
  id          uuid        primary key default gen_random_uuid(),
  league_id   uuid        not null references public.leagues(id) on delete cascade,
  user_id     uuid        not null references public.profiles(id) on delete cascade,
  display_name text       not null,
  content     text        not null check (char_length(content) between 1 and 300),
  created_at  timestamptz default now()
);

create index on public.league_messages (league_id, created_at);

alter table public.league_messages enable row level security;

-- Lecture : tout membre de la ligue voit les messages
create policy "League members can view messages"
  on public.league_messages for select to authenticated
  using (
    exists (
      select 1 from public.league_members
      where league_id = league_messages.league_id
        and user_id = auth.uid()
    )
  );

-- Écriture : membre de la ligue, seulement son propre message
create policy "League members can send messages"
  on public.league_messages for insert to authenticated
  with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.league_members
      where league_id = league_messages.league_id
        and user_id = auth.uid()
    )
  );

-- Active Supabase Realtime sur cette table (indispensable pour le temps réel)
alter publication supabase_realtime add table public.league_messages;
