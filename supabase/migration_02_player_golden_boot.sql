-- Add Golden Boot flag to players table
ALTER TABLE public.players
  ADD COLUMN IF NOT EXISTS won_golden_boot boolean NOT NULL DEFAULT false;

-- To award Golden Boot at end of tournament, run:
-- UPDATE public.players SET won_golden_boot = true WHERE name ILIKE '%PlayerName%';
