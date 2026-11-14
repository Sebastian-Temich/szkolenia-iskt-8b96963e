# Raport QA: M2 Bezpieczeństwo bazy

Data: 2026-11-13T22:08Z
Commit: 0cb5190

## Zakres

Kamień M2 „Bezpieczeństwo bazy” (cykl M2-bezpieczenstwo, `docs/04-plan/plan.md`), wymagania
W-08…W-11 (`docs/00-intake/specyfikacja.md`).

Zamknięte issue kamienia:

- #25 Migracja uprawnień funkcji ról i jednej zasady odczytu na rolę (PR #28, 2 iteracje)
- #26 Konfiguracja logowania lokalnie i nowe hasła testowe (PR #29)
- #27 Dokumentacja wydania M2 (PR #30)

Pominięte („not planned”): brak.

Przepływy: migracja M2 → odczyt publiczny gościa (bez funkcji ról) → logowanie redaktora i konta bez
roli nowymi hasłami → panel (funkcje ról jako authenticated). Scenariusze odbioru O-11…O-16 z planu.

## Wyniki testów

| Obszar | Wynik | Uwagi |
|---|---|---|
| E2E chromium | pass | job `e2e` na PR #29 (run 43512335956), po zmianie haseł i migracji M2: wszystkie testy zielone (te same 4 `test.fixme` znanych błędów dostępności z #20) |
| E2E webkit | pass | jak wyżej, ten sam job (oba projekty) |
| Integracja | pass | pgTAP 131/131 (7 plików, `shctl db test`, T-26); job `baza` zielony na PR #28 i #29: `db lint` bez błędów, `db advisors` „No issues found” (wcześniej 3 × WARN 0006) |
| Testy jednostkowe | pass | vitest 23 pliki, 241 testów (T-25, T-26); job `jakosc` zielony |
| Testy QA | pass | scenariusze O-11…O-16 pokryte istniejącymi testami (niżej); bez nowych plików w `e2e/qa/` |
| Sekrety | pass | gitleaks w CI zielone na PR #28–#30; hasła testowe jawne tylko dla kont lokalnych (decyzja Z1) |

Niestabilne testy: brak.

## Zgodność z wymaganiami

| Wymaganie | Wynik | Dowód |
|---|---|---|
| W-08 goście bez funkcji ról | spełnione | pgTAP `rls_funkcje_rol`: anon → 42501 dla `is_staff`, `is_admin`, `moje_role`; zalogowani bez zmian (O-11); E2E stron publicznych zielone (gość nie woła funkcji ról) |
| W-09 jedna zasada odczytu na rolę | spełnione | test pgTAP liczący zasady SELECT w `pg_policies`: 1 na rolę i tabelę; advisor bez 0006; `rls_odczyt_szkicow` i `rls_redakcja` bez zmian oczekiwań; EXPLAIN przed i po w T-25.md (O-14, O-15) |
| W-10 konfiguracja logowania | spełnione | `config.toml`: `site_url` http://localhost:8080, redirecty 8080, hasła ≥ 8 z `lower_upper_letters_digits`; seed, README, E2E na nowych hasłach; logowanie obu kont przez lokalne API (T-26) (O-12, O-13) |
| W-11 testy i regresja | spełnione | `schemat_chmury.test.sql` z różnicami oznaczonymi „M2, ADR-003”; joby `baza`, `jakosc`, `e2e` zielone; dokumentacja wydania `docs/wydanie/techniczna/M2.md` (O-16) |

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

- brak

## Przyczyny

Liczba zgłoszeń wszystkich wag; orkiestrator przepisuje ten wiersz do „Przyczyn uwag” w `docs/metryki.md`.

| Źródło | Wymaganie | Kod | Test | Design | Bez przyczyny |
|---|---|---|---|---|---|
| QA M2 | 0 | 0 | 0 | 0 | 0 |

## Werdykt

PASS: W-08…W-11 spełnione z dowodem w testach i CI, brak zgłoszeń krytycznych i istotnych.
