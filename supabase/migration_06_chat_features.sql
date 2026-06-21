-- Migration 06 — Fonctionnalités chat : réactions, GIFs, réponses

-- Ajout colonnes à league_messages
alter table public.league_messages
  add column if not exists reply_to_id uuid references public.league_messages(id) on delete set null,
  add column if not exists gif_url text;

-- Table réactions
create table if not exists public.league_message_reactions (
  message_id  uuid  not null references public.league_messages(id) on delete cascade,
  user_id     uuid  not null references public.profiles(id) on delete cascade,
  emoji       text  not null check (char_length(emoji) <= 10),
  created_at  timestamptz default now(),
  primary key (message_id, user_id, emoji)
);

alter table public.league_message_reactions enable row level security;

create policy "Reactions viewable by authenticated"
  on public.league_message_reactions for select to authenticated using (true);

create policy "Users can react"
  on public.league_message_reactions for insert to authenticated
  with check (auth.uid() = user_id);

create policy "Users can unreact"
  on public.league_message_reactions for delete to authenticated
  using (auth.uid() = user_id);

alter publication supabase_realtime add table public.league_message_reactions;
