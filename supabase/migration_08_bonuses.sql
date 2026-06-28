-- Migration 08: Bonus multiplier system
-- Chaque joueur dispose de 2 bonus ×2 et 1 bonus ×3 par compétition
alter table public.predictions
  add column if not exists bonus_multiplier integer check (bonus_multiplier in (2, 3));
