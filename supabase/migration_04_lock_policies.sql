-- Migration 04: Enforce temporal locks at database level
-- Predictions locked at match kickoff; profile picks locked 8 min before WC start

-- =============================================
-- PREDICTIONS: kickoff lock via RLS + trigger
-- =============================================

-- Drop the permissive "for all" policy, replace with granular time-gated ones
drop policy if exists "Users can manage their own predictions" on public.predictions;

create policy "Users can insert own predictions before kickoff"
  on public.predictions for insert to authenticated
  with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.matches m
      where m.id = match_id
        and m.kickoff_at > now()
    )
  );

create policy "Users can update own predictions before kickoff"
  on public.predictions for update to authenticated
  using (auth.uid() = user_id)
  with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.matches m
      where m.id = match_id
        and m.kickoff_at > now()
    )
  );

create policy "Users can delete own predictions"
  on public.predictions for delete to authenticated
  using (auth.uid() = user_id);

-- Belt-and-suspenders: trigger fires before any insert/update, even via service role
create or replace function public.fn_check_prediction_kickoff()
returns trigger language plpgsql security definer as $$
begin
  if exists (
    select 1 from public.matches
    where id = NEW.match_id
      and kickoff_at <= now()
  ) then
    raise exception 'Impossible de modifier un pronostic après le coup d''envoi.';
  end if;
  return NEW;
end;
$$;

drop trigger if exists trg_prediction_kickoff on public.predictions;
create trigger trg_prediction_kickoff
  before insert or update on public.predictions
  for each row execute function public.fn_check_prediction_kickoff();

-- =============================================
-- PROFILES: pick fields locked 8 min before WC
-- =============================================

create or replace function public.fn_check_profile_pick_lock()
returns trigger language plpgsql security definer as $$
begin
  if (
    new.favorite_team           is distinct from old.favorite_team
    or new.favorite_team_flag   is distinct from old.favorite_team_flag
    or new.predicted_winner     is distinct from old.predicted_winner
    or new.predicted_winner_flag is distinct from old.predicted_winner_flag
    or new.predicted_top_scorer_id is distinct from old.predicted_top_scorer_id
  ) and now() >= '2026-06-11T18:52:00Z'::timestamptz then
    raise exception 'Les pronostics sont verrouillés. Le tournoi a commencé.';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_profile_pick_lock on public.profiles;
create trigger trg_profile_pick_lock
  before update on public.profiles
  for each row execute function public.fn_check_profile_pick_lock();
