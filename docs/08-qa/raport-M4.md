# Raport QA: M4 Baza produkcyjna

Data: 2026-11-16T21:33Z
Commit: 0dd2bed

## Zakres

Kamień M4 „Baza produkcyjna” (cykl M4-produkcja, `docs/04-plan/plan.md`), wymagania W-15…W-17
(`docs/00-intake/specyfikacja.md`), ADR-005.

Zamknięte issue kamienia:

- #61 Skrypty wdrożenia bazy produkcyjnej z testami w CI i instrukcja dla właściciela (PR #63)
- #62 Dokumentacja wydania M4 (PR #64)

Pominięte („not planned”): brak.

Przepływ: migracje z repo → skrypty `supabase/produkcja/` sprawdzone w CI na bazie bez seeda →
wykonanie instrukcji przez właściciela na projekcie vwnvbhiuundeunyzhdxj (2026-11-16) → odczyt
orkiestratora przez MCP (tylko odczyt) → logowanie przez lokalną aplikację z adresem produkcji.
Scenariusze O-25…O-33 z planu. Aplikacja bez zmian w M4, więc bez nowych testów w `e2e/qa/`.

## Wyniki testów

| Obszar | Wynik | Uwagi |
|---|---|---|
| E2E chromium | pass | job `e2e` na PR #63 (run 43864908598): 192/192 dla obu przeglądarek; regresja aplikacji po M4 |
| E2E webkit | pass | jak wyżej, ten sam job |
| Integracja (baza) | pass | job `baza`, run 43864908598: pgTAP 131/131 (7 plików); krok skryptów produkcji na bazie bez seeda: `01-sprawdz-baze.sql` po-M2 ZGODNA (historia obu migracji, 9 szkoleń), `09-cofnij.sql` COFNIĘTE (usunięte 2 wpisy historii), przed-M2 ZGODNA z pustą historią, powtórne cofnięcie bez zmian, ponowne M2 przez `psql -f` i po-M2 ZGODNA |
| Testy jednostkowe | pass | vitest 31 plików, wszystkie zielone (job `jakosc`, ten sam run) |
| Testy QA (`e2e/qa/`) | nie dotyczy | brak zmian aplikacji w M4; istniejące `e2e/qa/M3-…` zielone w jobie `e2e` |
| Produkcja (O-25…O-33) | pass z decyzjami | wykonanie właściciela i odczyt MCP 2026-11-16, szczegóły w komentarzu #62 i `docs/wydanie/techniczna/M4.md` |
| Sekrety | pass | gitleaks zielone na PR #63, #64; hasło bazy tylko u właściciela, adresy redakcji tylko `@example.com` w repo |

Niestabilne testy: brak.

## Zgodność z wymaganiami

| Wymaganie | Wynik | Dowód |
|---|---|---|
| W-15 schemat z migracjami i historią | spełnione | `migration list`: Local = Remote dla 20261112232552 i 20261113204457 (O-26); odczyt MCP: anon bez EXECUTE na `is_staff`, `is_admin`, `moje_role`, po 1 zasadzie SELECT na rolę (O-27, O-33); rollback sprawdzony w CI (O-31). Znana różnica skrótów ograniczeń w `01-sprawdz-baze.sql` (decyzje.md 2026-11-16, opcja A): definicje 16 + 13 ograniczeń zgodne z migracją bazową |
| W-16 oferta startowa | spełnione | `02-dane-startowe.sql` na produkcji; odczyt MCP: 9/9 opublikowanych, 0 trenerów, 0 przypisań (O-28); idempotencja w CI |
| W-17 logowanie i role | spełnione w zakresie M4 | ustawienia logowania w dashboardzie (O-30, potwierdzenie właściciela); logowanie kontem admina do `/panel` przez lokalną aplikację z adresem produkcji (O-32, potwierdzenie właściciela); konto bez roli `is_staff() = false` w symulacji CI. Konta redakcji i `03-role.sql` przesunięte przez właściciela na czas po uruchomieniu strony (decyzje.md 2026-11-16); skrypt ról sprawdzony w CI |

## Zgłoszenia

Tylko 🔴 krytyczne i 🟡 istotne; każde staje się issue `typ:qa` przez `shctl task create`.
Przyczyna: `wymaganie` (luka lub sprzeczność w specyfikacji albo karcie), `kod`, `test` (brak albo zły
test), `design` (brak lub niespójność designu).

| Issue | Waga | Przyczyna | Opis |
|---|---|---|---|
| brak | | | |

## Drobne uwagi

Zgłoszenia ⚪ drobne, bez issue; orkiestrator przenosi je do `docs/backlog-drobne.md`. Każda pozycja
zaczyna się od przyczyny, np. `- (przyczyna: design) odstęp nagłówka`.

- (przyczyna: test) `01-sprawdz-baze.sql` zgłasza na produkcji różnicę skrótów md5 ograniczeń tabel
  szkolenia i trenerzy mimo zgodnych definicji (Postgres 17.11 vs CI) i przerywa się przed symulacją
  ról; porównywać definicje po normalizacji (już w backlogu, 2026-11-16).
- (przyczyna: wymaganie) Konta redakcji i role (kroki 11–12 instrukcji) do wykonania przez właściciela
  po uruchomieniu strony na Vercel.

## Przyczyny

Liczba zgłoszeń wszystkich wag; orkiestrator przepisuje ten wiersz do „Przyczyn uwag” w `docs/metryki.md`.

| Źródło | Wymaganie | Kod | Test | Design | Bez przyczyny |
|---|---|---|---|---|---|
| QA M4 | 1 | 0 | 1 | 0 | 0 |

## Werdykt

PASS: W-15 i W-16 spełnione, W-17 spełnione w zakresie M4 (konta redakcji przesunięte decyzją
właściciela); brak zgłoszeń krytycznych i istotnych.
