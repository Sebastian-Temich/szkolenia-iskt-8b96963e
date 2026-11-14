# Zadania

Plik wspólny. Tabelę generuje `scripts/sync-status.sh`, nie edytuj jej ręcznie.

<!-- sync-status:start -->
| Zadanie | Tytuł | Status | Iteracja | Kamień milowy | PR | CI |
|---|---|---|---|---|---|---|
| #6 | Przejście z bun na pnpm i CI jakości | done | 1 | M1 Uruchomienie lokalne | #11 merged | pass |
| #7 | Migracja bazowa 1:1 z chmurą i job bazy w CI | done | 1 | M1 Uruchomienie lokalne | #12 merged | pass |
| #8 | Dane startowe, konta testowe i uruchomienie lokalne z instrukcją | done | 2 | M1 Uruchomienie lokalne | #13 merged | pass |
| #9 | Testy zasad dostępu (pgTAP) | done | 2 | M1 Uruchomienie lokalne | #14 merged | pass |
| #10 | Dokumentacja wydania M1 i regresja | done | 1 | M1 Uruchomienie lokalne | #15 merged | pass |
| #18 | Okno zapisu z nazwą szkolenia na stronie szkolenia | done | 2 | - | #19 merged | pass |
| #20 | Testy E2E Playwright w CI (chromium i webkit) | done | 1 | - | #21 merged | pass |
| #25 | Migracja uprawnień funkcji ról i jednej zasady odczytu na rolę | done | 2 | M2 Bezpieczeństwo bazy | #28 merged | pass |
| #26 | Konfiguracja logowania lokalnie i nowe hasła testowe | done | 1 | M2 Bezpieczeństwo bazy | #29 merged | pass |
| #27 | Dokumentacja wydania M2 | done | 1 | M2 Bezpieczeństwo bazy | #30 merged | pass |
| #33 | Aktualizacja paczek z podatnościami i usunięcie nieużywanych komponentów szablonu | done | 1 | - | #34 merged | pass |
<!-- sync-status:end -->

## Mapa zadań z planu

Sekcję uzupełnia `shctl task create`: ID z pliku YAML i numer issue.

<!-- shctl:mapa:start -->
| ID | Issue | Tytuł | Zależności |
|---|---|---|---|
| T1 | #6 | Przejście z bun na pnpm i CI jakości | - |
| T2 | #7 | Migracja bazowa 1:1 z chmurą i job bazy w CI | #6 |
| T3 | #8 | Dane startowe, konta testowe i uruchomienie lokalne z instrukcją | #7 |
| T4 | #9 | Testy zasad dostępu (pgTAP) | #8 |
| T5 | #10 | Dokumentacja wydania M1 i regresja | #6, #7, #8, #9 |
| S-20261113-okno-zapisu | #18 | Okno zapisu z nazwą szkolenia na stronie szkolenia | - |
| S-20261113-playwright-e2e | #20 | Testy E2E Playwright w CI (chromium i webkit) | - |
| T6 | #25 | Migracja uprawnień funkcji ról i jednej zasady odczytu na rolę | - |
| T7 | #26 | Konfiguracja logowania lokalnie i nowe hasła testowe | #25 |
| T8 | #27 | Dokumentacja wydania M2 | #25, #26 |
| S-20261114-paczki | #33 | Aktualizacja paczek z podatnościami i usunięcie nieużywanych komponentów szablonu | - |
<!-- shctl:mapa:end -->
