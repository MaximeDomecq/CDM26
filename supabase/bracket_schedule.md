# CDM 2026 — Calendrier de la phase éliminatoire

Toutes les heures sont en **CEST (UTC+2)**, stockées en UTC dans la DB.
Le bracket suit la structure de l'image officielle.

---

## Huitièmes de finale (R16)

| ID  | Date/heure CEST     | UTC stocké              | Affiche                                   |
|-----|---------------------|-------------------------|-------------------------------------------|
| H1  | Sam. 04/07  23h00   | 2026-07-04T21:00:00Z   | Win(Allemagne/Paraguay) vs Win(France/Suède) |
| H2  | Sam. 04/07  19h00   | 2026-07-04T17:00:00Z   | Win(Afrique du Sud/Canada) vs Win(Pays-Bas/Maroc) |
| H3  | Lun. 06/07  21h00   | 2026-07-06T19:00:00Z   | Win(Portugal/Croatie) vs Win(Espagne/Autriche) |
| H4  | Mar. 07/07  02h00   | 2026-07-07T00:00:00Z   | Win(États-Unis/Bosnie-Herzégovine) vs Win(Belgique/Sénégal) |
| H5  | Dim. 05/07  22h00   | 2026-07-05T20:00:00Z   | Win(Brésil/Japon) vs Win(Côte d'Ivoire/Norvège) |
| H6  | Lun. 06/07  02h00   | 2026-07-06T00:00:00Z   | Win(Mexique/Équateur) vs Win(Angleterre/RD Congo) |
| H7  | Mar. 07/07  18h00   | 2026-07-07T16:00:00Z   | Win(Argentine/Cap-Vert) vs Win(Australie/Égypte) |
| H8  | Mar. 07/07  22h00   | 2026-07-07T20:00:00Z   | Win(Suisse/Algérie) vs Win(Colombie/Ghana) |

---

## Quarts de finale (QF)

| ID  | Date/heure CEST     | UTC stocké              | Affiche                 |
|-----|---------------------|-------------------------|-------------------------|
| QF1 | Mer. 09/07  22h00   | 2026-07-09T20:00:00Z   | Win(H1) vs Win(H2)     |
| QF2 | Jeu. 10/07  21h00   | 2026-07-10T19:00:00Z   | Win(H3) vs Win(H4)     |
| QF3 | Sam. 11/07  23h00   | 2026-07-11T21:00:00Z   | Win(H5) vs Win(H6)     |
| QF4 | Dim. 12/07  03h00   | 2026-07-12T01:00:00Z   | Win(H7) vs Win(H8)     |

---

## Demi-finales (SF)

| ID  | Date/heure CEST     | UTC stocké              | Affiche                    |
|-----|---------------------|-------------------------|----------------------------|
| SF1 | Mar. 14/07  21h00   | 2026-07-14T19:00:00Z   | Win(QF1) vs Win(QF2)      |
| SF2 | Mer. 15/07  21h00   | 2026-07-15T19:00:00Z   | Win(QF3) vs Win(QF4)      |

---

## Finale

| Date/heure CEST     | UTC stocké              | Affiche                    |
|---------------------|-------------------------|----------------------------|
| Dim. 19/07  21h00   | 2026-07-19T19:00:00Z   | Win(SF1) vs Win(SF2)      |

---

## Phase correspondante dans la DB

- Seizièmes de finale  → `"Seizièmes de finale"`
- Huitièmes de finale  → `"Huitièmes de finale"`
- Quarts de finale     → `"Quarts de finale"`
- Demi-finales         → `"Demi-finales"`
- Finale               → `"Finale"`
