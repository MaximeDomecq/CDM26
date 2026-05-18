-- App-wide config (singleton rows keyed by name)
CREATE TABLE IF NOT EXISTS public.app_config (
  key   text PRIMARY KEY,
  value text
);

-- Seed default rows
INSERT INTO public.app_config (key, value) VALUES
  ('tournament_winner', null)
ON CONFLICT (key) DO NOTHING;

-- RLS: anyone authenticated can read; only service role can write
ALTER TABLE public.app_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Config readable by authenticated users"
  ON public.app_config FOR SELECT TO authenticated USING (true);
