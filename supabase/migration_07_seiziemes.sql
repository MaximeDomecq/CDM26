-- Migration 07: Insertion des matchs des Seizièmes de finale
-- CDM 2026 — 16 matchs de la phase éliminatoire
-- Heures stockées en UTC (l'application affiche en CEST = UTC+2)
--
-- Correspondance CEST → UTC :
--   CEST 19h00 = UTC 17h00
--   CEST 22h30 = UTC 20h30
--   CEST 03h00 = UTC 01h00  (lendemain)
--   etc.

insert into public.matches (home_team, away_team, kickoff_at, phase)
values
  -- Sam. 28 juin (France) = Sam. 27 juin soir UTC
  ('Portugal',           'Croatie',            '2026-06-27T17:00:00Z', 'Seizièmes de finale'),
  ('Pays-Bas',           'Maroc',              '2026-06-27T20:30:00Z', 'Seizièmes de finale'),

  -- Lun. 30 juin (France) = Dim./Lun. 29-30 juin UTC
  ('Afrique du Sud',     'Canada',             '2026-06-30T01:00:00Z', 'Seizièmes de finale'),
  ('Brésil',             'Japon',              '2026-06-30T17:00:00Z', 'Seizièmes de finale'),
  ('Allemagne',          'Paraguay',           '2026-06-30T21:00:00Z', 'Seizièmes de finale'),

  -- Mer. 2 juillet (France) = Mar. 1er juillet UTC
  ('Côte d''Ivoire',     'Norvège',            '2026-07-01T01:00:00Z', 'Seizièmes de finale'),
  ('Mexique',            'Équateur',           '2026-07-01T16:00:00Z', 'Seizièmes de finale'),
  ('France',             'Suède',              '2026-07-01T20:00:00Z', 'Seizièmes de finale'),

  -- Jeu. 3 juillet (France) = Mer. 2 juillet UTC
  ('Belgique',           'Sénégal',            '2026-07-02T00:00:00Z', 'Seizièmes de finale'),
  ('États-Unis',         'Bosnie-Herzégovine', '2026-07-02T19:00:00Z', 'Seizièmes de finale'),
  ('Espagne',            'Autriche',           '2026-07-02T23:00:00Z', 'Seizièmes de finale'),

  -- Ven. 4 juillet (France) = Jeu. 3 juillet UTC
  ('Angleterre',         'RD Congo',           '2026-07-03T03:00:00Z', 'Seizièmes de finale'),
  ('Colombie',           'Ghana',              '2026-07-03T18:00:00Z', 'Seizièmes de finale'),

  -- Sam. 5 juillet (France) = Ven./Sam. 3-4 juillet UTC
  ('Australie',          'Égypte',             '2026-07-03T22:00:00Z', 'Seizièmes de finale'),
  ('Suisse',             'Algérie',            '2026-07-04T01:30:00Z', 'Seizièmes de finale')

  -- Même heure qu'Australie/Égypte (deux matchs simultanés à minuit heure française)
  ,('Argentine',          'Cap-Vert',            '2026-07-03T22:00:00Z', 'Seizièmes de finale')
;
