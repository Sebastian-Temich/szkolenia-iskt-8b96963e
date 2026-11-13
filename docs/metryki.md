# Metryki

Plik wspólny, aktualizuje orkiestrator. Pomiar poglądowy, służy też do porównań w `sh-dryrun`.

| Zlecenie | Tryb | Czas | Zadania | Iteracje | Eskalacje | Uwagi |
|---|---|---|---|---|---|---|
| #6 Przejście z bun na pnpm i CI jakości | M | 8min | 1 | 1 | 0 | PR #11 |
| #7 Migracja bazowa 1:1 z chmurą i job bazy w CI | M | 19min | 1 | 1 | 0 | PR #12 |
| #8 Dane startowe, konta testowe i uruchomienie lokalne z instrukcją | M | 22min | 1 | 2 | 0 | PR #13 |
| #9 Testy zasad dostępu (pgTAP) | M | 24min | 1 | 2 | 0 | PR #14 |
| #10 Dokumentacja wydania M1 i regresja | M | 8min | 1 | 1 | 0 | PR #15 |
| #18 Okno zapisu z nazwą szkolenia na stronie szkolenia | S | 1h 48min | 1 | 2 | 0 | PR #19 |
| #20 Testy E2E Playwright w CI (chromium i webkit) | S | 8h 43min | 1 | 1 | 0 | PR #21 |

Eskalacje nie liczą pytań workera (`shctl escalate --typ pytanie`): są w „Uwagach” jako „pytania: N”.

## Przyczyny uwag

Zgłoszenia review (wiersz dopisuje `shctl task close`) i QA (wiersz z raportu przepisuje orkiestrator)
według przyczyny: wymaganie, kod, test, design.

| Źródło | Wymaganie | Kod | Test | Design | Bez przyczyny |
|---|---|---|---|---|---|
| review PR #13 (#8 Dane startowe, konta testowe i uruchomienie lokalne z instrukcją) | 0 | 0 | 1 | 0 | 0 |
| review PR #14 (#9 Testy zasad dostępu (pgTAP)) | 0 | 0 | 2 | 0 | 0 |
| QA M1 | 0 | 0 | 1 | 0 | 0 |
| review PR #19 (#18 Okno zapisu z nazwą szkolenia na stronie szkolenia) | 0 | 3 | 1 | 0 | 0 |
| review PR #21 (#20 Testy E2E Playwright w CI (chromium i webkit)) | 0 | 1 | 0 | 0 | 0 |
