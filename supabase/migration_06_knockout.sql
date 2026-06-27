-- Migration 06: Knockout stage scoring support
-- Run this in Supabase SQL editor

-- Add knockout result fields to matches
alter table public.matches
  add column if not exists extra_time_home_score integer,
  add column if not exists extra_time_away_score integer,
  add column if not exists match_end_type text check (match_end_type in ('90min', 'aet', 'pens')),
  add column if not exists winner_team text;

-- Add knockout prediction fields to predictions
alter table public.predictions
  add column if not exists qualifier_team text,
  add column if not exists predicted_context text check (predicted_context in ('90min', '+'));
