# Raport QA: M1 Uruchomienie lokalne

Data: 2026-11-13T08:26Z
Commit: 273554a

## Zakres

Kamień M1 „Uruchomienie lokalne” (`docs/04-plan/plan.md`), wymagania W-01…W-07
(`docs/00-intake/specyfikacja.md`).

Zamknięte issue kamienia:

- #6 Przejście z bun na pnpm i CI jakości (PR #11)
- #7 Migracja bazowa 1:1 z chmurą i job bazy w CI (PR #12)
- #8 Dane startowe, konta testowe i uruchomienie lokalne z instrukcją (PR #13)
- #9 Testy zasad dostępu (pgTAP) (PR #14)
- #10 Dokumentacja wydania M1 i regresja (PR #15)

Pominięte („not planned”): brak.

Przepływy między funkcjami: migracja → dane startowe → odczyt publiczny (katalog, trenerzy,
przypisania) → logowanie redaktora → zapis w panelu; migracja/testy → job CI `baza`.
Scenariusze odbioru: O-1…O-10 z planu. Test ręczny właściciela 2026-11-13 (O-4…O-8): „wszystko ok”
(`docs/decyzje.md`).

## Wyniki testów

| Obszar | Wynik | Uwagi |
|---|---|---|
| E2E chromium | nie dotyczy | Playwright i job `e2e` poza zakresem M1 (specyfikacja, „Typ projektu”); ścieżki UI sprawdził test ręczny właściciela (O-4…O-8). Uwaga w „Drobnych uwagach” |
| E2E webkit | nie dotyczy | jak wyżej |
| Integracja | pass | pgTAP 119/119: `shctl db reset` i `shctl db test` na `main` 273554a (6 plików: `dane_startowe`, `rls_funkcje_rol`, `rls_odczyt_szkicow`, `rls_redakcja`, `rls_zapis_bez_roli`, `schemat_chmury`); job CI `baza` zielony na PR #12–#14 |
| Testy jednostkowe | pass | vitest 22 pliki, 230/230 na `main` 273554a (`vitest run` w głównej kopii); job CI `jakosc` (lint, typecheck, test, build) zielony na `main` |
| Testy QA | pass | O-9: celowo czerwony test pgTAP na PR #16 (commit e2d8b4d) → job `baza` czerwony (run 43393398627: „Failed 1/1”, „Result: FAIL”), pozostałe 119 testów ok; test usunięty w kolejnym commicie |
| Sekrety | pass | `gitleaks git --redact`: 1 znalezisko w historii (`.env`, commit 58e4f31): znany klucz publishable roli anon, przyjęty decyzją właściciela 2026-11-12; nowych brak |

Niestabilne testy: brak.

## Zgodność z wymaganiami

| Wymaganie | Wynik | Dowód |
|---|---|---|
| W-01 pnpm | spełnione | `bun.lock`, `bunfig.toml` usunięte; job `jakosc` z `pnpm install --frozen-lockfile` zielony; 230/230 testów (O-1, O-10) |
| W-02 baza w repo 1:1 | spełnione | `shctl db reset` z migracji bez błędów; `schemat_chmury.test.sql` 7/7 porównuje katalog z `docs/04-plan/schemat-chmury.md` (O-2, O-3) |
| W-03 dane startowe | spełnione | `dane_startowe.test.sql` 9/9 (9 szkoleń, 6 trenerów, 11 przypisań, 2 konta); test ręczny właściciela (O-4, O-5) |
| W-04 uruchomienie lokalne | spełnione | README „Uruchomienie lokalne”; build z `.env.local` (T-8); test ręczny właściciela: serwis, panel, konto bez roli (O-4…O-8) |
| W-05 testy RLS | spełnione | 5 plików pgTAP RLS (anon, bez roli, editor, admin), zielone lokalnie i w CI; O-9 dowodzi, że błędny test czerwieni CI |
| W-06 CI | spełnione | joby `zmiany`, `jakosc`, `baza` (+ `check-dod`, `gitleaks`) na runnerach GitHuba; O-9: job `baza` czerwony przy zepsutym teście |
| W-07 bez zmian w działaniu | spełnione | 230/230 testów stanu wyjściowego; `docs/wydanie/techniczna/M1.md` (T-10): brak zmian funkcjonalnych w `src/`, brak zapisów do chmury i publikacji w Lovable |

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

- (przyczyna: test) Projekt nie ma Playwright ani joba CI `e2e`, choć kontrakt stacku (`AGENTS.md`,
  „Testy E2E”) go wymaga; M1 świadomie to pominął. Ścieżki UI (katalog, szczegół, panel, logowanie)
  sprawdza dziś tylko vitest na atrapie i test ręczny. Proponowane osobne zlecenie: Playwright w
  wersji z `konfiguracja.md`, chromium i webkit, smoke tras `/`, `/szkolenia`, `/trenerzy`, `/panel`
  na lokalnym Supabase w CI; przy okazji zastąpić ręczny `tests/e2e/szkolenia.py`.

## Przyczyny

Liczba zgłoszeń wszystkich wag; orkiestrator przepisuje ten wiersz do „Przyczyn uwag” w `docs/metryki.md`.

| Źródło | Wymaganie | Kod | Test | Design | Bez przyczyny |
|---|---|---|---|---|---|
| QA M1 | 0 | 0 | 1 | 0 | 0 |

## Werdykt

PASS: wszystkie wymagania W-01…W-07 spełnione z dowodem, brak zgłoszeń krytycznych i istotnych.
